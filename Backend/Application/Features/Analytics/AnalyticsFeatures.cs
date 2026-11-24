using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.Analytics;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record PropertyComparisonItemDto(
    Guid PropertyId,
    string PropertyName,
    int TotalUnits,
    int OccupiedUnits,
    decimal OccupancyRate,
    decimal ExpectedRent,
    decimal CollectedRent,
    decimal OutstandingRent,
    decimal WaterRevenue,
    decimal MaintenanceExpense,
    decimal NetIncome);

public record AnalyticsOverviewDto(
    int TotalProperties,
    int TotalUnits,
    int OccupiedUnits,
    int VacantUnits,
    decimal OverallOccupancyRate,
    decimal TotalRentCollected,
    decimal TotalRentOutstanding,
    decimal RentCollectionRate,
    decimal TotalWaterRevenue,
    decimal TotalWaterVolume,
    decimal TotalMaintenanceCost,
    List<PropertyComparisonItemDto> PropertyComparison);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetAnalyticsOverviewQuery(
    DateTime? From = null,
    DateTime? To = null,
    Guid? PropertyId = null) : IRequest<AnalyticsOverviewDto>;

public class GetAnalyticsOverviewHandler : IRequestHandler<GetAnalyticsOverviewQuery, AnalyticsOverviewDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetAnalyticsOverviewHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<AnalyticsOverviewDto> Handle(GetAnalyticsOverviewQuery req, CancellationToken ct)
    {
        var from = req.From ?? new DateTime(DateTime.UtcNow.Year, 1, 1);
        var to = req.To ?? DateTime.UtcNow;

        var propertiesQuery = _db.Properties
            .Include(p => p.Buildings).ThenInclude(b => b.Apartments)
            .AsQueryable();

        if (!_currentUser.IsInRole("Admin"))
        {
            var authIds = _currentUser.AuthorizedPropertyIds;
            propertiesQuery = propertiesQuery.Where(p => authIds.Contains(p.Id));
        }

        if (req.PropertyId.HasValue)
            propertiesQuery = propertiesQuery.Where(p => p.Id == req.PropertyId.Value);

        var properties = await propertiesQuery.ToListAsync(ct);
        var comparison = new List<PropertyComparisonItemDto>();

        decimal totalRentCollected = 0;
        decimal totalRentExpected = 0;
        decimal totalRentOutstanding = 0;
        decimal totalWaterRevenue = 0;
        decimal totalWaterVolume = 0;
        decimal totalMaintenanceCost = 0;

        int totalUnitsAll = 0;
        int occupiedUnitsAll = 0;

        foreach (var p in properties)
        {
            var apartments = p.Buildings.SelectMany(b => b.Apartments).ToList();
            var aptIds = apartments.Select(a => a.Id).ToList();
            totalUnitsAll += apartments.Count;

            var activeTenancies = await _db.Tenancies
                .Where(t => aptIds.Contains(t.ApartmentId) && t.Status == TenancyStatus.Active)
                .ToListAsync(ct);

            var occupied = activeTenancies.Select(t => t.ApartmentId).Distinct().Count();
            occupiedUnitsAll += occupied;

            var tenancyIds = activeTenancies.Select(t => t.Id).ToList();

            var rentCharges = await _db.RentCharges
                .Where(rc => tenancyIds.Contains(rc.TenancyId) && rc.BillingDate >= from && rc.BillingDate <= to)
                .ToListAsync(ct);

            var propBilled = rentCharges.Sum(rc => rc.Amount);
            var propCollected = rentCharges.Sum(rc => rc.AmountPaid);
            var propOutstanding = rentCharges.Sum(rc => Math.Max(0m, rc.Amount - rc.AmountPaid));

            var waterTxs = await _db.WaterTransactions
                .Where(w => aptIds.Contains(w.UnitId) && w.TransactionDate >= from && w.TransactionDate <= to)
                .ToListAsync(ct);

            var propWaterRev = waterTxs.Sum(w => w.Amount);
            var propWaterUnits = waterTxs.Sum(w => w.UnitsPurchased);

            var propMaintCost = await _db.MaintenanceRequests
                .Where(m => m.PropertyId == p.Id && m.Status == MaintenanceStatus.Completed && m.CompletedAt >= from && m.CompletedAt <= to)
                .SumAsync(m => m.ActualCost ?? 0m, ct);

            totalRentExpected += propBilled;
            totalRentCollected += propCollected;
            totalRentOutstanding += propOutstanding;
            totalWaterRevenue += propWaterRev;
            totalWaterVolume += propWaterUnits;
            totalMaintenanceCost += propMaintCost;

            var occRate = apartments.Count > 0 ? Math.Round((decimal)occupied / apartments.Count * 100, 1) : 0m;
            var netInc = propCollected + propWaterRev - propMaintCost;

            comparison.Add(new PropertyComparisonItemDto(
                p.Id, p.Name, apartments.Count, occupied, occRate,
                propBilled, propCollected, propOutstanding,
                propWaterRev, propMaintCost, netInc));
        }

        var overallOccupancyRate = totalUnitsAll > 0
            ? Math.Round((decimal)occupiedUnitsAll / totalUnitsAll * 100, 1)
            : 0m;

        var collectionRate = totalRentExpected > 0
            ? Math.Round(totalRentCollected / totalRentExpected * 100, 1)
            : 0m;

        return new AnalyticsOverviewDto(
            properties.Count,
            totalUnitsAll,
            occupiedUnitsAll,
            Math.Max(0, totalUnitsAll - occupiedUnitsAll),
            overallOccupancyRate,
            totalRentCollected,
            totalRentOutstanding,
            collectionRate,
            totalWaterRevenue,
            totalWaterVolume,
            totalMaintenanceCost,
            comparison);
    }
}
