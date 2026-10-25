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
    PaymentProviderType ProviderType);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetScanToPayLandingQuery(string PublicToken) : IRequest<ScanToPayLandingDto>;

public record GetPaymentAttemptQuery(Guid AttemptId) : IRequest<PaymentAttemptDto>;

public record GetPaymentHistoryQuery(Guid MeterId, int PageSize = 20, int Page = 1)
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

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetScanToPayLandingHandler(IApplicationDbContext db)
    : IRequestHandler<GetScanToPayLandingQuery, ScanToPayLandingDto>
{
    public async Task<ScanToPayLandingDto> Handle(GetScanToPayLandingQuery request, CancellationToken ct)
    {
        var qr = await db.QrCodeRegistrations
            .Include(q => q.Meter).ThenInclude(m => m.CurrentApartment)
                .ThenInclude(a => a != null ? a.Building : null)
                    .ThenInclude(b => b != null ? b.Property : null)
            .Include(q => q.PaymentProviderConfig)
            .FirstOrDefaultAsync(q => q.PublicToken == request.PublicToken
                                   && q.Status == QrCodeStatus.Active, ct)
            ?? throw new NotFoundException("QrCode", request.PublicToken);

        var meter = qr.Meter;
        var apt = meter.CurrentApartment;
        var building = apt?.Building;
        var property = building?.Property;

        return new ScanToPayLandingDto(
            meter.Id,
            meter.MaskedIdentifier,
            property?.Name ?? "Unknown Property",
            building?.Name,
            apt?.UnitNumber,
            qr.PaymentProviderConfig.DisplayName,
            qr.PaymentProviderConfig.BusinessShortCode,
            qr.PaymentProviderConfig.ProviderType);
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

        return MapToDto(a);
    }
}

public class GetPaymentHistoryHandler(IApplicationDbContext db)
    : IRequestHandler<GetPaymentHistoryQuery, List<PaymentAttemptDto>>
{
    public async Task<List<PaymentAttemptDto>> Handle(GetPaymentHistoryQuery request, CancellationToken ct)
        => await db.PaymentAttempts
            .Where(a => a.MeterId == request.MeterId)
            .Include(a => a.Meter)
            .Include(a => a.Payment).ThenInclude(p => p != null ? p.WaterPurchase : null)
                .ThenInclude(wp => wp != null ? wp.WaterToken : null)
            .OrderByDescending(a => a.InitiatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => MapToDto(a))
            .ToListAsync(ct);
}

public class InitiateQrPaymentHandler(IApplicationDbContext db)
    : IRequestHandler<InitiateQrPaymentCommand, PaymentInitiationDto>
{
    public async Task<PaymentInitiationDto> Handle(InitiateQrPaymentCommand cmd, CancellationToken ct)
    {
        var qr = await db.QrCodeRegistrations
            .Include(q => q.Meter)
            .Include(q => q.PaymentProviderConfig)
            .FirstOrDefaultAsync(q => q.PublicToken == cmd.PublicToken
                                   && q.Status == QrCodeStatus.Active, ct)
            ?? throw new NotFoundException("QrCode", cmd.PublicToken);

        if (qr.Meter.Status != MeterStatus.Active)
            throw new ConflictException($"Meter '{qr.Meter.MaskedIdentifier}' is not active.");

        var attempt = PaymentAttempt.Initiate(
            qr.MeterId,
            qr.PaymentProviderConfigId,
            PaymentChannel.QrCode,
            cmd.CustomerPhone,
            cmd.Amount,
            qr.Id);

        db.PaymentAttempts.Add(attempt);
        await db.SaveChangesAsync(ct);

        return new PaymentInitiationDto(attempt.Id, null, attempt.Status, attempt.ExpiresAt);
    }
}

public class InitiateDirectPaymentHandler(IApplicationDbContext db)
    : IRequestHandler<InitiateDirectPaymentCommand, PaymentInitiationDto>
{
    public async Task<PaymentInitiationDto> Handle(InitiateDirectPaymentCommand cmd, CancellationToken ct)
    {
        if (!await db.Meters.AnyAsync(m => m.Id == cmd.MeterId && m.Status == MeterStatus.Active, ct))
            throw new NotFoundException(nameof(Meter), cmd.MeterId);

        if (!await db.PaymentProviderConfigs.AnyAsync(p => p.Id == cmd.PaymentProviderConfigId && p.IsActive, ct))
            throw new NotFoundException(nameof(PaymentProviderConfig), cmd.PaymentProviderConfigId);

        var attempt = PaymentAttempt.Initiate(
            cmd.MeterId,
            cmd.PaymentProviderConfigId,
            cmd.Channel,
            cmd.CustomerPhone,
            cmd.Amount);

        db.PaymentAttempts.Add(attempt);
        await db.SaveChangesAsync(ct);

        return new PaymentInitiationDto(attempt.Id, null, attempt.Status, attempt.ExpiresAt);
    }
}

public class ConfirmPaymentHandler(IApplicationDbContext db)
    : IRequestHandler<ConfirmPaymentCommand, Unit>
{
    public async Task<Unit> Handle(ConfirmPaymentCommand cmd, CancellationToken ct)
    {
        // Match on ProviderCheckoutId
        var attempt = await db.PaymentAttempts
            .FirstOrDefaultAsync(a => a.ProviderCheckoutId == cmd.ProviderCheckoutId, ct)
            ?? throw new NotFoundException(nameof(PaymentAttempt), cmd.ProviderCheckoutId);

        if (attempt.IsTerminal)
            return Unit.Value;  // Idempotent — already processed

        if (!cmd.Succeeded)
        {
            attempt.Fail(cmd.FailureReason ?? "Provider declined.");
            await db.SaveChangesAsync(ct);
            return Unit.Value;
        }

        // Idempotency check on ProviderRef
        if (await db.Payments.AnyAsync(p => p.ProviderRef == cmd.ProviderRef, ct))
        {
            attempt.Confirm();
            await db.SaveChangesAsync(ct);
            return Unit.Value;
        }

        attempt.Confirm();
        var payment = Payment.Confirm(attempt.Id, cmd.ProviderRef, cmd.AmountConfirmed, cmd.PaidAt);
        db.Payments.Add(payment);

        // Create a pending WaterPurchase — token issuance is handled by a background service
        var purchase = WaterPurchase.Create(payment.Id, attempt.MeterId, cmd.AmountConfirmed, 0);
        db.WaterPurchases.Add(purchase);

        await db.SaveChangesAsync(ct);
        return Unit.Value;
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
