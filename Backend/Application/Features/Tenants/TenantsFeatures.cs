using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.Tenants;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record TenantDto(
    Guid Id,
    string FirstName,
    string? MiddleName,
    string LastName,
    string FullName,
    string PhoneNumber,
    string? AlternativePhoneNumber,
    string? Email,
    string? NationalId,
    string? Address,
    bool IsActive,
    Guid? UserId,
    int ActiveTenanciesCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record TenantDetailDto(
    Guid Id,
    string FirstName,
    string? MiddleName,
    string LastName,
    string FullName,
    string PhoneNumber,
    string? AlternativePhoneNumber,
    string? Email,
    string? NationalId,
    string? Address,
    bool IsActive,
    Guid? UserId,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    List<TenantTenancySummaryDto> TenancyHistory);

public record TenantTenancySummaryDto(
    Guid TenancyId,
    Guid UnitId,
    string UnitNumber,
    Guid PropertyId,
    string PropertyName,
    string? BuildingName,
    string? TenancyReference,
    TenancyStatus Status,
    DateTime StartDate,
    DateTime? EndDate,
    decimal MonthlyRent,
    bool IsPrimaryTenant,
    DateTime JoinedAt,
    DateTime? LeftAt);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetTenantsQuery(
    string? SearchTerm = null,
    bool IncludeInactive = false) : IRequest<List<TenantDto>>;

public record GetTenantQuery(Guid Id) : IRequest<TenantDetailDto>;

public record GetTenantHistoryQuery(Guid TenantId) : IRequest<List<TenantTenancySummaryDto>>;

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreateTenantCommand(
    string FirstName,
    string LastName,
    string PhoneNumber,
    string? MiddleName = null,
    string? Email = null,
    string? NationalId = null,
    string? AlternativePhoneNumber = null,
    string? Address = null,
    Guid? UserId = null,
    string? CreatedBy = null) : IRequest<Guid>;

public record UpdateTenantCommand(
    Guid Id,
    string FirstName,
    string LastName,
    string PhoneNumber,
    string? MiddleName = null,
    string? Email = null,
    string? NationalId = null,
    string? AlternativePhoneNumber = null,
    string? Address = null,
    string? UpdatedBy = null) : IRequest<Unit>;

public record ActivateTenantCommand(Guid Id, string? UpdatedBy = null) : IRequest<Unit>;

public record DeactivateTenantCommand(Guid Id, string? UpdatedBy = null) : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetTenantsHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetTenantsQuery, List<TenantDto>>
{
    public async Task<List<TenantDto>> Handle(GetTenantsQuery request, CancellationToken ct)
    {
        var query = db.Tenants.AsQueryable();

        if (!request.IncludeInactive)
            query = query.Where(t => t.IsActive);

        // Landlord authorization scoping
        if (currentUser.OwnerId.HasValue && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("PlatformAdmin"))
        {
            var assignedPropertyIds = await db.PropertyOwnerships
                .Where(po => po.OwnerId == currentUser.OwnerId.Value && po.EffectiveTo == null)
                .Select(po => po.PropertyId)
                .ToListAsync(ct);

            // Restrict to tenants who have tenancies in landlord's properties
            var tenantIds = await db.Tenancies
                .Where(t => assignedPropertyIds.Contains(t.Apartment.Building.PropertyId))
                .SelectMany(t => t.Tenants.Select(tt => tt.TenantId))
                .Distinct()
                .ToListAsync(ct);

            query = query.Where(t => tenantIds.Contains(t.Id));
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(t =>
                t.FullName.ToLower().Contains(term) ||
                t.PhoneNumber.Contains(term) ||
                (t.NationalId != null && t.NationalId.Contains(term)) ||
                (t.Email != null && t.Email.ToLower().Contains(term)));
        }

        return await query
            .OrderBy(t => t.LastName)
            .ThenBy(t => t.FirstName)
            .Select(t => new TenantDto(
                t.Id,
                t.FirstName,
                t.MiddleName,
                t.LastName,
                t.FullName,
                t.PhoneNumber,
                t.AlternativePhoneNumber,
                t.Email,
                t.NationalId,
                t.Address,
                t.IsActive,
                t.UserId,
                t.TenancyAssignments.Count(ta => ta.LeftAt == null && ta.Tenancy.Status == TenancyStatus.Active),
                t.CreatedAt,
                t.UpdatedAt))
            .ToListAsync(ct);
    }
}

public class GetTenantHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetTenantQuery, TenantDetailDto>
{
    public async Task<TenantDetailDto> Handle(GetTenantQuery request, CancellationToken ct)
    {
        var tenant = await db.Tenants
            .Include(t => t.TenancyAssignments)
                .ThenInclude(ta => ta.Tenancy)
                    .ThenInclude(ten => ten.Apartment)
                        .ThenInclude(apt => apt.Building)
                            .ThenInclude(bld => bld.Property)
            .FirstOrDefaultAsync(t => t.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(Tenant), request.Id);

        // Landlord authorization scoping
        if (currentUser.OwnerId.HasValue && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("PlatformAdmin"))
        {
            var assignedPropertyIds = await db.PropertyOwnerships
                .Where(po => po.OwnerId == currentUser.OwnerId.Value && po.EffectiveTo == null)
                .Select(po => po.PropertyId)
                .ToListAsync(ct);

            var hasAccess = tenant.TenancyAssignments
                .Any(ta => assignedPropertyIds.Contains(ta.Tenancy.Apartment.Building.PropertyId));

            if (!hasAccess)
                throw new ForbiddenException("You are not authorized to view this tenant.");
        }

        var history = tenant.TenancyAssignments
            .OrderByDescending(ta => ta.JoinedAt)
            .Select(ta => new TenantTenancySummaryDto(
                ta.TenancyId,
                ta.Tenancy.ApartmentId,
                ta.Tenancy.Apartment.UnitNumber,
                ta.Tenancy.Apartment.Building.PropertyId,
                ta.Tenancy.Apartment.Building.Property.Name,
                ta.Tenancy.Apartment.Building.Name,
                ta.Tenancy.TenancyReference,
                ta.Tenancy.Status,
                ta.Tenancy.StartDate,
                ta.Tenancy.EndDate,
                ta.Tenancy.MonthlyRent,
                ta.IsPrimaryTenant,
                ta.JoinedAt,
                ta.LeftAt))
            .ToList();

        return new TenantDetailDto(
            tenant.Id,
            tenant.FirstName,
            tenant.MiddleName,
            tenant.LastName,
            tenant.FullName,
            tenant.PhoneNumber,
            tenant.AlternativePhoneNumber,
            tenant.Email,
            tenant.NationalId,
            tenant.Address,
            tenant.IsActive,
            tenant.UserId,
            tenant.CreatedAt,
            tenant.UpdatedAt,
            history);
    }
}

public class GetTenantHistoryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetTenantHistoryQuery, List<TenantTenancySummaryDto>>
{
    public async Task<List<TenantTenancySummaryDto>> Handle(GetTenantHistoryQuery request, CancellationToken ct)
    {
        if (!await db.Tenants.AnyAsync(t => t.Id == request.TenantId, ct))
            throw new NotFoundException(nameof(Tenant), request.TenantId);

        var query = db.TenancyTenants
            .Where(tt => tt.TenantId == request.TenantId)
            .Include(tt => tt.Tenancy)
                .ThenInclude(ten => ten.Apartment)
                    .ThenInclude(apt => apt.Building)
                        .ThenInclude(bld => bld.Property)
            .AsQueryable();

        // Landlord authorization scoping
        if (currentUser.OwnerId.HasValue && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("PlatformAdmin"))
        {
            var assignedPropertyIds = await db.PropertyOwnerships
                .Where(po => po.OwnerId == currentUser.OwnerId.Value && po.EffectiveTo == null)
                .Select(po => po.PropertyId)
                .ToListAsync(ct);

            query = query.Where(tt => assignedPropertyIds.Contains(tt.Tenancy.Apartment.Building.PropertyId));
        }

        return await query
            .OrderByDescending(tt => tt.JoinedAt)
            .Select(tt => new TenantTenancySummaryDto(
                tt.TenancyId,
                tt.Tenancy.ApartmentId,
                tt.Tenancy.Apartment.UnitNumber,
                tt.Tenancy.Apartment.Building.PropertyId,
                tt.Tenancy.Apartment.Building.Property.Name,
                tt.Tenancy.Apartment.Building.Name,
                tt.Tenancy.TenancyReference,
                tt.Tenancy.Status,
                tt.Tenancy.StartDate,
                tt.Tenancy.EndDate,
                tt.Tenancy.MonthlyRent,
                tt.IsPrimaryTenant,
                tt.JoinedAt,
                tt.LeftAt))
            .ToListAsync(ct);
    }
}

public class CreateTenantHandler(IApplicationDbContext db)
    : IRequestHandler<CreateTenantCommand, Guid>
{
    public async Task<Guid> Handle(CreateTenantCommand cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.FirstName))
            throw new ValidationException(nameof(cmd.FirstName), "First name is required.");

        if (string.IsNullOrWhiteSpace(cmd.LastName))
            throw new ValidationException(nameof(cmd.LastName), "Last name is required.");

        if (string.IsNullOrWhiteSpace(cmd.PhoneNumber))
            throw new ValidationException(nameof(cmd.PhoneNumber), "Phone number is required.");

        var trimmedPhone = cmd.PhoneNumber.Trim();
        if (await db.Tenants.AnyAsync(t => t.PhoneNumber == trimmedPhone && t.IsActive, ct))
            throw new ConflictException($"A tenant with phone number '{trimmedPhone}' already exists.");

        var tenant = Tenant.Create(
            cmd.FirstName,
            cmd.LastName,
            cmd.PhoneNumber,
            cmd.MiddleName,
            cmd.Email,
            cmd.NationalId,
            cmd.AlternativePhoneNumber,
            cmd.Address,
            cmd.UserId,
            cmd.CreatedBy);

        db.Tenants.Add(tenant);
        await db.SaveChangesAsync(ct);
        return tenant.Id;
    }
}

public class UpdateTenantHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateTenantCommand, Unit>
{
    public async Task<Unit> Handle(UpdateTenantCommand cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.FirstName))
            throw new ValidationException(nameof(cmd.FirstName), "First name is required.");

        if (string.IsNullOrWhiteSpace(cmd.LastName))
            throw new ValidationException(nameof(cmd.LastName), "Last name is required.");

        if (string.IsNullOrWhiteSpace(cmd.PhoneNumber))
            throw new ValidationException(nameof(cmd.PhoneNumber), "Phone number is required.");

        var tenant = await db.Tenants.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(Tenant), cmd.Id);

        var trimmedPhone = cmd.PhoneNumber.Trim();
        if (await db.Tenants.AnyAsync(t => t.PhoneNumber == trimmedPhone && t.Id != cmd.Id && t.IsActive, ct))
            throw new ConflictException($"Another active tenant with phone number '{trimmedPhone}' already exists.");

        tenant.Update(
            cmd.FirstName,
            cmd.LastName,
            cmd.PhoneNumber,
            cmd.MiddleName,
            cmd.Email,
            cmd.NationalId,
            cmd.AlternativePhoneNumber,
            cmd.Address,
            cmd.UpdatedBy ?? "system");

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class ActivateTenantHandler(IApplicationDbContext db)
    : IRequestHandler<ActivateTenantCommand, Unit>
{
    public async Task<Unit> Handle(ActivateTenantCommand cmd, CancellationToken ct)
    {
        var tenant = await db.Tenants.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(Tenant), cmd.Id);

        tenant.Activate(cmd.UpdatedBy ?? "system");
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class DeactivateTenantHandler(IApplicationDbContext db)
    : IRequestHandler<DeactivateTenantCommand, Unit>
{
    public async Task<Unit> Handle(DeactivateTenantCommand cmd, CancellationToken ct)
    {
        var tenant = await db.Tenants.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(Tenant), cmd.Id);

        // Check if tenant is currently active in any ongoing tenancy
        var hasActiveTenancy = await db.TenancyTenants
            .AnyAsync(tt => tt.TenantId == cmd.Id && tt.LeftAt == null && tt.Tenancy.Status == TenancyStatus.Active, ct);

        if (hasActiveTenancy)
            throw new ConflictException("Cannot deactivate a tenant who currently occupies an active tenancy.");

        tenant.Deactivate(cmd.UpdatedBy ?? "system");
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
