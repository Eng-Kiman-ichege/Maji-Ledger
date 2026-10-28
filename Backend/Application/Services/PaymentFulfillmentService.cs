using System.Text.Json;
using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Services;

public class PaymentFulfillmentService(
    IApplicationDbContext db,
    ITariffCalculatorService tariffCalculator,
    IStsTokenService stsTokenService,
    ISmsGatewayService smsGateway) : IPaymentFulfillmentService
{
    public async Task<WaterPurchase> ProcessConfirmedPaymentAsync(
        PaymentAttempt attempt,
        string providerRef,
        decimal amountConfirmed,
        DateTime paidAt,
        CancellationToken ct = default)
    {
        // 1. Idempotency Check: Does a payment with this ProviderRef already exist?
        var existingPayment = await db.Payments
            .Include(p => p.WaterPurchase)
                .ThenInclude(wp => wp != null ? wp.WaterToken : null)
            .FirstOrDefaultAsync(p => p.ProviderRef == providerRef, ct);

        if (existingPayment?.WaterPurchase != null)
        {
            if (attempt.Status != PaymentAttemptStatus.Confirmed)
            {
                attempt.Confirm();
                await db.SaveChangesAsync(ct);
            }
            return existingPayment.WaterPurchase;
        }

        // 2. Confirm the Payment Attempt if not already confirmed
        if (attempt.Status != PaymentAttemptStatus.Confirmed)
        {
            attempt.Confirm();
        }

        // 3. Create or attach Payment
        Payment payment;
        if (existingPayment != null)
        {
            payment = existingPayment;
        }
        else
        {
            payment = Payment.Confirm(attempt.Id, providerRef, amountConfirmed, paidAt);
            db.Payments.Add(payment);
            await db.SaveChangesAsync(ct);
        }

        // 4. Resolve Meter and Active Tariff Schedule
        var meter = await db.Meters
            .Include(m => m.Tariff).ThenInclude(t => t != null ? t.Tiers : null)
            .Include(m => m.CurrentApartment).ThenInclude(a => a != null ? a.Building : null)
                .ThenInclude(b => b != null ? b.Property : null)
                    .ThenInclude(p => p != null ? p.Tariffs : null)
            .FirstOrDefaultAsync(m => m.Id == attempt.MeterId, ct)
            ?? throw new NotFoundException(nameof(Meter), attempt.MeterId);

        // Lookup priority: meter override -> property active tariff -> global active tariff
        WaterTariff? tariff = meter.Tariff;
        if (tariff == null || !tariff.IsActive)
        {
            tariff = meter.CurrentApartment?.Building?.Property?.Tariffs
                .FirstOrDefault(t => t.IsActive && (t.EffectiveTo == null || t.EffectiveTo > DateTime.UtcNow));
        }
        if (tariff == null || !tariff.IsActive)
        {
            tariff = await db.WaterTariffs
                .Include(t => t.Tiers)
                .FirstOrDefaultAsync(t => t.PropertyId == null && t.IsActive && (t.EffectiveTo == null || t.EffectiveTo > DateTime.UtcNow), ct);
        }

        decimal amountApplied = amountConfirmed;
        decimal unitsCalculated = 0;
        Guid? tariffId = null;

        if (tariff != null)
        {
            tariffId = tariff.Id;
            var calc = tariffCalculator.CalculateUnits(tariff, amountConfirmed);
            amountApplied = calc.NetAmountApplied;
            unitsCalculated = calc.UnitsCalculated;
        }
        else
        {
            // Default rate fallback (1 m³ per 100 KES) if no tariff schedule configured
            unitsCalculated = Math.Round(amountConfirmed / 100m, 4);
        }

        // 5. Create or load WaterPurchase
        var purchase = await db.WaterPurchases
            .Include(wp => wp.WaterToken)
            .FirstOrDefaultAsync(wp => wp.PaymentId == payment.Id, ct);

        if (purchase == null)
        {
            purchase = WaterPurchase.Create(payment.Id, attempt.MeterId, amountApplied, unitsCalculated, tariffId);
            db.WaterPurchases.Add(purchase);
            await db.SaveChangesAsync(ct);
        }

        // 6. STS Token Generation
        // Do not blindly retry token generation if a token was already issued for this purchase!
        if (purchase.WaterToken != null)
        {
            return purchase;
        }

        var requestPayload = JsonSerializer.Serialize(new
        {
            meterNumber = meter.MeterNumber,
            units = unitsCalculated,
            amount = amountConfirmed,
            currency = payment.Currency,
            purchaseId = purchase.Id,
            timestamp = DateTime.UtcNow
        });

        try
        {
            var stsToken = await stsTokenService.GenerateTokenAsync(meter.MeterNumber, unitsCalculated, ct);
            var stsResponsePayload = JsonSerializer.Serialize(new
            {
                token = stsToken,
                issuedAt = DateTime.UtcNow,
                status = "SUCCESS"
            });

            var stsRequestRef = $"STS-{purchase.Id:N}"[..16].ToUpperInvariant();
            var waterToken = WaterToken.Issue(purchase.Id, stsToken, stsRequestRef);
            db.WaterTokens.Add(waterToken);

            db.TokenGenerationAttempts.Add(TokenGenerationAttempt.RecordSuccess(
                purchase.Id, 1, requestPayload, stsResponsePayload));

            purchase.MarkTokenIssued();
            await db.SaveChangesAsync(ct);

            // 7. SMS Delivery
            if (!string.IsNullOrWhiteSpace(attempt.CustomerPhone))
            {
                var message = $"Maji Ledger: Token for meter {meter.MeterNumber} is {stsToken}. Units: {unitsCalculated:F2} m3. Paid: KES {amountConfirmed:F2}.";
                var smsRecord = SmsDeliveryRecord.Queue(waterToken.Id, attempt.CustomerPhone, message);
                db.SmsDeliveryRecords.Add(smsRecord);
                await db.SaveChangesAsync(ct);

                try
                {
                    var gatewayRef = await smsGateway.SendSmsAsync(attempt.CustomerPhone, message, ct);
                    smsRecord.MarkSent(gatewayRef);
                    smsRecord.MarkDelivered();
                    waterToken.MarkDelivered();
                    await db.SaveChangesAsync(ct);
                }
                catch (Exception)
                {
                    // SMS delivery failed, but token issuance remains confirmed and valid
                    smsRecord.MarkFailed();
                    waterToken.MarkDeliveryFailed();
                    await db.SaveChangesAsync(ct);
                }
            }
        }
        catch (Exception ex)
        {
            // STS failed: keep confirmed payment safe, record failure attempt, place transaction in recoverable TokenFailed state
            db.TokenGenerationAttempts.Add(TokenGenerationAttempt.RecordFailure(
                purchase.Id, 1, requestPayload, null, ex.Message));
            purchase.MarkTokenFailed();
            await db.SaveChangesAsync(ct);
        }

        return purchase;
    }
}
