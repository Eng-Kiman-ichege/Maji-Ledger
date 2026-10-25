using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.Tokens;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record WaterTokenDto(
    Guid Id,
    Guid WaterPurchaseId,
    string StsToken,
    WaterTokenStatus Status,
    decimal UnitsCalculated,
    DateTime IssuedAt,
    string RecipientPhone,
    bool SmsSent);

public record TokenPurchaseHistoryDto(
    Guid PurchaseId,
    Guid PaymentId,
    decimal AmountPaid,
    decimal UnitsIssued,
    string? StsToken,
    WaterTokenStatus? TokenStatus,
    DateTime PaidAt);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetTokenQuery(Guid WaterTokenId) : IRequest<WaterTokenDto>;

public record GetTokenByPurchaseQuery(Guid WaterPurchaseId) : IRequest<WaterTokenDto>;

public record GetMeterTokenHistoryQuery(Guid MeterId, int PageSize = 20, int Page = 1)
    : IRequest<List<TokenPurchaseHistoryDto>>;

// ── Commands ──────────────────────────────────────────────────────────────────

/// <summary>
/// Records a successful STS token generation. Called by the token issuance background service.
/// </summary>
public record RecordTokenIssuedCommand(
    Guid WaterPurchaseId,
    string StsToken,
    string? StsRequestRef,
    decimal UnitsCalculated,
    string StsRequestPayload,
    string StsResponsePayload,
    int AttemptNumber) : IRequest<Guid>;   // returns WaterTokenId

/// <summary>
/// Records a failed STS token generation attempt (retry-safe).
/// </summary>
public record RecordTokenAttemptFailedCommand(
    Guid WaterPurchaseId,
    int AttemptNumber,
    string StsRequestPayload,
    string FailureReason,
    string? StsResponsePayload = null) : IRequest<Unit>;

/// <summary>
/// Records an SMS delivery attempt for a water token.
/// </summary>
public record RecordSmsDeliveryCommand(
    Guid WaterTokenId,
    string RecipientPhone,
    string MessageBody,
    string GatewayProvider) : IRequest<Guid>;   // returns SmsDeliveryRecordId

/// <summary>
/// Updates an SMS delivery record with the gateway confirmation reference.
/// </summary>
public record UpdateSmsDeliveryCommand(
    Guid SmsDeliveryRecordId,
    string GatewayRef,
    bool Delivered) : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetTokenHandler(IApplicationDbContext db)
    : IRequestHandler<GetTokenQuery, WaterTokenDto>
{
    public async Task<WaterTokenDto> Handle(GetTokenQuery request, CancellationToken ct)
    {
        var t = await db.WaterTokens
            .Include(x => x.WaterPurchase)
            .Include(x => x.SmsDeliveries)
            .FirstOrDefaultAsync(x => x.Id == request.WaterTokenId, ct)
            ?? throw new NotFoundException(nameof(WaterToken), request.WaterTokenId);

        return MapToDto(t);
    }
}

public class GetTokenByPurchaseHandler(IApplicationDbContext db)
    : IRequestHandler<GetTokenByPurchaseQuery, WaterTokenDto>
{
    public async Task<WaterTokenDto> Handle(GetTokenByPurchaseQuery request, CancellationToken ct)
    {
        var t = await db.WaterTokens
            .Include(x => x.WaterPurchase)
            .Include(x => x.SmsDeliveries)
            .FirstOrDefaultAsync(x => x.WaterPurchaseId == request.WaterPurchaseId, ct)
            ?? throw new NotFoundException(nameof(WaterToken), request.WaterPurchaseId);

        return MapToDto(t);
    }
}

public class GetMeterTokenHistoryHandler(IApplicationDbContext db)
    : IRequestHandler<GetMeterTokenHistoryQuery, List<TokenPurchaseHistoryDto>>
{
    public async Task<List<TokenPurchaseHistoryDto>> Handle(GetMeterTokenHistoryQuery request, CancellationToken ct)
        => await db.WaterPurchases
            .Where(wp => wp.MeterId == request.MeterId)
            .Include(wp => wp.Payment)
            .Include(wp => wp.WaterToken)
            .OrderByDescending(wp => wp.Payment.PaidAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(wp => new TokenPurchaseHistoryDto(
                wp.Id,
                wp.PaymentId,
                wp.Payment.AmountConfirmed,
                wp.UnitsCalculated,
                wp.WaterToken != null ? wp.WaterToken.StsToken : null,
                wp.WaterToken != null ? wp.WaterToken.Status : null,
                wp.Payment.PaidAt))
            .ToListAsync(ct);
}

public class RecordTokenIssuedHandler(IApplicationDbContext db)
    : IRequestHandler<RecordTokenIssuedCommand, Guid>
{
    public async Task<Guid> Handle(RecordTokenIssuedCommand cmd, CancellationToken ct)
    {
        // Idempotency: if a token already exists for this purchase, return it
        var existing = await db.WaterTokens
            .FirstOrDefaultAsync(t => t.WaterPurchaseId == cmd.WaterPurchaseId, ct);
        if (existing is not null)
            return existing.Id;

        var purchase = await db.WaterPurchases.FindAsync([cmd.WaterPurchaseId], ct)
            ?? throw new NotFoundException(nameof(WaterPurchase), cmd.WaterPurchaseId);

        // Update units calculated from STS response
        purchase.SetUnitsCalculated(cmd.UnitsCalculated);

        var token = WaterToken.Issue(cmd.WaterPurchaseId, cmd.StsToken, cmd.StsRequestRef);
        db.WaterTokens.Add(token);

        // Record the successful attempt
        db.TokenGenerationAttempts.Add(TokenGenerationAttempt.RecordSuccess(
            cmd.WaterPurchaseId, cmd.AttemptNumber, cmd.StsRequestPayload, cmd.StsResponsePayload));

        purchase.MarkTokenIssued();
        await db.SaveChangesAsync(ct);
        return token.Id;
    }
}

public class RecordTokenAttemptFailedHandler(IApplicationDbContext db)
    : IRequestHandler<RecordTokenAttemptFailedCommand, Unit>
{
    public async Task<Unit> Handle(RecordTokenAttemptFailedCommand cmd, CancellationToken ct)
    {
        db.TokenGenerationAttempts.Add(TokenGenerationAttempt.RecordFailure(
            cmd.WaterPurchaseId, cmd.AttemptNumber, cmd.StsRequestPayload,
            cmd.StsResponsePayload, cmd.FailureReason));

        // If this was the final attempt, mark the purchase as failed
        var failedCount = await db.TokenGenerationAttempts
            .CountAsync(t => t.WaterPurchaseId == cmd.WaterPurchaseId && !t.Succeeded, ct);

        if (failedCount >= 3)   // configurable in future — hardcoded for MVP
        {
            var purchase = await db.WaterPurchases.FindAsync([cmd.WaterPurchaseId], ct);
            purchase?.MarkTokenFailed();
        }

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class RecordSmsDeliveryHandler(IApplicationDbContext db)
    : IRequestHandler<RecordSmsDeliveryCommand, Guid>
{
    public async Task<Guid> Handle(RecordSmsDeliveryCommand cmd, CancellationToken ct)
    {
        if (!await db.WaterTokens.AnyAsync(t => t.Id == cmd.WaterTokenId, ct))
            throw new NotFoundException(nameof(WaterToken), cmd.WaterTokenId);

        var record = SmsDeliveryRecord.Queue(cmd.WaterTokenId, cmd.RecipientPhone, cmd.MessageBody);
        db.SmsDeliveryRecords.Add(record);
        await db.SaveChangesAsync(ct);
        return record.Id;
    }
}

public class UpdateSmsDeliveryHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateSmsDeliveryCommand, Unit>
{
    public async Task<Unit> Handle(UpdateSmsDeliveryCommand cmd, CancellationToken ct)
    {
        var record = await db.SmsDeliveryRecords.FindAsync([cmd.SmsDeliveryRecordId], ct)
            ?? throw new NotFoundException(nameof(SmsDeliveryRecord), cmd.SmsDeliveryRecordId);

        if (cmd.Delivered)
            record.MarkDelivered();
        else
            record.MarkFailed();

        if (!string.IsNullOrWhiteSpace(cmd.GatewayRef))
            record.MarkSent(cmd.GatewayRef);

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

// ── Mapper ────────────────────────────────────────────────────────────────────

file static class TokenDtoMapper
{
    internal static WaterTokenDto MapToDto(WaterToken t) =>
        new(t.Id,
            t.WaterPurchaseId,
            t.StsToken,
            t.Status,
            t.WaterPurchase?.UnitsCalculated ?? 0,
            t.IssuedAt,
            t.SmsDeliveries.FirstOrDefault()?.RecipientPhone ?? "",
            t.SmsDeliveries.Any(s => s.Status == SmsDeliveryStatus.Delivered));
}
