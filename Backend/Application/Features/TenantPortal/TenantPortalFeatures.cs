using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.TenantPortal;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record TenantRecentPaymentDto(
    Guid Id,
    string Reference,
    decimal Amount,
    DateTime PaidAt,
    string Method,
    string? ReceiptNumber);

public record TenantRecentWaterPurchaseDto(
    Guid Id,
    string Reference,
    decimal Amount,
    decimal UnitsPurchased,
    string? TokenValue,
    DateTime Date);

public record TenantPortalDashboardDto(
    Guid TenantId,
    string FullName,
    string PhoneNumber,
    string? Email,
    Guid? TenancyId,
    string? TenancyReference,
    TenancyStatus? TenancyStatus,
    string? PropertyName,
    string? BuildingName,
    string? UnitNumber,
    decimal MonthlyRent,
    int RentDueDay,
    DateTime? StartDate,
    decimal OutstandingBalance,
    decimal TotalRentPaid,
    string? WaterMeterNumber,
    int OpenMaintenanceCount,
    List<TenantRecentPaymentDto> RecentPayments,
    List<TenantRecentWaterPurchaseDto> RecentWaterPurchases);

public record TenantProfileDto(
    Guid Id,
    string FirstName,
    string? MiddleName,
    string LastName,
    string PhoneNumber,
    string? AlternativePhoneNumber,
    string? Email,
    string? NationalId,
    string? Address);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetTenantPortalDashboardQuery : IRequest<TenantPortalDashboardDto>;

public class GetTenantPortalDashboardHandler : IRequestHandler<GetTenantPortalDashboardQuery, TenantPortalDashboardDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetTenantPortalDashboardHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<TenantPortalDashboardDto> Handle(GetTenantPortalDashboardQuery _, CancellationToken ct)
    {
        // Resolve Tenant record
        Tenant? tenant = null;
        if (_currentUser.TenantId.HasValue)
        {
            tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == _currentUser.TenantId.Value, ct);
        }
        else if (Guid.TryParse(_currentUser.UserId, out var userGuid))
        {
            tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.UserId == userGuid, ct);
        }

        if (tenant == null)
            throw new ForbiddenException("No tenant profile linked to the authenticated account.");

        // Find current active tenancy
        var tenancy = await _db.Tenancies
            .Include(t => t.Apartment)
                .ThenInclude(a => a.Building)
                    .ThenInclude(b => b.Property)
            .Include(t => t.Apartment)
                .ThenInclude(a => a.MeterAssignments)
                    .ThenInclude(ma => ma.Meter)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync(t => t.TenantId == tenant.Id && (t.Status == TenancyStatus.Active || t.Status == TenancyStatus.Pending), ct);

        // Rent financial stats
        var rentCharges = await _db.RentCharges
            .Where(rc => rc.TenantId == tenant.Id)
            .ToListAsync(ct);

        var totalPaid = rentCharges.Sum(rc => rc.AmountPaid);
        var totalOutstanding = rentCharges.Sum(rc => Math.Max(0m, rc.Amount - rc.AmountPaid));

        // Recent payments
        var recentPayments = await _db.RentPayments
            .Where(rp => rp.TenantId == tenant.Id && rp.PaymentStatus == RentPaymentStatus.Confirmed)
            .OrderByDescending(rp => rp.PaymentDate)
            .Take(5)
            .Select(rp => new TenantRecentPaymentDto(
                rp.Id, rp.PaymentReference, rp.Amount, rp.PaymentDate, rp.PaymentMethod.ToString(), rp.ReceiptNumber))
            .ToListAsync(ct);

        // Meter and water transactions
        string? meterNumber = null;
        var recentWaterPurchases = new List<TenantRecentWaterPurchaseDto>();

        if (tenancy?.Apartment != null)
        {
            var activeMeter = tenancy.Apartment.MeterAssignments
                .FirstOrDefault(ma => ma.UnassignedAt == null)?.Meter;
            meterNumber = activeMeter?.MeterNumber;

            recentWaterPurchases = await _db.WaterTransactions
                .Where(wt => wt.UnitId == tenancy.ApartmentId || wt.TenantId == tenant.Id)
                .OrderByDescending(wt => wt.TransactionDate)
                .Take(5)
                .Select(wt => new TenantRecentWaterPurchaseDto(
                    wt.Id, wt.TransactionReference, wt.Amount, wt.UnitsPurchased, wt.TokenValue, wt.TransactionDate))
                .ToListAsync(ct);
        }

        // Open maintenance count
        var openMaintenanceCount = await _db.MaintenanceRequests
            .CountAsync(m => (m.TenantId == tenant.Id || (tenancy != null && m.ApartmentId == tenancy.ApartmentId))
                && m.Status != MaintenanceStatus.Completed
                && m.Status != MaintenanceStatus.Cancelled, ct);

        return new TenantPortalDashboardDto(
            tenant.Id,
            $"{tenant.FirstName} {tenant.LastName}",
            tenant.PhoneNumber,
            tenant.Email,
            tenancy?.Id,
            tenancy?.TenancyReference,
            tenancy?.Status,
            tenancy?.Apartment?.Building?.Property?.Name,
            tenancy?.Apartment?.Building?.Name,
            tenancy?.Apartment?.UnitNumber,
            tenancy?.MonthlyRent ?? 0m,
            tenancy?.RentPaymentDueDay ?? 1,
            tenancy?.StartDate,
            totalOutstanding,
            totalPaid,
            meterNumber,
            openMaintenanceCount,
            recentPayments,
            recentWaterPurchases);
    }
}

public record GetTenantProfileQuery : IRequest<TenantProfileDto>;

public class GetTenantProfileHandler : IRequestHandler<GetTenantProfileQuery, TenantProfileDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetTenantProfileHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<TenantProfileDto> Handle(GetTenantProfileQuery _, CancellationToken ct)
    {
        Tenant? tenant = null;
        if (_currentUser.TenantId.HasValue)
            tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == _currentUser.TenantId.Value, ct);
        else if (Guid.TryParse(_currentUser.UserId, out var userGuid))
            tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.UserId == userGuid, ct);

        if (tenant == null)
            throw new ForbiddenException("No tenant profile linked to this account.");

        return new TenantProfileDto(
            tenant.Id, tenant.FirstName, tenant.MiddleName, tenant.LastName,
            tenant.PhoneNumber, tenant.AlternativePhoneNumber, tenant.Email,
            tenant.NationalId, tenant.Address);
    }
}

// ── Commands ──────────────────────────────────────────────────────────────────

public record UpdateTenantProfileCommand(
    string PhoneNumber,
    string? AlternativePhoneNumber,
    string? Email,
    string? Address) : IRequest;

public class UpdateTenantProfileHandler : IRequestHandler<UpdateTenantProfileCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public UpdateTenantProfileHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(UpdateTenantProfileCommand cmd, CancellationToken ct)
    {
        Tenant? tenant = null;
        if (_currentUser.TenantId.HasValue)
            tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == _currentUser.TenantId.Value, ct);
        else if (Guid.TryParse(_currentUser.UserId, out var userGuid))
            tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.UserId == userGuid, ct);

        if (tenant == null)
            throw new ForbiddenException("No tenant profile linked to this account.");

        tenant.Update(
            tenant.FirstName,
            tenant.LastName,
            cmd.PhoneNumber,
            tenant.MiddleName,
            cmd.Email,
            tenant.NationalId,
            cmd.AlternativePhoneNumber,
            cmd.Address,
            _currentUser.UserId ?? "Tenant");
        await _db.SaveChangesAsync(ct);
    }
}
