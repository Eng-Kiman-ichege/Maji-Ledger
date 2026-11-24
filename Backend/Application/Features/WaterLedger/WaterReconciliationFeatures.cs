using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.WaterLedger;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record WaterReconciliationSummaryDto(
    decimal TotalWaterRevenue,
    int ConfirmedCount,
    decimal FailedRevenue,
    int FailedCount,
    int PendingTokensCount,
    int DeliveryFailuresCount,
    decimal MpesaTotal,
    int MpesaCount,
    decimal AirtelTotal,
    int AirtelCount,
    List<WaterTransactionDto> UnmatchedOrPendingTransactions);

public record ProviderLookupResultDto(
    bool Found,
    string ProviderReference,
    WaterTransactionDto? Transaction,
    string? Message);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetWaterReconciliationSummaryQuery(
    Guid? PropertyId = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null) : IRequest<WaterReconciliationSummaryDto>;

public record LookupProviderReferenceQuery(string ProviderReference) : IRequest<ProviderLookupResultDto>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetWaterReconciliationSummaryQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetWaterReconciliationSummaryQuery, WaterReconciliationSummaryDto>
{
    public async Task<WaterReconciliationSummaryDto> Handle(GetWaterReconciliationSummaryQuery request, CancellationToken ct)
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
                throw new ForbiddenException("You do not have access to reconciliation for this property.");

            query = query.Where(t => t.PropertyId == request.PropertyId.Value);
        }
        else if (currentUser.Role == "Owner")
        {
            var allowed = currentUser.AuthorizedPropertyIds;
            query = query.Where(t => allowed.Contains(t.PropertyId));
        }

        if (request.FromDate.HasValue)
            query = query.Where(t => t.TransactionDate >= request.FromDate.Value);

        if (request.ToDate.HasValue)
            query = query.Where(t => t.TransactionDate <= request.ToDate.Value);

        var list = await query.ToListAsync(ct);

        var confirmed = list.Where(t => t.PaymentStatus == WaterTransactionPaymentStatus.Confirmed).ToList();
        var failed = list.Where(t => t.PaymentStatus == WaterTransactionPaymentStatus.Failed).ToList();
        var pendingTokens = confirmed.Where(t => t.TokenStatus == WaterTransactionTokenStatus.Pending || t.TokenStatus == WaterTransactionTokenStatus.Failed).ToList();
        var deliveryFailures = confirmed.Where(t => t.TokenStatus == WaterTransactionTokenStatus.Failed).ToList();

        var mpesa = confirmed.Where(t => t.PaymentMethod == WaterPaymentMethod.Mpesa).ToList();
        var airtel = confirmed.Where(t => t.PaymentMethod == WaterPaymentMethod.AirtelMoney).ToList();

        var unmatchedOrPending = list
            .Where(t => t.PaymentStatus == WaterTransactionPaymentStatus.Failed ||
                        (t.PaymentStatus == WaterTransactionPaymentStatus.Confirmed && t.TokenStatus != WaterTransactionTokenStatus.Delivered))
            .OrderByDescending(t => t.TransactionDate)
            .Take(25)
            .Select(t => new WaterTransactionDto(
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
                t.CreatedAt))
            .ToList();

        return new WaterReconciliationSummaryDto(
            confirmed.Sum(t => t.Amount),
            confirmed.Count,
            failed.Sum(t => t.Amount),
            failed.Count,
            pendingTokens.Count,
            deliveryFailures.Count,
            mpesa.Sum(t => t.Amount),
            mpesa.Count,
            airtel.Sum(t => t.Amount),
            airtel.Count,
            unmatchedOrPending);
    }
}

public class LookupProviderReferenceQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<LookupProviderReferenceQuery, ProviderLookupResultDto>
{
    public async Task<ProviderLookupResultDto> Handle(LookupProviderReferenceQuery request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.ProviderReference))
            return new ProviderLookupResultDto(false, request.ProviderReference, null, "Provider reference cannot be empty.");

        var refCode = request.ProviderReference.Trim();
        var t = await db.WaterTransactions
            .Include(x => x.Property)
            .Include(x => x.Unit)
            .Include(x => x.WaterMeter)
            .Include(x => x.Tenant)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.ExternalTransactionReference == refCode, ct);

        if (t == null)
        {
            return new ProviderLookupResultDto(false, refCode, null, $"No water transaction found with provider reference '{refCode}'.");
        }

        if (!currentUser.HasPropertyAccess(t.PropertyId))
            throw new ForbiddenException("You do not have permission to view transactions for this property.");

        var dto = new WaterTransactionDto(
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

        return new ProviderLookupResultDto(true, refCode, dto, null);
    }
}
