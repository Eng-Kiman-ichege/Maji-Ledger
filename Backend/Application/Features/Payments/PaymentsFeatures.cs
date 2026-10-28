using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.Payments;

// ── DTOs ──────────────────────────────────────────────────────────────────────

/// <summary>
/// Returned to the customer after a payment initiation — contains the
/// provider-side reference needed to poll for status or for STK Push display.
/// </summary>
public record PaymentInitiationDto(
    Guid AttemptId,
    string? ProviderCheckoutId,
    PaymentAttemptStatus Status,
    DateTime ExpiresAt);

/// <summary>
/// Full payment summary returned to admins or for reconciliation purposes.
/// </summary>
public record PaymentAttemptDto(
    Guid Id,
    Guid MeterId,
    string MeterNumber,
    PaymentChannel Channel,
    string CustomerPhone,
    decimal RequestedAmount,
    PaymentAttemptStatus Status,
    string? ProviderCheckoutId,
    string? FailureReason,
    DateTime InitiatedAt,
    DateTime ExpiresAt,
    DateTime? CompletedAt,
    // Token info (present only on confirmed + token issued)
    string? WaterToken,
    decimal? UnitsIssued);

/// <summary>
/// Scan-to-Pay landing page payload — everything a customer needs to see.
/// </summary>
public record ScanToPayLandingDto(
    Guid MeterId,
    string MaskedMeterIdentifier,
    string PropertyName,
    string? BuildingName,
    string? UnitNumber,
    string PaymentProviderDisplayName,
    string BusinessShortCode,
    PaymentProviderType ProviderType,
    decimal BaseCharge = 0,
    decimal UnitRate = 0,
    bool IsTiered = false,
    string? TariffName = null);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetScanToPayLandingQuery(string PublicToken) : IRequest<ScanToPayLandingDto>;

public record GetPaymentAttemptQuery(Guid AttemptId) : IRequest<PaymentAttemptDto>;

public record GetPaymentHistoryQuery(Guid MeterId, int PageSize = 20, int Page = 1)
    : IRequest<List<PaymentAttemptDto>>;

public record GetAllPaymentsQuery(int PageSize = 50, int Page = 1)
    : IRequest<List<PaymentAttemptDto>>;

// ── Commands ──────────────────────────────────────────────────────────────────

/// <summary>Initiates a payment via QR Scan-to-Pay flow.</summary>
public record InitiateQrPaymentCommand(
    string PublicToken,
    string CustomerPhone,
    decimal Amount) : IRequest<PaymentInitiationDto>;

/// <summary>Initiates a payment via direct Paybill/USSD (no QR).</summary>
public record InitiateDirectPaymentCommand(
    Guid MeterId,
    Guid PaymentProviderConfigId,
    PaymentChannel Channel,
    string CustomerPhone,
    decimal Amount) : IRequest<PaymentInitiationDto>;

/// <summary>Provider callback — confirms or fails a payment attempt.</summary>
public record ConfirmPaymentCommand(
    string ProviderCheckoutId,
    string ProviderRef,
    decimal AmountConfirmed,
    DateTime PaidAt,
    bool Succeeded,
    string? FailureReason) : IRequest<Unit>;

/// <summary>Direct Paybill / USSD reconciliation payment.</summary>
public record ProcessPaybillPaymentCommand(
    string BusinessShortCode,
    string MeterNumber,
    string ProviderRef,
    decimal Amount,
    string CustomerPhone,
    DateTime PaidAt,
    PaymentChannel Channel = PaymentChannel.MpesaPaybill) : IRequest<PaymentAttemptDto>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetScanToPayLandingHandler(IApplicationDbContext db)
    : IRequestHandler<GetScanToPayLandingQuery, ScanToPayLandingDto>
{
    public async Task<ScanToPayLandingDto> Handle(GetScanToPayLandingQuery request, CancellationToken ct)
    {
        var qr = await db.QrCodeRegistrations
            .Include(q => q.Meter).ThenInclude(m => m.Tariff)
            .Include(q => q.Meter).ThenInclude(m => m.CurrentApartment)
                .ThenInclude(a => a != null ? a.Building : null)
                    .ThenInclude(b => b != null ? b.Property : null)
                        .ThenInclude(p => p != null ? p.Tariffs : null)
            .Include(q => q.PaymentProviderConfig)
            .FirstOrDefaultAsync(q => q.PublicToken == request.PublicToken, ct)
            ?? throw new NotFoundException("QrCode", request.PublicToken);

        if (qr.Status == QrCodeStatus.Disabled)
            throw new ConflictException("This QR code has been temporarily disabled by property management. Please contact the property manager.");

        if (qr.Status == QrCodeStatus.Revoked)
            throw new ConflictException("This QR code is permanently revoked and is no longer active for billing. Please contact the property manager.");

        var meter = qr.Meter;
        var apt = meter.CurrentApartment;
        var building = apt?.Building;
        var property = building?.Property;

        if (qr.PaymentProviderConfig.PropertyId.HasValue && property != null && qr.PaymentProviderConfig.PropertyId != property.Id)
            throw new ConflictException("The payment configuration does not match the property assigned to this meter. Please contact the property manager.");

        var tariff = meter.Tariff
            ?? property?.Tariffs.FirstOrDefault(t => t.IsActive && (t.EffectiveTo == null || t.EffectiveTo > DateTime.UtcNow))
            ?? await db.WaterTariffs.FirstOrDefaultAsync(t => t.PropertyId == null && t.IsActive && (t.EffectiveTo == null || t.EffectiveTo > DateTime.UtcNow), ct);

        return new ScanToPayLandingDto(
            meter.Id,
            meter.MaskedIdentifier,
            property?.Name ?? "Unknown Property",
            building?.Name,
            apt?.UnitNumber,
            qr.PaymentProviderConfig.DisplayName,
            qr.PaymentProviderConfig.BusinessShortCode,
            qr.PaymentProviderConfig.ProviderType,
            tariff?.BaseCharge ?? 0,
            tariff?.UnitRate ?? 0,
            tariff?.IsTiered ?? false,
            tariff?.Name);
    }
}

public class GetPaymentAttemptHandler(IApplicationDbContext db)
    : IRequestHandler<GetPaymentAttemptQuery, PaymentAttemptDto>
{
    public async Task<PaymentAttemptDto> Handle(GetPaymentAttemptQuery request, CancellationToken ct)
    {
        var a = await db.PaymentAttempts
            .Include(x => x.Meter)
            .Include(x => x.Payment).ThenInclude(p => p != null ? p.WaterPurchase : null)
                .ThenInclude(wp => wp != null ? wp.WaterToken : null)
            .FirstOrDefaultAsync(x => x.Id == request.AttemptId, ct)
            ?? throw new NotFoundException(nameof(PaymentAttempt), request.AttemptId);

        return PaymentDtoMapper.MapToDto(a);
    }
}

public class GetPaymentHistoryHandler(IApplicationDbContext db)
    : IRequestHandler<GetPaymentHistoryQuery, List<PaymentAttemptDto>>
{
    public async Task<List<PaymentAttemptDto>> Handle(GetPaymentHistoryQuery request, CancellationToken ct)
    {
        var attempts = await db.PaymentAttempts
            .Where(a => a.MeterId == request.MeterId)
            .Include(a => a.Meter)
            .Include(a => a.Payment).ThenInclude(p => p != null ? p.WaterPurchase : null)
                .ThenInclude(wp => wp != null ? wp.WaterToken : null)
            .OrderByDescending(a => a.InitiatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return attempts.Select(PaymentDtoMapper.MapToDto).ToList();
    }
}

public class GetAllPaymentsHandler(IApplicationDbContext db)
    : IRequestHandler<GetAllPaymentsQuery, List<PaymentAttemptDto>>
{
    public async Task<List<PaymentAttemptDto>> Handle(GetAllPaymentsQuery request, CancellationToken ct)
    {
        var attempts = await db.PaymentAttempts
            .Include(a => a.Meter)
            .Include(a => a.Payment).ThenInclude(p => p != null ? p.WaterPurchase : null)
                .ThenInclude(wp => wp != null ? wp.WaterToken : null)
            .OrderByDescending(a => a.InitiatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return attempts.Select(PaymentDtoMapper.MapToDto).ToList();
    }
}

public class InitiateQrPaymentHandler(
    IApplicationDbContext db,
    IPaymentGatewayService? paymentGateway = null,
    ITariffCalculatorService? tariffCalculator = null)
    : IRequestHandler<InitiateQrPaymentCommand, PaymentInitiationDto>
{
    private readonly IPaymentGatewayService? _paymentGateway = paymentGateway;
    private readonly ITariffCalculatorService _tariffCalculator = tariffCalculator ?? new MajiLedger.Application.Services.TariffCalculatorService();

    public async Task<PaymentInitiationDto> Handle(InitiateQrPaymentCommand cmd, CancellationToken ct)
    {
        var qr = await db.QrCodeRegistrations
            .Include(q => q.Meter).ThenInclude(m => m.Tariff)
            .Include(q => q.Meter).ThenInclude(m => m.CurrentApartment)
                .ThenInclude(a => a != null ? a.Building : null)
                    .ThenInclude(b => b != null ? b.Property : null)
                        .ThenInclude(p => p != null ? p.Tariffs : null)
            .Include(q => q.PaymentProviderConfig)
            .FirstOrDefaultAsync(q => q.PublicToken == cmd.PublicToken, ct)
            ?? throw new NotFoundException("QrCode", cmd.PublicToken);

        if (qr.Status == QrCodeStatus.Disabled)
            throw new ConflictException("Payment cannot be initiated because this QR code has been temporarily disabled. Please contact the property manager.");

        if (qr.Status == QrCodeStatus.Revoked)
            throw new ConflictException("Payment cannot be initiated because this QR code is permanently revoked. Please contact the property manager.");

        if (qr.Meter.Status != MeterStatus.Active)
            throw new ConflictException($"Meter '{qr.Meter.MaskedIdentifier}' is not active.");

        var meter = qr.Meter;
        var property = meter.CurrentApartment?.Building?.Property;

        // Prevent cross-property / wrong-property destination routing
        if (qr.PaymentProviderConfig.PropertyId.HasValue && property != null && qr.PaymentProviderConfig.PropertyId != property.Id)
            throw new ConflictException("The payment configuration does not match the property assigned to this meter. Please contact the property manager.");

        // Check tariff base charge & calculate units to validate minimum payment
        var tariff = meter.Tariff
            ?? property?.Tariffs.FirstOrDefault(t => t.IsActive && (t.EffectiveTo == null || t.EffectiveTo > DateTime.UtcNow))
            ?? await db.WaterTariffs.FirstOrDefaultAsync(t => t.PropertyId == null && t.IsActive && (t.EffectiveTo == null || t.EffectiveTo > DateTime.UtcNow), ct);

        if (tariff != null)
        {
            if (tariff.BaseCharge > 0 && cmd.Amount < tariff.BaseCharge)
                throw new ValidationException($"Payment amount KES {cmd.Amount:F2} is insufficient to cover base standing charge of KES {tariff.BaseCharge:F2}.");

            var calc = _tariffCalculator.CalculateUnits(tariff, cmd.Amount);
            if (calc.UnitsCalculated <= 0)
                throw new ValidationException("Payment amount is insufficient to purchase any water units.");
        }

        var checkoutId = _paymentGateway != null
            ? await _paymentGateway.InitiatePushAsync(PaymentChannel.ScanToPay, cmd.CustomerPhone, cmd.Amount, meter.MeterNumber, ct)
            : $"ws_CO_{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid():N}"[..32];

        var attempt = PaymentAttempt.Initiate(
            qr.MeterId,
            qr.PaymentProviderConfigId,
            PaymentChannel.ScanToPay,
            cmd.CustomerPhone,
            cmd.Amount,
            qr.Id);

        attempt.SetProviderCheckoutId(checkoutId);
        db.PaymentAttempts.Add(attempt);
        await db.SaveChangesAsync(ct);

        return new PaymentInitiationDto(attempt.Id, checkoutId, attempt.Status, attempt.ExpiresAt);
    }
}

public class InitiateDirectPaymentHandler(
    IApplicationDbContext db,
    IPaymentGatewayService? paymentGateway = null)
    : IRequestHandler<InitiateDirectPaymentCommand, PaymentInitiationDto>
{
    private readonly IPaymentGatewayService? _paymentGateway = paymentGateway;

    public async Task<PaymentInitiationDto> Handle(InitiateDirectPaymentCommand cmd, CancellationToken ct)
    {
        var meter = await db.Meters
            .Include(m => m.CurrentApartment).ThenInclude(a => a != null ? a.Building : null)
            .FirstOrDefaultAsync(m => m.Id == cmd.MeterId, ct)
            ?? throw new NotFoundException(nameof(Meter), cmd.MeterId);

        if (meter.Status != MeterStatus.Active)
            throw new ConflictException($"Meter '{meter.MaskedIdentifier}' is not active.");

        var config = await db.PaymentProviderConfigs
            .FirstOrDefaultAsync(p => p.Id == cmd.PaymentProviderConfigId && p.IsActive, ct)
            ?? throw new NotFoundException(nameof(PaymentProviderConfig), cmd.PaymentProviderConfigId);

        var propertyId = meter.CurrentApartment?.Building?.PropertyId;
        if (config.PropertyId.HasValue && propertyId.HasValue && config.PropertyId.Value != propertyId.Value)
            throw new ConflictException("The selected payment provider is not authorized for this meter's property.");

        var checkoutId = _paymentGateway != null
            ? await _paymentGateway.InitiatePushAsync(cmd.Channel, cmd.CustomerPhone, cmd.Amount, meter.MeterNumber, ct)
            : $"ws_CO_{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid():N}"[..32];

        var attempt = PaymentAttempt.Initiate(
            cmd.MeterId,
            cmd.PaymentProviderConfigId,
            cmd.Channel,
            cmd.CustomerPhone,
            cmd.Amount);

        attempt.SetProviderCheckoutId(checkoutId);
        db.PaymentAttempts.Add(attempt);
        await db.SaveChangesAsync(ct);

        return new PaymentInitiationDto(attempt.Id, checkoutId, attempt.Status, attempt.ExpiresAt);
    }
}

public class ConfirmPaymentHandler(
    IApplicationDbContext db,
    IPaymentFulfillmentService fulfillment)
    : IRequestHandler<ConfirmPaymentCommand, Unit>
{
    public async Task<Unit> Handle(ConfirmPaymentCommand cmd, CancellationToken ct)
    {
        // Match on ProviderCheckoutId
        var attempt = await db.PaymentAttempts
            .Include(a => a.Meter)
            .FirstOrDefaultAsync(a => a.ProviderCheckoutId == cmd.ProviderCheckoutId, ct)
            ?? throw new NotFoundException(nameof(PaymentAttempt), cmd.ProviderCheckoutId);

        if (attempt.IsTerminal && attempt.Status == PaymentAttemptStatus.Confirmed)
        {
            // Already confirmed — run fulfillment idempotently in case of retry
            await fulfillment.ProcessConfirmedPaymentAsync(attempt, cmd.ProviderRef, cmd.AmountConfirmed, cmd.PaidAt, ct);
            return Unit.Value;
        }

        if (!cmd.Succeeded)
        {
            attempt.Fail(cmd.FailureReason ?? "Provider declined.");
            await db.SaveChangesAsync(ct);
            return Unit.Value;
        }

        await fulfillment.ProcessConfirmedPaymentAsync(attempt, cmd.ProviderRef, cmd.AmountConfirmed, cmd.PaidAt, ct);
        return Unit.Value;
    }
}

public class ProcessPaybillPaymentHandler(
    IApplicationDbContext db,
    IPaymentFulfillmentService fulfillment)
    : IRequestHandler<ProcessPaybillPaymentCommand, PaymentAttemptDto>
{
    public async Task<PaymentAttemptDto> Handle(ProcessPaybillPaymentCommand cmd, CancellationToken ct)
    {
        var meter = await db.Meters
            .Include(m => m.CurrentApartment).ThenInclude(a => a != null ? a.Building : null)
                .ThenInclude(b => b != null ? b.Property : null)
            .FirstOrDefaultAsync(m => m.MeterNumber == cmd.MeterNumber, ct)
            ?? throw new NotFoundException("Meter", cmd.MeterNumber);

        if (meter.Status != MeterStatus.Active)
            throw new ConflictException($"Meter '{cmd.MeterNumber}' is not active.");

        var propertyId = meter.CurrentApartment?.Building?.PropertyId;

        // Resolve active PaymentProviderConfigs matching BusinessShortCode
        var configs = await db.PaymentProviderConfigs
            .Where(p => p.BusinessShortCode == cmd.BusinessShortCode && p.IsActive)
            .ToListAsync(ct);

        if (configs.Count == 0)
            throw new NotFoundException(nameof(PaymentProviderConfig), cmd.BusinessShortCode);

        // Prevent wrong-property payments:
        var matchingConfig = configs.FirstOrDefault(c => c.PropertyId == propertyId)
            ?? configs.FirstOrDefault(c => c.PropertyId == null);

        if (matchingConfig == null)
            throw new ConflictException($"Paybill shortcode '{cmd.BusinessShortCode}' is not authorized for the property of meter '{cmd.MeterNumber}'.");

        // Idempotency: if payment already exists with this ProviderRef
        var existingPayment = await db.Payments
            .Include(p => p.PaymentAttempt).ThenInclude(a => a.Meter)
            .Include(p => p.WaterPurchase).ThenInclude(wp => wp != null ? wp.WaterToken : null)
            .FirstOrDefaultAsync(p => p.ProviderRef == cmd.ProviderRef, ct);

        if (existingPayment != null)
        {
            return PaymentDtoMapper.MapToDto(existingPayment.PaymentAttempt);
        }

        // Create PaymentAttempt
        var attempt = PaymentAttempt.Initiate(
            meter.Id,
            matchingConfig.Id,
            cmd.Channel,
            cmd.CustomerPhone,
            cmd.Amount);

        attempt.SetProviderCheckoutId(cmd.ProviderRef);
        db.PaymentAttempts.Add(attempt);
        await db.SaveChangesAsync(ct);

        // Process confirmed payment through the unified fulfillment workflow
        await fulfillment.ProcessConfirmedPaymentAsync(attempt, cmd.ProviderRef, cmd.Amount, cmd.PaidAt, ct);

        // Reload attempt with related payment/purchase/token
        var loadedAttempt = await db.PaymentAttempts
            .Include(a => a.Meter)
            .Include(a => a.Payment).ThenInclude(p => p != null ? p.WaterPurchase : null)
                .ThenInclude(wp => wp != null ? wp.WaterToken : null)
            .FirstAsync(a => a.Id == attempt.Id, ct);

        return PaymentDtoMapper.MapToDto(loadedAttempt);
    }
}

// ── Mapper helper ─────────────────────────────────────────────────────────────

file static class PaymentDtoMapper
{
    internal static PaymentAttemptDto MapToDto(PaymentAttempt a) =>
        new(a.Id,
            a.MeterId,
            a.Meter?.MeterNumber ?? "",
            a.Channel,
            a.CustomerPhone,
            a.RequestedAmount,
            a.Status,
            a.ProviderCheckoutId,
            a.FailureReason,
            a.InitiatedAt,
            a.ExpiresAt,
            a.CompletedAt,
            a.Payment?.WaterPurchase?.WaterToken?.StsToken,
            a.Payment?.WaterPurchase?.UnitsCalculated);
}
