using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.WaterLedger;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record WaterDashboardDto(
    decimal TotalRevenue,
    decimal TotalUnitsSold,
    decimal TotalConsumption,
    int TotalMeters,
    int ActiveMeters,
    int FailedPayments,
    int PendingTokens,
    List<WaterTransactionDto> RecentPurchases,
    List<PropertyWaterSummaryDto> PropertyBreakdowns);

public record PropertyWaterSummaryDto(
    Guid PropertyId,
    string PropertyName,
    int MeterCount,
    decimal Revenue,
    decimal UnitsSold,
    decimal Consumption);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetWaterDashboardQuery(Guid? PropertyId = null) : IRequest<WaterDashboardDto>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetWaterDashboardQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetWaterDashboardQuery, WaterDashboardDto>
{
    public async Task<WaterDashboardDto> Handle(GetWaterDashboardQuery request, CancellationToken ct)
    {
        var metersQuery = db.Meters
            .Include(m => m.CurrentApartment).ThenInclude(a => a != null ? a.Building : null).ThenInclude(b => b != null ? b.Property : null)
            .AsNoTracking();

        var transactionsQuery = db.WaterTransactions
            .Include(t => t.Property)
            .Include(t => t.Unit)
            .Include(t => t.WaterMeter)
            .Include(t => t.Tenant)
            .AsNoTracking();

        var readingsQuery = db.WaterReadings
            .Include(r => r.WaterMeter).ThenInclude(m => m.CurrentApartment).ThenInclude(a => a != null ? a.Building : null)
            .AsNoTracking();

        if (request.PropertyId.HasValue)
        {
            if (!currentUser.HasPropertyAccess(request.PropertyId.Value))
                throw new ForbiddenException("You do not have access to this property's water dashboard.");

            metersQuery = metersQuery.Where(m => m.CurrentApartment != null && m.CurrentApartment.Building.PropertyId == request.PropertyId.Value);
            transactionsQuery = transactionsQuery.Where(t => t.PropertyId == request.PropertyId.Value);
            readingsQuery = readingsQuery.Where(r => r.WaterMeter.CurrentApartment != null && r.WaterMeter.CurrentApartment.Building.PropertyId == request.PropertyId.Value);
        }
        else if (currentUser.Role == "Owner")
        {
            var allowed = currentUser.AuthorizedPropertyIds;
            metersQuery = metersQuery.Where(m => m.CurrentApartment != null && allowed.Contains(m.CurrentApartment.Building.PropertyId));
            transactionsQuery = transactionsQuery.Where(t => allowed.Contains(t.PropertyId));
            readingsQuery = readingsQuery.Where(r => r.WaterMeter.CurrentApartment != null && allowed.Contains(r.WaterMeter.CurrentApartment.Building.PropertyId));
        }

        var meters = await metersQuery.ToListAsync(ct);
        var totalMeters = meters.Count;
        var activeMeters = meters.Count(m => m.Status == MeterStatus.Active);

        var confirmedTransactions = await transactionsQuery
            .Where(t => t.PaymentStatus == WaterTransactionPaymentStatus.Confirmed)
            .ToListAsync(ct);

        var totalRevenue = confirmedTransactions.Sum(t => t.Amount);
        var totalUnitsSold = confirmedTransactions.Sum(t => t.UnitsPurchased);

        var failedPayments = await transactionsQuery
            .CountAsync(t => t.PaymentStatus == WaterTransactionPaymentStatus.Failed, ct);

        var pendingTokens = await transactionsQuery
            .CountAsync(t => t.PaymentStatus == WaterTransactionPaymentStatus.Confirmed &&
                             (t.TokenStatus == WaterTransactionTokenStatus.Pending || t.TokenStatus == WaterTransactionTokenStatus.Failed), ct);

        var readings = await readingsQuery.ToListAsync(ct);
        var totalConsumption = readings.Sum(r => r.Consumption);

        var recentPurchases = await transactionsQuery
            .OrderByDescending(t => t.TransactionDate)
            .Take(10)
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
                t.Tenant != null ? t.Tenant.FullName : null,
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
            .ToListAsync(ct);

        // Group by property
        var propertyBreakdowns = confirmedTransactions
            .GroupBy(t => t.PropertyId)
            .Select(g =>
            {
                var first = g.First();
                var pMeters = meters.Count(m => m.CurrentApartment?.Building?.PropertyId == g.Key);
                var pConsumption = readings.Where(r => r.WaterMeter.CurrentApartment?.Building?.PropertyId == g.Key).Sum(r => r.Consumption);
                return new PropertyWaterSummaryDto(
                    g.Key,
                    first.Property.Name,
                    pMeters,
                    g.Sum(x => x.Amount),
                    g.Sum(x => x.UnitsPurchased),
                    pConsumption);
            })
            .ToList();

        return new WaterDashboardDto(
            totalRevenue,
            totalUnitsSold,
            totalConsumption,
            totalMeters,
            activeMeters,
            failedPayments,
            pendingTokens,
            recentPurchases,
            propertyBreakdowns);
    }
}
