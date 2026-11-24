using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.Tenancies;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record TenancyDetailDto(
    Guid Id,
    Guid UnitId,
    string UnitNumber,
    Guid PropertyId,
    string PropertyName,
    Guid BuildingId,
    string BuildingName,
    string? TenancyReference,
    TenancyStatus Status,
    DateTime StartDate,
    DateTime? ExpectedEndDate,
    DateTime? ActualEndDate,
    decimal MonthlyRent,
    decimal SecurityDeposit,
    int RentPaymentDueDay,
    BillingFrequency BillingFrequency,
    string? AgreementNotes,
    PrimaryTenantDto PrimaryTenant,
    List<TenancyOccupantDto> Occupants,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record TenancySummaryDto(
    Guid Id,
    Guid UnitId,
    string UnitNumber,
    Guid PropertyId,
    string PropertyName,
    string BuildingName,
    string? TenancyReference,
    TenancyStatus Status,
    DateTime StartDate,
    DateTime? ExpectedEndDate,
    DateTime? ActualEndDate,
    decimal MonthlyRent,
    decimal SecurityDeposit,
    int OccupantCount,
    PrimaryTenantDto PrimaryTenant,
    DateTime CreatedAt);

public record PrimaryTenantDto(
    Guid TenantId,
    string FullName,
    string PhoneNumber,
    string? Email,
    string? NationalId);

public record TenancyOccupantDto(
    Guid AssignmentId,
    Guid TenantId,
    string FullName,
    string PhoneNumber,
    string? Email,
    string? NationalId,
    bool IsPrimaryTenant,
    DateTime JoinedAt,
    DateTime? LeftAt,
    bool IsActive);

public record OccupancyHistoryRecordDto(
    Guid TenancyId,
    string? TenancyReference,
    TenancyStatus Status,
    DateTime StartDate,
    DateTime? EndDate,
    decimal MonthlyRent,
    PrimaryTenantDto PrimaryTenant,
    int TotalOccupants,
    string? Notes);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetTenanciesQuery(
    Guid? PropertyId = null,
    Guid? UnitId = null,
    TenancyStatus? Status = null) : IRequest<List<TenancySummaryDto>>;

public record GetActiveTenanciesQuery(Guid? PropertyId = null) : IRequest<List<TenancySummaryDto>>;

public record GetTenancyByIdQuery(Guid Id) : IRequest<TenancyDetailDto>;

public record GetTenanciesByPropertyQuery(Guid PropertyId) : IRequest<List<TenancySummaryDto>>;

public record GetTenanciesByApartmentQuery(Guid ApartmentId) : IRequest<List<TenancySummaryDto>>;

public record GetApartmentOccupancyHistoryQuery(Guid ApartmentId) : IRequest<List<OccupancyHistoryRecordDto>>;

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreateTenancyCommand(
    Guid UnitId,
    Guid PrimaryTenantId,
    decimal MonthlyRent,
    decimal SecurityDeposit,
    DateTime StartDate,
    string? TenancyReference = null,
    DateTime? ExpectedEndDate = null,
    int RentPaymentDueDay = 1,
    BillingFrequency BillingFrequency = BillingFrequency.Monthly,
    string? AgreementNotes = null,
    string? CreatedBy = null) : IRequest<Guid>;

public record AddTenantToTenancyCommand(
    Guid TenancyId,
    Guid TenantId,
    bool IsPrimaryTenant = false,
    DateTime? JoinedAt = null,
    string? UpdatedBy = null) : IRequest<Guid>;

public record RemoveTenantFromTenancyCommand(
    Guid TenancyId,
    Guid TenantId,
    DateTime? LeftAt = null,
    string? UpdatedBy = null) : IRequest<Unit>;

public record ChangePrimaryTenantCommand(
    Guid TenancyId,
    Guid NewPrimaryTenantId,
    string? UpdatedBy = null) : IRequest<Unit>;

public record UpdateTenancyCommand(
    Guid Id,
    decimal MonthlyRent,
    decimal SecurityDeposit,
    int RentPaymentDueDay,
    BillingFrequency BillingFrequency,
    DateTime? ExpectedEndDate,
    string? AgreementNotes,
    string? UpdatedBy = null) : IRequest<Unit>;

public record RenewTenancyCommand(
    Guid Id,
    DateTime NewExpectedEndDate,
    decimal? NewRent = null,
    string? Notes = null,
    string? UpdatedBy = null) : IRequest<Unit>;

public record TerminateTenancyCommand(
    Guid Id,
    DateTime? ActualEndDate = null,
    string? Notes = null,
    string? UpdatedBy = null) : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetTenanciesHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetTenanciesQuery, List<TenancySummaryDto>>
{
    public async Task<List<TenancySummaryDto>> Handle(GetTenanciesQuery request, CancellationToken ct)
    {
        var query = db.Tenancies
            .Include(t => t.Apartment)
                .ThenInclude(a => a.Building)
                    .ThenInclude(b => b.Property)
            .Include(t => t.Tenants)
                .ThenInclude(tt => tt.Tenant)
            .AsQueryable();

        // Landlord authorization scoping
        if (currentUser.OwnerId.HasValue && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("PlatformAdmin"))
        {
            var assignedPropertyIds = await db.PropertyOwnerships
                .Where(po => po.OwnerId == currentUser.OwnerId.Value && po.EffectiveTo == null)
                .Select(po => po.PropertyId)
                .ToListAsync(ct);

            query = query.Where(t => assignedPropertyIds.Contains(t.Apartment.Building.PropertyId));
        }

        if (request.PropertyId.HasValue)
            query = query.Where(t => t.Apartment.Building.PropertyId == request.PropertyId.Value);

        if (request.UnitId.HasValue)
            query = query.Where(t => t.ApartmentId == request.UnitId.Value);

        if (request.Status.HasValue)
            query = query.Where(t => t.Status == request.Status.Value);

        var list = await query
            .OrderByDescending(t => t.StartDate)
            .ToListAsync(ct);

        return list.Select(MapToSummaryDto).ToList();
    }

    internal static TenancySummaryDto MapToSummaryDto(Tenancy t)
    {
        var primary = t.Tenants.FirstOrDefault(tt => tt.IsPrimaryTenant && tt.LeftAt == null)?.Tenant
            ?? t.Tenant;

        var primaryDto = primary != null
            ? new PrimaryTenantDto(primary.Id, primary.FullName, primary.PhoneNumber, primary.Email, primary.NationalId)
            : new PrimaryTenantDto(Guid.Empty, "Unknown", "", null, null);

        return new TenancySummaryDto(
            t.Id,
            t.ApartmentId,
            t.Apartment?.UnitNumber ?? "Unknown",
            t.Apartment?.Building?.PropertyId ?? Guid.Empty,
            t.Apartment?.Building?.Property?.Name ?? "Unknown",
            t.Apartment?.Building?.Name ?? "Unknown",
            t.TenancyReference,
            t.Status,
            t.StartDate,
            t.ExpectedEndDate,
            t.ActualEndDate,
            t.MonthlyRent,
            t.SecurityDeposit,
            t.Tenants.Count(tt => tt.LeftAt == null),
            primaryDto,
            t.CreatedAt);
    }
}

public class GetActiveTenanciesHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetActiveTenanciesQuery, List<TenancySummaryDto>>
{
    public async Task<List<TenancySummaryDto>> Handle(GetActiveTenanciesQuery request, CancellationToken ct)
    {
        var query = new GetTenanciesQuery(request.PropertyId, Status: TenancyStatus.Active);
        var handler = new GetTenanciesHandler(db, currentUser);
        return await handler.Handle(query, ct);
    }
}

public class GetTenancyByIdHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetTenancyByIdQuery, TenancyDetailDto>
{
    public async Task<TenancyDetailDto> Handle(GetTenancyByIdQuery request, CancellationToken ct)
    {
        var tenancy = await db.Tenancies
            .Include(t => t.Apartment)
                .ThenInclude(a => a.Building)
                    .ThenInclude(b => b.Property)
            .Include(t => t.Tenants)
                .ThenInclude(tt => tt.Tenant)
            .FirstOrDefaultAsync(t => t.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(Tenancy), request.Id);

        // Landlord authorization check
        if (currentUser.OwnerId.HasValue && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("PlatformAdmin"))
        {
            var hasAccess = await db.PropertyOwnerships
                .AnyAsync(po => po.PropertyId == tenancy.Apartment.Building.PropertyId &&
                                po.OwnerId == currentUser.OwnerId.Value &&
                                po.EffectiveTo == null, ct);

            if (!hasAccess)
                throw new ForbiddenException("You are not authorized to view this tenancy.");
        }

        var primary = tenancy.Tenants.FirstOrDefault(tt => tt.IsPrimaryTenant && tt.LeftAt == null)?.Tenant
            ?? tenancy.Tenant;

        var primaryDto = primary != null
            ? new PrimaryTenantDto(primary.Id, primary.FullName, primary.PhoneNumber, primary.Email, primary.NationalId)
            : new PrimaryTenantDto(Guid.Empty, "Unknown", "", null, null);

        var occupants = tenancy.Tenants
            .OrderByDescending(tt => tt.IsPrimaryTenant)
            .ThenBy(tt => tt.JoinedAt)
            .Select(tt => new TenancyOccupantDto(
                tt.Id,
                tt.TenantId,
                tt.Tenant?.FullName ?? "Unknown",
                tt.Tenant?.PhoneNumber ?? "",
                tt.Tenant?.Email,
                tt.Tenant?.NationalId,
                tt.IsPrimaryTenant,
                tt.JoinedAt,
                tt.LeftAt,
                tt.LeftAt == null))
            .ToList();

        return new TenancyDetailDto(
            tenancy.Id,
            tenancy.ApartmentId,
            tenancy.Apartment.UnitNumber,
            tenancy.Apartment.Building.PropertyId,
            tenancy.Apartment.Building.Property.Name,
            tenancy.Apartment.BuildingId,
            tenancy.Apartment.Building.Name,
            tenancy.TenancyReference,
            tenancy.Status,
            tenancy.StartDate,
            tenancy.ExpectedEndDate,
            tenancy.ActualEndDate,
            tenancy.MonthlyRent,
            tenancy.SecurityDeposit,
            tenancy.RentPaymentDueDay,
            tenancy.BillingFrequency,
            tenancy.AgreementNotes,
            primaryDto,
            occupants,
            tenancy.CreatedAt,
            tenancy.UpdatedAt);
    }
}

public class GetApartmentOccupancyHistoryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetApartmentOccupancyHistoryQuery, List<OccupancyHistoryRecordDto>>
{
    public async Task<List<OccupancyHistoryRecordDto>> Handle(GetApartmentOccupancyHistoryQuery request, CancellationToken ct)
    {
        var apartment = await db.Apartments
            .Include(a => a.Building)
            .FirstOrDefaultAsync(a => a.Id == request.ApartmentId && !a.IsDeleted, ct)
            ?? throw new NotFoundException(nameof(Apartment), request.ApartmentId);

        if (currentUser.OwnerId.HasValue && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("PlatformAdmin"))
        {
            var hasAccess = await db.PropertyOwnerships
                .AnyAsync(po => po.PropertyId == apartment.Building.PropertyId &&
                                po.OwnerId == currentUser.OwnerId.Value &&
                                po.EffectiveTo == null, ct);

            if (!hasAccess)
                throw new ForbiddenException("You are not authorized to view occupancy history for this unit.");
        }

        var tenancies = await db.Tenancies
            .Where(t => t.ApartmentId == request.ApartmentId)
            .Include(t => t.Tenants)
                .ThenInclude(tt => tt.Tenant)
            .OrderByDescending(t => t.StartDate)
            .ToListAsync(ct);

        return tenancies.Select(t =>
        {
            var primary = t.Tenants.FirstOrDefault(tt => tt.IsPrimaryTenant)?.Tenant ?? t.Tenant;
            var primaryDto = primary != null
                ? new PrimaryTenantDto(primary.Id, primary.FullName, primary.PhoneNumber, primary.Email, primary.NationalId)
                : new PrimaryTenantDto(Guid.Empty, "Unknown", "", null, null);

            return new OccupancyHistoryRecordDto(
                t.Id,
                t.TenancyReference,
                t.Status,
                t.StartDate,
                t.EndDate,
                t.MonthlyRent,
                primaryDto,
                t.Tenants.Count,
                t.AgreementNotes);
        }).ToList();
    }
}

public class CreateTenancyHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<CreateTenancyCommand, Guid>
{
    public async Task<Guid> Handle(CreateTenancyCommand cmd, CancellationToken ct)
    {
        if (cmd.MonthlyRent < 0)
            throw new ValidationException(nameof(cmd.MonthlyRent), "Monthly rent cannot be negative.");

        if (cmd.SecurityDeposit < 0)
            throw new ValidationException(nameof(cmd.SecurityDeposit), "Security deposit cannot be negative.");

        if (cmd.RentPaymentDueDay < 1 || cmd.RentPaymentDueDay > 31)
            throw new ValidationException(nameof(cmd.RentPaymentDueDay), "Rent payment due day must be between 1 and 31.");

        if (cmd.ExpectedEndDate.HasValue && cmd.ExpectedEndDate.Value <= cmd.StartDate)
            throw new ValidationException(nameof(cmd.ExpectedEndDate), "Expected end date must be after the start date.");

        var apartment = await db.Apartments
            .Include(a => a.Building)
            .FirstOrDefaultAsync(a => a.Id == cmd.UnitId && !a.IsDeleted, ct)
            ?? throw new NotFoundException(nameof(Apartment), cmd.UnitId);

        // Landlord authorization check
        if (currentUser.OwnerId.HasValue && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("PlatformAdmin"))
        {
            var hasAccess = await db.PropertyOwnerships
                .AnyAsync(po => po.PropertyId == apartment.Building.PropertyId &&
                                po.OwnerId == currentUser.OwnerId.Value &&
                                po.EffectiveTo == null, ct);

            if (!hasAccess)
                throw new ForbiddenException("You are not authorized to create a tenancy for this property.");
        }

        var tenant = await db.Tenants.FindAsync([cmd.PrimaryTenantId], ct)
            ?? throw new NotFoundException(nameof(Tenant), cmd.PrimaryTenantId);

        if (!tenant.IsActive)
            throw new ValidationException(nameof(cmd.PrimaryTenantId), "Cannot create a tenancy with an inactive tenant.");

        // Rule: An apartment can have only one active tenancy at a time
        var hasActiveTenancy = await db.Tenancies
            .AnyAsync(t => t.ApartmentId == cmd.UnitId && t.Status == TenancyStatus.Active, ct);

        if (hasActiveTenancy)
            throw new ConflictException($"Unit '{apartment.UnitNumber}' already has an active tenancy. Terminate the existing tenancy before creating a new one.");

        var refCode = string.IsNullOrWhiteSpace(cmd.TenancyReference)
            ? $"TEN-{apartment.UnitNumber}-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(100, 999)}"
            : cmd.TenancyReference.Trim();

        if (await db.Tenancies.AnyAsync(t => t.TenancyReference == refCode, ct))
            throw new ConflictException($"Tenancy reference '{refCode}' is already in use.");

        var tenancy = Tenancy.Create(
            cmd.UnitId,
            cmd.PrimaryTenantId,
            cmd.MonthlyRent,
            cmd.SecurityDeposit,
            cmd.StartDate,
            refCode,
            cmd.ExpectedEndDate,
            cmd.RentPaymentDueDay,
            cmd.BillingFrequency,
            cmd.AgreementNotes,
            TenancyStatus.Active,
            cmd.CreatedBy);

        db.Tenancies.Add(tenancy);

        // Authoritative occupancy sync
        apartment.MarkOccupied(cmd.CreatedBy ?? "system");

        await db.SaveChangesAsync(ct);
        return tenancy.Id;
    }
}

public class AddTenantToTenancyHandler(IApplicationDbContext db)
    : IRequestHandler<AddTenantToTenancyCommand, Guid>
{
    public async Task<Guid> Handle(AddTenantToTenancyCommand cmd, CancellationToken ct)
    {
        var tenancy = await db.Tenancies
            .Include(t => t.Tenants)
            .FirstOrDefaultAsync(t => t.Id == cmd.TenancyId, ct)
            ?? throw new NotFoundException(nameof(Tenancy), cmd.TenancyId);

        if (tenancy.Status != TenancyStatus.Active && tenancy.Status != TenancyStatus.Pending)
            throw new ConflictException("Cannot add a tenant to a terminated, cancelled or expired tenancy.");

        var tenant = await db.Tenants.FindAsync([cmd.TenantId], ct)
            ?? throw new NotFoundException(nameof(Tenant), cmd.TenantId);

        if (!tenant.IsActive)
            throw new ValidationException(nameof(cmd.TenantId), "Cannot add an inactive tenant to a tenancy.");

        var alreadyOccupant = tenancy.Tenants.Any(t => t.TenantId == cmd.TenantId && t.LeftAt == null);
        if (alreadyOccupant)
            throw new ConflictException("This tenant is already an active occupant of this tenancy.");

        var assignment = TenancyTenant.Create(tenancy.Id, cmd.TenantId, cmd.IsPrimaryTenant, cmd.JoinedAt);
        if (cmd.IsPrimaryTenant)
        {
            tenancy.SetPrimaryTenant(cmd.TenantId);
        }

        db.TenancyTenants.Add(assignment);
        await db.SaveChangesAsync(ct);

        return assignment.Id;
    }
}

public class RemoveTenantFromTenancyHandler(IApplicationDbContext db)
    : IRequestHandler<RemoveTenantFromTenancyCommand, Unit>
{
    public async Task<Unit> Handle(RemoveTenantFromTenancyCommand cmd, CancellationToken ct)
    {
        var tenancy = await db.Tenancies
            .Include(t => t.Tenants)
            .Include(t => t.Apartment)
            .FirstOrDefaultAsync(t => t.Id == cmd.TenancyId, ct)
            ?? throw new NotFoundException(nameof(Tenancy), cmd.TenancyId);

        var assignment = tenancy.Tenants.FirstOrDefault(t => t.TenantId == cmd.TenantId && t.LeftAt == null)
            ?? throw new NotFoundException(nameof(TenancyTenant), cmd.TenantId);

        var leaveDate = cmd.LeftAt ?? DateTime.UtcNow;
        if (leaveDate < assignment.JoinedAt)
            throw new ValidationException(nameof(cmd.LeftAt), "Move-out date cannot precede move-in date.");

        tenancy.RemoveTenant(cmd.TenantId, leaveDate);

        // If no active occupants remain, terminate tenancy and mark unit vacant
        if (!tenancy.Tenants.Any(t => t.LeftAt == null))
        {
            tenancy.Terminate(leaveDate, "Terminated automatically: all occupants moved out.");
            tenancy.Apartment.MarkVacant(cmd.UpdatedBy ?? "system");
        }

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class ChangePrimaryTenantHandler(IApplicationDbContext db)
    : IRequestHandler<ChangePrimaryTenantCommand, Unit>
{
    public async Task<Unit> Handle(ChangePrimaryTenantCommand cmd, CancellationToken ct)
    {
        var tenancy = await db.Tenancies
            .Include(t => t.Tenants)
            .FirstOrDefaultAsync(t => t.Id == cmd.TenancyId, ct)
            ?? throw new NotFoundException(nameof(Tenancy), cmd.TenancyId);

        var target = tenancy.Tenants.FirstOrDefault(t => t.TenantId == cmd.NewPrimaryTenantId && t.LeftAt == null)
            ?? throw new NotFoundException(nameof(TenancyTenant), cmd.NewPrimaryTenantId);

        tenancy.SetPrimaryTenant(cmd.NewPrimaryTenantId);
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class UpdateTenancyHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateTenancyCommand, Unit>
{
    public async Task<Unit> Handle(UpdateTenancyCommand cmd, CancellationToken ct)
    {
        var tenancy = await db.Tenancies.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(Tenancy), cmd.Id);

        if (tenancy.Status == TenancyStatus.Terminated || tenancy.Status == TenancyStatus.Cancelled)
            throw new ConflictException("Cannot edit a terminated or cancelled tenancy agreement.");

        tenancy.UpdateAgreement(
            cmd.MonthlyRent,
            cmd.SecurityDeposit,
            cmd.RentPaymentDueDay,
            cmd.BillingFrequency,
            cmd.ExpectedEndDate,
            cmd.AgreementNotes);

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class RenewTenancyHandler(IApplicationDbContext db)
    : IRequestHandler<RenewTenancyCommand, Unit>
{
    public async Task<Unit> Handle(RenewTenancyCommand cmd, CancellationToken ct)
    {
        var tenancy = await db.Tenancies
            .Include(t => t.Apartment)
            .FirstOrDefaultAsync(t => t.Id == cmd.Id, ct)
            ?? throw new NotFoundException(nameof(Tenancy), cmd.Id);

        if (cmd.NewExpectedEndDate <= tenancy.StartDate)
            throw new ValidationException(nameof(cmd.NewExpectedEndDate), "New expected end date must be after the tenancy start date.");

        tenancy.Renew(cmd.NewExpectedEndDate, cmd.NewRent, cmd.Notes);
        tenancy.Apartment.MarkOccupied(cmd.UpdatedBy ?? "system");

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class TerminateTenancyHandler(IApplicationDbContext db)
    : IRequestHandler<TerminateTenancyCommand, Unit>
{
    public async Task<Unit> Handle(TerminateTenancyCommand cmd, CancellationToken ct)
    {
        var tenancy = await db.Tenancies
            .Include(t => t.Tenants)
            .Include(t => t.Apartment)
            .FirstOrDefaultAsync(t => t.Id == cmd.Id, ct)
            ?? throw new NotFoundException(nameof(Tenancy), cmd.Id);

        var termDate = cmd.ActualEndDate ?? DateTime.UtcNow;
        if (termDate < tenancy.StartDate)
            throw new ValidationException(nameof(cmd.ActualEndDate), "Move-out date cannot precede tenancy start date.");

        tenancy.Terminate(termDate, cmd.Notes);
        tenancy.Apartment.MarkVacant(cmd.UpdatedBy ?? "system");

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
