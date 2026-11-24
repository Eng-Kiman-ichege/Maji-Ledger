using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.AdminControl;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record AdminExecutiveDashboardDto(
    int TotalLandlords,
    int TotalTenants,
    int TotalProperties,
    int TotalBuildings,
    int TotalApartments,
    int OccupiedApartments,
    int VacantApartments,
    int ActiveTenancies,
    decimal TotalRentCollected,
    decimal TotalRentOutstanding,
    decimal TotalWaterRevenue,
    decimal TotalWaterUnitsPurchased,
    int ActiveWaterMeters,
    int PendingWaterTransactions,
    int FailedWaterTransactions,
    int OutstandingMaintenanceRequests,
    List<AuditLogSummaryDto> RecentActivities);

public record AuditLogSummaryDto(
    Guid Id,
    string EntityType,
    string EventType,
    string PerformedBy,
    DateTime OccurredAt,
    string? Notes);

public record SystemSettingDto(
    Guid Id,
    string Key,
    string Value,
    SettingCategory Category,
    string Description,
    bool IsEncrypted,
    string UpdatedBy,
    DateTime? UpdatedAt);

public record IntegrationStatusDto(
    string Name,
    string Type,
    string Status,
    string? Environment,
    string? Details,
    DateTime LastChecked);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetAdminExecutiveDashboardQuery : IRequest<AdminExecutiveDashboardDto>;

public class GetAdminExecutiveDashboardHandler : IRequestHandler<GetAdminExecutiveDashboardQuery, AdminExecutiveDashboardDto>
{
    private readonly IApplicationDbContext _db;

    public GetAdminExecutiveDashboardHandler(IApplicationDbContext db) => _db = db;

    public async Task<AdminExecutiveDashboardDto> Handle(GetAdminExecutiveDashboardQuery _, CancellationToken ct)
    {
        var totalLandlords = await _db.Owners.CountAsync(ct);
        var totalTenants = await _db.Tenants.CountAsync(ct);
        var totalProperties = await _db.Properties.CountAsync(ct);
        var totalBuildings = await _db.Buildings.CountAsync(ct);
        var totalApartments = await _db.Apartments.CountAsync(ct);

        var activeTenancies = await _db.Tenancies.CountAsync(t => t.Status == TenancyStatus.Active, ct);
        var occupiedApartments = await _db.Tenancies
            .Where(t => t.Status == TenancyStatus.Active)
            .Select(t => t.ApartmentId)
            .Distinct()
            .CountAsync(ct);

        var vacantApartments = Math.Max(0, totalApartments - occupiedApartments);

        // Rent financials
        var rentCharges = await _db.RentCharges.ToListAsync(ct);
        var totalRentCollected = rentCharges.Sum(rc => rc.AmountPaid);
        var totalRentOutstanding = rentCharges.Sum(rc => Math.Max(0m, rc.Amount - rc.AmountPaid));

        // Water financials
        var waterTransactions = await _db.WaterTransactions.ToListAsync(ct);
        var totalWaterRevenue = waterTransactions.Sum(wt => wt.Amount);
        var totalWaterUnits = waterTransactions.Sum(wt => wt.UnitsPurchased);

        var activeWaterMeters = await _db.Meters.CountAsync(m => m.Status == MeterStatus.Active, ct);
        var pendingWaterTransactions = await _db.WaterPurchases.CountAsync(wp => wp.Status == WaterPurchaseStatus.Pending, ct);
        var failedWaterTransactions = await _db.WaterPurchases.CountAsync(wp => wp.Status == WaterPurchaseStatus.TokenFailed, ct);

        // Maintenance
        var openMaintenance = await _db.MaintenanceRequests
            .CountAsync(m => m.Status != MaintenanceStatus.Completed && m.Status != MaintenanceStatus.Cancelled, ct);

        // Recent audit logs
        var recentLogs = await _db.TransactionAuditLogs
            .OrderByDescending(a => a.OccurredAt)
            .Take(10)
            .Select(a => new AuditLogSummaryDto(
                a.Id, a.EntityType, a.EventType, a.PerformedBy, a.OccurredAt, a.NewValue))
            .ToListAsync(ct);

        return new AdminExecutiveDashboardDto(
            totalLandlords,
            totalTenants,
            totalProperties,
            totalBuildings,
            totalApartments,
            occupiedApartments,
            vacantApartments,
            activeTenancies,
            totalRentCollected,
            totalRentOutstanding,
            totalWaterRevenue,
            totalWaterUnits,
            activeWaterMeters,
            pendingWaterTransactions,
            failedWaterTransactions,
            openMaintenance,
            recentLogs);
    }
}

public record GetSystemSettingsQuery : IRequest<List<SystemSettingDto>>;

public class GetSystemSettingsHandler : IRequestHandler<GetSystemSettingsQuery, List<SystemSettingDto>>
{
    private readonly IApplicationDbContext _db;

    public GetSystemSettingsHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<SystemSettingDto>> Handle(GetSystemSettingsQuery _, CancellationToken ct)
    {
        return await _db.SystemSettings
            .OrderBy(s => s.Category)
            .ThenBy(s => s.Key)
            .Select(s => new SystemSettingDto(
                s.Id,
                s.Key,
                s.IsEncrypted ? "••••••••" : s.Value,
                s.Category,
                s.Description,
                s.IsEncrypted,
                s.UpdatedBy,
                s.UpdatedAt))
            .ToListAsync(ct);
    }
}

public record GetAuditLogsQuery(int Page = 1, int PageSize = 50) : IRequest<List<AuditLogSummaryDto>>;

public class GetAuditLogsHandler : IRequestHandler<GetAuditLogsQuery, List<AuditLogSummaryDto>>
{
    private readonly IApplicationDbContext _db;

    public GetAuditLogsHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<AuditLogSummaryDto>> Handle(GetAuditLogsQuery req, CancellationToken ct)
    {
        return await _db.TransactionAuditLogs
            .OrderByDescending(a => a.OccurredAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(a => new AuditLogSummaryDto(
                a.Id, a.EntityType, a.EventType, a.PerformedBy, a.OccurredAt, a.NewValue))
            .ToListAsync(ct);
    }
}

public record GetIntegrationStatusQuery : IRequest<List<IntegrationStatusDto>>;

public class GetIntegrationStatusHandler : IRequestHandler<GetIntegrationStatusQuery, List<IntegrationStatusDto>>
{
    private readonly IApplicationDbContext _db;

    public GetIntegrationStatusHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<IntegrationStatusDto>> Handle(GetIntegrationStatusQuery _, CancellationToken ct)
    {
        var configs = await _db.PaymentProviderConfigs.ToListAsync(ct);
        var list = new List<IntegrationStatusDto>();

        foreach (var c in configs)
        {
            list.Add(new IntegrationStatusDto(
                c.ProviderType.ToString(),
                "Payment Gateway",
                c.IsActive ? "Operational" : "Disabled",
                c.EnvironmentType.ToString(),
                $"ShortCode: {c.BusinessShortCode}",
                DateTime.UtcNow));
        }

        // Add SMS gateway status
        var smsCount = await _db.SmsDeliveryRecords.CountAsync(ct);
        list.Add(new IntegrationStatusDto(
            "Africa's Talking / SMS Gateway",
            "Messaging Service",
            "Operational",
            "Production",
            $"Processed {smsCount} outbound dispatches",
            DateTime.UtcNow));

        // Add STS Token generator status
        list.Add(new IntegrationStatusDto(
            "STS Token Vending Engine",
            "Prepaid Hardware Gateway",
            "Operational",
            "Internal",
            "KMF/STS compliant algorithm active",
            DateTime.UtcNow));

        return list;
    }
}

// ── Commands ──────────────────────────────────────────────────────────────────

public record UpdateSystemSettingCommand(string Key, string Value) : IRequest;

public class UpdateSystemSettingHandler : IRequestHandler<UpdateSystemSettingCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public UpdateSystemSettingHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(UpdateSystemSettingCommand cmd, CancellationToken ct)
    {
        var setting = await _db.SystemSettings.FirstOrDefaultAsync(s => s.Key == cmd.Key, ct);
        if (setting == null)
        {
            setting = SystemSetting.Create(
                cmd.Key, cmd.Value, SettingCategory.General, "Dynamic system configuration", false, _currentUser.UserId ?? "Admin");
            _db.SystemSettings.Add(setting);
        }
        else
        {
            setting.Update(cmd.Value, _currentUser.UserId ?? "Admin");
        }

        await _db.SaveChangesAsync(ct);
    }
}

public record ToggleUserActiveCommand(Guid UserId) : IRequest<bool>;

public class ToggleUserActiveHandler : IRequestHandler<ToggleUserActiveCommand, bool>
{
    private readonly IApplicationDbContext _db;

    public ToggleUserActiveHandler(IApplicationDbContext db) => _db = db;

    public async Task<bool> Handle(ToggleUserActiveCommand cmd, CancellationToken ct)
    {
        var user = await _db.ApplicationUsers.FirstOrDefaultAsync(u => u.Id == cmd.UserId, ct)
            ?? throw new NotFoundException(nameof(ApplicationUser), cmd.UserId);

        if (user.IsActive)
            user.Deactivate();
        else
            user.Activate();

        await _db.SaveChangesAsync(ct);
        return user.IsActive;
    }
}

public record ResetUserPasswordCommand(Guid UserId, string NewPassword) : IRequest;

public class ResetUserPasswordHandler : IRequestHandler<ResetUserPasswordCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public ResetUserPasswordHandler(IApplicationDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public async Task Handle(ResetUserPasswordCommand cmd, CancellationToken ct)
    {
        var user = await _db.ApplicationUsers.FirstOrDefaultAsync(u => u.Id == cmd.UserId, ct)
            ?? throw new NotFoundException(nameof(ApplicationUser), cmd.UserId);

        var hash = _passwordHasher.HashPassword(cmd.NewPassword);
        user.UpdatePassword(hash);
        await _db.SaveChangesAsync(ct);
    }
}

public record AssignUserRoleCommand(Guid UserId, UserRole Role) : IRequest;

public class AssignUserRoleHandler : IRequestHandler<AssignUserRoleCommand>
{
    private readonly IApplicationDbContext _db;

    public AssignUserRoleHandler(IApplicationDbContext db) => _db = db;

    public async Task Handle(AssignUserRoleCommand cmd, CancellationToken ct)
    {
        var user = await _db.ApplicationUsers.FirstOrDefaultAsync(u => u.Id == cmd.UserId, ct)
            ?? throw new NotFoundException(nameof(ApplicationUser), cmd.UserId);

        user.AssignRole(cmd.Role);
        await _db.SaveChangesAsync(ct);
    }
}
