using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.LandlordPortal;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record LandlordPortalPropertyKpi(
    int TotalProperties,
    int ActiveProperties,
    int TotalBuildings,
    int TotalApartments,
    int OccupiedApartments,
    int VacantApartments,
    decimal OccupancyRate);

public record LandlordPortalRentKpi(
    decimal MonthlyExpectedRent,
    decimal MonthlyCollected,
    decimal MonthlyOutstanding,
    int ActiveTenancies,
    int TenantsWithArrears,
    decimal TotalArrears);

public record LandlordPortalWaterKpi(
    decimal WaterRevenue,
    decimal UnitsPurchased,
    int ActiveMeters,
    int PendingTokens);

public record LandlordPortalMaintenanceKpi(
    int OpenRequests,
    int InProgressRequests,
    int CompletedThisPeriod,
    int CriticalRequests);

public record LandlordPortalDashboardDto(
    string OwnerName,
    LandlordPortalPropertyKpi PropertyStats,
    LandlordPortalRentKpi RentStats,
    LandlordPortalWaterKpi WaterStats,
    LandlordPortalMaintenanceKpi MaintenanceStats,
    int UnreadNotifications);

public record LandlordPortalPropertyDto(
    Guid Id,
    string Name,
    string? Address,
    string? Town,
    string? County,
    PropertyType Type,
    bool IsActive,
    int BuildingCount,
    int ApartmentCount,
    int OccupiedUnits,
    int VacantUnits,
    int ActiveTenancies,
    decimal MonthlyExpectedRent,
    decimal WaterRevenue,
    int ActiveMeters);

public record LandlordPortalPropertyDetailDto(
    Guid Id,
    string Name,
    string? Description,
    string? Address,
    string? Town,
    string? County,
    PropertyType Type,
    bool IsActive,
    int BuildingCount,
    int ApartmentCount,
    int OccupiedUnits,
    int VacantUnits,
    int ActiveTenancies,
    decimal MonthlyExpectedRent,
    decimal MonthlyRentCollected,
    decimal MonthlyRentOutstanding,
    decimal WaterRevenue,
    int OpenMaintenanceRequests);

public record LandlordStatementLineDto(
    string Period,
    decimal ExpectedRent,
    decimal CollectedRent,
    decimal OutstandingRent,
    decimal WaterRevenue,
    decimal MaintenanceCost,
    decimal NetIncome);

public record LandlordStatementDto(
    Guid? PropertyId,
    string? PropertyName,
    DateTime From,
    DateTime To,
    decimal TotalExpectedRent,
    decimal TotalCollectedRent,
    decimal TotalOutstandingRent,
    decimal TotalWaterRevenue,
    decimal TotalMaintenanceCost,
    decimal NetIncome,
    List<LandlordStatementLineDto> MonthlyBreakdown);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetLandlordPortalDashboardQuery(
    Guid? PropertyId = null,
    DateTime? From = null,
    DateTime? To = null) : IRequest<LandlordPortalDashboardDto>;

public class GetLandlordPortalDashboardHandler : IRequestHandler<GetLandlordPortalDashboardQuery, LandlordPortalDashboardDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetLandlordPortalDashboardHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<LandlordPortalDashboardDto> Handle(GetLandlordPortalDashboardQuery req, CancellationToken ct)
    {
        var from = req.From ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var to = req.To ?? DateTime.UtcNow;

        // Get owner name
        var ownerName = "Landlord";
        if (_currentUser.OwnerId.HasValue)
        {
            var owner = await _db.Owners.FirstOrDefaultAsync(o => o.Id == _currentUser.OwnerId.Value, ct);
            if (owner != null) ownerName = owner.FullName;
        }

        // ── Build property scope ──
        var propertiesQuery = _db.Properties
            .Include(p => p.Buildings).ThenInclude(b => b.Apartments)
            .AsQueryable();

        if (!_currentUser.IsInRole("Admin"))
        {
            var authorizedIds = _currentUser.AuthorizedPropertyIds;
            propertiesQuery = propertiesQuery.Where(p => authorizedIds.Contains(p.Id));
        }
        if (req.PropertyId.HasValue)
            propertiesQuery = propertiesQuery.Where(p => p.Id == req.PropertyId.Value);

        var properties = await propertiesQuery.ToListAsync(ct);
        var propertyIds = properties.Select(p => p.Id).ToList();
        var apartments = properties.SelectMany(p => p.Buildings).SelectMany(b => b.Apartments).ToList();
        var apartmentIds = apartments.Select(a => a.Id).ToList();

        // ── Property KPIs ──
        var activeTenancyList = await _db.Tenancies
            .Where(t => apartmentIds.Contains(t.ApartmentId) && t.Status == TenancyStatus.Active)
            .ToListAsync(ct);
        var activeTenancyIds = activeTenancyList.Select(t => t.Id).ToList();
        var occupiedApartmentCount = activeTenancyList.Select(t => t.ApartmentId).Distinct().Count();

        var propertyKpi = new LandlordPortalPropertyKpi(
            properties.Count,
            properties.Count(p => p.IsActive),
            properties.Sum(p => p.Buildings.Count),
            apartments.Count,
            occupiedApartmentCount,
            apartments.Count - occupiedApartmentCount,
            apartments.Count > 0 ? Math.Round((decimal)occupiedApartmentCount / apartments.Count * 100, 1) : 0);

        // ── Rent KPIs ──
        var monthlyExpected = activeTenancyList.Sum(t => t.MonthlyRent);

        var rentCharges = await _db.RentCharges
            .Where(rc => activeTenancyIds.Contains(rc.TenancyId)
                && rc.BillingDate >= from && rc.BillingDate <= to)
            .ToListAsync(ct);

        var monthlyCollected = rentCharges.Sum(rc => rc.AmountPaid);
        // OutstandingAmount is a computed property — calculate client-side from loaded entities
        var monthlyOutstanding = rentCharges.Sum(rc => Math.Max(0m, rc.Amount - rc.AmountPaid));

        var arrearsCharges = await _db.RentCharges
            .Where(rc => activeTenancyIds.Contains(rc.TenancyId)
                && (rc.Status == RentChargeStatus.Overdue || rc.Status == RentChargeStatus.PartiallyPaid))
            .ToListAsync(ct);

        var tenantsWithArrears = arrearsCharges.Select(rc => rc.TenantId).Distinct().Count();
        var totalArrears = arrearsCharges.Sum(rc => Math.Max(0m, rc.Amount - rc.AmountPaid));

        var rentKpi = new LandlordPortalRentKpi(
            monthlyExpected, monthlyCollected, monthlyOutstanding,
            activeTenancyList.Count, tenantsWithArrears, totalArrears);

        // ── Water KPIs ──
        var meterIds = await _db.MeterAssignments
            .Where(ma => apartmentIds.Contains(ma.ApartmentId) && ma.UnassignedAt == null)
            .Select(ma => ma.MeterId)
            .Distinct()
            .ToListAsync(ct);

        var waterTransactions = await _db.WaterTransactions
            .Where(wt => apartmentIds.Contains(wt.UnitId)
                && wt.TransactionDate >= from && wt.TransactionDate <= to)
            .ToListAsync(ct);

        var waterRevenue = waterTransactions.Sum(wt => wt.Amount);
        var unitsPurchased = waterTransactions.Sum(wt => wt.UnitsPurchased);

        var pendingTokens = await _db.WaterPurchases
            .Where(wp => meterIds.Contains(wp.MeterId) && wp.Status == WaterPurchaseStatus.Pending)
            .CountAsync(ct);

        var waterKpi = new LandlordPortalWaterKpi(waterRevenue, unitsPurchased, meterIds.Count, pendingTokens);

        // ── Maintenance KPIs ──
        var maintenanceQuery = _db.MaintenanceRequests.Where(m => propertyIds.Contains(m.PropertyId));
        var openRequests = await maintenanceQuery.CountAsync(m =>
            m.Status == MaintenanceStatus.Submitted || m.Status == MaintenanceStatus.Acknowledged, ct);
        var inProgress = await maintenanceQuery.CountAsync(m => m.Status == MaintenanceStatus.InProgress, ct);
        var completedThisPeriod = await maintenanceQuery.CountAsync(m =>
            m.Status == MaintenanceStatus.Completed && m.CompletedAt >= from && m.CompletedAt <= to, ct);
        var critical = await maintenanceQuery.CountAsync(m =>
            m.Priority == MaintenancePriority.Critical
            && m.Status != MaintenanceStatus.Completed
            && m.Status != MaintenanceStatus.Cancelled, ct);

        var maintenanceKpi = new LandlordPortalMaintenanceKpi(openRequests, inProgress, completedThisPeriod, critical);

        // ── Notifications ──
        var unreadCount = 0;
        if (Guid.TryParse(_currentUser.UserId, out var userGuid))
        {
            unreadCount = await _db.AppNotifications.CountAsync(n => n.UserId == userGuid && !n.IsRead, ct);
        }

        return new LandlordPortalDashboardDto(
            ownerName, propertyKpi, rentKpi, waterKpi, maintenanceKpi, unreadCount);
    }
}

public record GetLandlordPortalPropertyListQuery : IRequest<List<LandlordPortalPropertyDto>>;

public class GetLandlordPortalPropertyListHandler : IRequestHandler<GetLandlordPortalPropertyListQuery, List<LandlordPortalPropertyDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetLandlordPortalPropertyListHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<List<LandlordPortalPropertyDto>> Handle(GetLandlordPortalPropertyListQuery _, CancellationToken ct)
    {
        var from = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var to = DateTime.UtcNow;

        var propertiesQuery = _db.Properties
            .Include(p => p.Buildings).ThenInclude(b => b.Apartments)
            .AsQueryable();

        if (!_currentUser.IsInRole("Admin"))
        {
            var authorizedIds = _currentUser.AuthorizedPropertyIds;
            propertiesQuery = propertiesQuery.Where(p => authorizedIds.Contains(p.Id));
        }

        var properties = await propertiesQuery.ToListAsync(ct);
        var result = new List<LandlordPortalPropertyDto>();

        foreach (var prop in properties)
        {
            var apartments = prop.Buildings.SelectMany(b => b.Apartments).ToList();
            var apartmentIds = apartments.Select(a => a.Id).ToList();

            var activeTenancies = await _db.Tenancies
                .Where(t => apartmentIds.Contains(t.ApartmentId) && t.Status == TenancyStatus.Active)
                .ToListAsync(ct);

            var occupiedUnits = activeTenancies.Select(t => t.ApartmentId).Distinct().Count();
            var monthlyExpected = activeTenancies.Sum(t => t.MonthlyRent);

            var meterIds = await _db.MeterAssignments
                .Where(ma => apartmentIds.Contains(ma.ApartmentId) && ma.UnassignedAt == null)
                .Select(ma => ma.MeterId).Distinct().ToListAsync(ct);

            var waterRevenue = await _db.WaterTransactions
                .Where(wt => apartmentIds.Contains(wt.UnitId)
                    && wt.TransactionDate >= from && wt.TransactionDate <= to)
                .SumAsync(wt => wt.Amount, ct);

            result.Add(new LandlordPortalPropertyDto(
                prop.Id, prop.Name, prop.PhysicalAddress, prop.Town, prop.County,
                prop.Type, prop.IsActive,
                prop.Buildings.Count, apartments.Count,
                occupiedUnits, apartments.Count - occupiedUnits,
                activeTenancies.Count, monthlyExpected,
                waterRevenue, meterIds.Count));
        }

        return result;
    }
}

public record GetLandlordPortalPropertyDetailQuery(Guid PropertyId) : IRequest<LandlordPortalPropertyDetailDto>;

public class GetLandlordPortalPropertyDetailHandler : IRequestHandler<GetLandlordPortalPropertyDetailQuery, LandlordPortalPropertyDetailDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetLandlordPortalPropertyDetailHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<LandlordPortalPropertyDetailDto> Handle(GetLandlordPortalPropertyDetailQuery req, CancellationToken ct)
    {
        if (!_currentUser.IsInRole("Admin") && !_currentUser.HasPropertyAccess(req.PropertyId))
            throw new ForbiddenException();

        var prop = await _db.Properties
            .Include(p => p.Buildings).ThenInclude(b => b.Apartments)
            .FirstOrDefaultAsync(p => p.Id == req.PropertyId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.Property), req.PropertyId);

        var apartments = prop.Buildings.SelectMany(b => b.Apartments).ToList();
        var apartmentIds = apartments.Select(a => a.Id).ToList();
        var from = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

        var activeTenancies = await _db.Tenancies
            .Where(t => apartmentIds.Contains(t.ApartmentId) && t.Status == TenancyStatus.Active)
            .ToListAsync(ct);

        var activeTenancyIds = activeTenancies.Select(t => t.Id).ToList();
        var occupiedUnits = activeTenancies.Select(t => t.ApartmentId).Distinct().Count();
        var monthlyExpected = activeTenancies.Sum(t => t.MonthlyRent);

        var rentCharges = await _db.RentCharges
            .Where(rc => activeTenancyIds.Contains(rc.TenancyId) && rc.BillingDate >= from)
            .ToListAsync(ct);
        var monthlyCollected = rentCharges.Sum(rc => rc.AmountPaid);
        var monthlyOutstanding = rentCharges.Sum(rc => Math.Max(0m, rc.Amount - rc.AmountPaid));

        var meterIds = await _db.MeterAssignments
            .Where(ma => apartmentIds.Contains(ma.ApartmentId) && ma.UnassignedAt == null)
            .Select(ma => ma.MeterId).Distinct().ToListAsync(ct);

        var waterRevenue = await _db.WaterTransactions
            .Where(wt => apartmentIds.Contains(wt.UnitId) && wt.TransactionDate >= from)
            .SumAsync(wt => wt.Amount, ct);

        var openMaintenance = await _db.MaintenanceRequests
            .CountAsync(m => m.PropertyId == req.PropertyId
                && m.Status != MaintenanceStatus.Completed
                && m.Status != MaintenanceStatus.Cancelled, ct);

        return new LandlordPortalPropertyDetailDto(
            prop.Id, prop.Name, prop.Description, prop.PhysicalAddress, prop.Town, prop.County,
            prop.Type, prop.IsActive,
            prop.Buildings.Count, apartments.Count,
            occupiedUnits, apartments.Count - occupiedUnits,
            activeTenancies.Count, monthlyExpected,
            monthlyCollected, monthlyOutstanding,
            waterRevenue, openMaintenance);
    }
}

public record GetLandlordStatementQuery(
    Guid? PropertyId,
    DateTime From,
    DateTime To) : IRequest<LandlordStatementDto>;

public class GetLandlordStatementHandler : IRequestHandler<GetLandlordStatementQuery, LandlordStatementDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetLandlordStatementHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<LandlordStatementDto> Handle(GetLandlordStatementQuery req, CancellationToken ct)
    {
        if (req.PropertyId.HasValue && !_currentUser.IsInRole("Admin") && !_currentUser.HasPropertyAccess(req.PropertyId.Value))
            throw new ForbiddenException();

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
        var propertyIds = properties.Select(p => p.Id).ToList();
        var apartments = properties.SelectMany(p => p.Buildings).SelectMany(b => b.Apartments).ToList();
        var apartmentIds = apartments.Select(a => a.Id).ToList();
        string? propertyName = properties.Count == 1 ? properties[0].Name : null;

        var tenancyIds = await _db.Tenancies
            .Where(t => apartmentIds.Contains(t.ApartmentId))
            .Select(t => t.Id).ToListAsync(ct);

        // Monthly breakdown
        var lines = new List<LandlordStatementLineDto>();
        var cursor = new DateTime(req.From.Year, req.From.Month, 1);
        while (cursor <= req.To)
        {
            var monthEnd = cursor.AddMonths(1).AddSeconds(-1);

            var rentCharges = await _db.RentCharges
                .Where(rc => tenancyIds.Contains(rc.TenancyId)
                    && rc.BillingDate >= cursor && rc.BillingDate <= monthEnd)
                .ToListAsync(ct);

            var waterRev = await _db.WaterTransactions
                .Where(wt => apartmentIds.Contains(wt.UnitId)
                    && wt.TransactionDate >= cursor && wt.TransactionDate <= monthEnd)
                .SumAsync(wt => wt.Amount, ct);

            var maintenanceCost = await _db.MaintenanceRequests
                .Where(m => propertyIds.Contains(m.PropertyId)
                    && m.CompletedAt >= cursor && m.CompletedAt <= monthEnd)
                .SumAsync(m => m.ActualCost ?? 0m, ct);

            var expected = rentCharges.Sum(rc => rc.Amount);
            var collected = rentCharges.Sum(rc => rc.AmountPaid);
            var outstanding = rentCharges.Sum(rc => Math.Max(0m, rc.Amount - rc.AmountPaid));

            lines.Add(new LandlordStatementLineDto(
                cursor.ToString("yyyy-MM"),
                expected, collected, outstanding,
                waterRev, maintenanceCost,
                collected + waterRev - maintenanceCost));

            cursor = cursor.AddMonths(1);
        }

        return new LandlordStatementDto(
            req.PropertyId, propertyName,
            req.From, req.To,
            lines.Sum(l => l.ExpectedRent),
            lines.Sum(l => l.CollectedRent),
            lines.Sum(l => l.OutstandingRent),
            lines.Sum(l => l.WaterRevenue),
            lines.Sum(l => l.MaintenanceCost),
            lines.Sum(l => l.NetIncome),
            lines);
    }
}
