using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.WaterLedger;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record WaterTransactionDto(
    Guid Id,
    string TransactionReference,
    Guid PropertyId,
    string PropertyName,
    Guid UnitId,
    string UnitNumber,
    Guid WaterMeterId,
    string MeterNumber,
    Guid? TenantId,
    string? TenantName,
    decimal Amount,
    decimal UnitsPurchased,
    decimal UnitPrice,
    WaterPaymentMethod PaymentMethod,
    string? ExternalTransactionReference,
    string PhoneNumber,
    DateTime TransactionDate,
    WaterTransactionPaymentStatus PaymentStatus,
    WaterTransactionTokenStatus TokenStatus,
    string? TokenValue,
    string? FailureReason,
    string? Notes,
    DateTime CreatedAt);

public record WaterTransactionDetailDto(
    Guid Id,
    string TransactionReference,
    Guid PropertyId,
    string PropertyName,
    Guid UnitId,
    string UnitNumber,
    Guid WaterMeterId,
    string MeterNumber,
    Guid? TenantId,
    string? TenantName,
    decimal Amount,
    decimal UnitsPurchased,
    decimal UnitPrice,
    WaterPaymentMethod PaymentMethod,
    string? ExternalTransactionReference,
    string PhoneNumber,
    DateTime TransactionDate,
    WaterTransactionPaymentStatus PaymentStatus,
    WaterTransactionTokenStatus TokenStatus,
    string? TokenValue,
    string? FailureReason,
    string? Notes,
    DateTime CreatedAt);

// ── Commands ──────────────────────────────────────────────────────────────────

public record EnterManualTokenCommand(
    Guid TransactionId,
    string TokenValue,
    string? ProviderReference = null,
    string? Notes = null) : IRequest<WaterTransactionDto>;

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetWaterTransactionsQuery(
    Guid? PropertyId = null,
    Guid? MeterId = null,
    WaterTransactionPaymentStatus? PaymentStatus = null,
    WaterTransactionTokenStatus? TokenStatus = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    string? Search = null) : IRequest<List<WaterTransactionDto>>;

public record GetWaterTransactionByIdQuery(Guid Id) : IRequest<WaterTransactionDetailDto>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class EnterManualTokenCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<EnterManualTokenCommand, WaterTransactionDto>
{
    public async Task<WaterTransactionDto> Handle(EnterManualTokenCommand request, CancellationToken ct)
    {
        var tx = await db.WaterTransactions
            .Include(t => t.Property)
            .Include(t => t.Unit)
            .Include(t => t.WaterMeter)
            .Include(t => t.Tenant)
            .FirstOrDefaultAsync(t => t.Id == request.TransactionId, ct)
            ?? throw new NotFoundException(nameof(WaterTransaction), request.TransactionId);

        if (!currentUser.HasPropertyAccess(tx.PropertyId))
            throw new ForbiddenException("You do not have permission to enter tokens for this property.");

        if (tx.PaymentStatus != WaterTransactionPaymentStatus.Confirmed)
            throw new ConflictException("Cannot issue a token for an unconfirmed payment.");

        if (string.IsNullOrWhiteSpace(request.TokenValue))
            throw new ValidationException("TokenValue", "Token value cannot be empty.");

        // Mark transaction token as generated
        tx.SetTokenGenerated(request.TokenValue);
        if (!string.IsNullOrWhiteSpace(request.Notes))
            tx.ConfirmPayment(tx.ExternalTransactionReference); // Touch and keep updated

        // Create WaterToken entity record if purchase exists
        var purchase = await db.WaterPurchases
            .Include(p => p.WaterToken)
            .FirstOrDefaultAsync(p => p.MeterId == tx.WaterMeterId && p.WaterToken == null, ct);

        if (purchase != null)
        {
            var waterToken = WaterToken.Issue(purchase.Id, request.TokenValue.Trim(), request.ProviderReference);
            db.WaterTokens.Add(waterToken);
            purchase.MarkTokenIssued();
        }

        await db.SaveChangesAsync(ct);

        return new WaterTransactionDto(
            tx.Id,
            tx.TransactionReference,
            tx.PropertyId,
            tx.Property.Name,
            tx.UnitId,
            tx.Unit.UnitNumber,
            tx.WaterMeterId,
            tx.WaterMeter.MeterNumber,
            tx.TenantId,
            tx.Tenant?.FullName,
            tx.Amount,
            tx.UnitsPurchased,
            tx.UnitPrice,
            tx.PaymentMethod,
            tx.ExternalTransactionReference,
            tx.PhoneNumber,
            tx.TransactionDate,
            tx.PaymentStatus,
            tx.TokenStatus,
            tx.TokenValue,
            tx.FailureReason,
            tx.Notes,
            tx.CreatedAt);
    }
}

public class GetWaterTransactionsQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetWaterTransactionsQuery, List<WaterTransactionDto>>
{
    public async Task<List<WaterTransactionDto>> Handle(GetWaterTransactionsQuery request, CancellationToken ct)
    {
        var query = db.WaterTransactions
            .Include(t => t.Property)
            .Include(t => t.Unit)
            .Include(t => t.WaterMeter)
            .Include(t => t.Tenant)
            .AsNoTracking();

        if (request.PropertyId.HasValue)
        {
            if (!currentUser.HasPropertyAccess(request.PropertyId.Value))
                throw new ForbiddenException("You do not have access to this property's transactions.");

            query = query.Where(t => t.PropertyId == request.PropertyId.Value);
        }
        else if (currentUser.Role == "Owner")
        {
            var allowed = currentUser.AuthorizedPropertyIds;
            query = query.Where(t => allowed.Contains(t.PropertyId));
        }

        if (request.MeterId.HasValue)
            query = query.Where(t => t.WaterMeterId == request.MeterId.Value);

        if (request.PaymentStatus.HasValue)
            query = query.Where(t => t.PaymentStatus == request.PaymentStatus.Value);

        if (request.TokenStatus.HasValue)
            query = query.Where(t => t.TokenStatus == request.TokenStatus.Value);

        if (request.FromDate.HasValue)
            query = query.Where(t => t.TransactionDate >= request.FromDate.Value);

        if (request.ToDate.HasValue)
            query = query.Where(t => t.TransactionDate <= request.ToDate.Value);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim().ToLower();
            query = query.Where(t =>
                t.TransactionReference.ToLower().Contains(s) ||
                (t.ExternalTransactionReference != null && t.ExternalTransactionReference.ToLower().Contains(s)) ||
                t.PhoneNumber.Contains(s) ||
                t.WaterMeter.MeterNumber.ToLower().Contains(s) ||
                t.Unit.UnitNumber.ToLower().Contains(s));
        }

        var list = await query
            .OrderByDescending(t => t.TransactionDate)
            .ToListAsync(ct);

        return list.Select(t => new WaterTransactionDto(
            t.Id,
            t.TransactionReference,
            t.PropertyId,
            t.Property.Name,
            t.UnitId,
            t.Unit.UnitNumber,
            t.WaterMeterId,
            t.WaterMeter.MeterNumber,
            t.TenantId,
            t.Tenant?.FullName,
            t.Amount,
            t.UnitsPurchased,
            t.UnitPrice,
            t.PaymentMethod,
            t.ExternalTransactionReference,
            t.PhoneNumber,
            t.TransactionDate,
            t.PaymentStatus,
            t.TokenStatus,
            t.TokenValue,
            t.FailureReason,
            t.Notes,
            t.CreatedAt)).ToList();
    }
}

public class GetWaterTransactionByIdQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetWaterTransactionByIdQuery, WaterTransactionDetailDto>
{
    public async Task<WaterTransactionDetailDto> Handle(GetWaterTransactionByIdQuery request, CancellationToken ct)
    {
        var t = await db.WaterTransactions
            .Include(x => x.Property)
            .Include(x => x.Unit)
            .Include(x => x.WaterMeter)
            .Include(x => x.Tenant)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(WaterTransaction), request.Id);

        if (!currentUser.HasPropertyAccess(t.PropertyId))
            throw new ForbiddenException("You do not have access to this transaction.");

        return new WaterTransactionDetailDto(
            t.Id,
            t.TransactionReference,
            t.PropertyId,
            t.Property.Name,
            t.UnitId,
            t.Unit.UnitNumber,
            t.WaterMeterId,
            t.WaterMeter.MeterNumber,
            t.TenantId,
            t.Tenant?.FullName,
            t.Amount,
            t.UnitsPurchased,
            t.UnitPrice,
            t.PaymentMethod,
            t.ExternalTransactionReference,
            t.PhoneNumber,
            t.TransactionDate,
            t.PaymentStatus,
            t.TokenStatus,
            t.TokenValue,
            t.FailureReason,
            t.Notes,
            t.CreatedAt);
    }
}
