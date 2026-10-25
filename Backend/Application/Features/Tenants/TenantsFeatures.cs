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
    string FullName,
    string PhoneNumber,
    string? Email,
    string? NationalId,
    bool IsActive,
    int ActiveTenanciesCount);

public record TenancyDto(
    Guid Id,
    Guid TenantId,
    string TenantName,
    string TenantPhone,
    Guid ApartmentId,
    string UnitNumber,
    TenancyStatus Status,
    DateTime StartDate,
    DateTime? EndDate,
    string? Notes);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetTenantsQuery : IRequest<List<TenantDto>>;

public record GetTenantQuery(Guid Id) : IRequest<TenantDto>;

public record GetApartmentTenanciesQuery(Guid ApartmentId) : IRequest<List<TenancyDto>>;

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreateTenantCommand(
    string FullName,
    string PhoneNumber,
    string? Email = null,
    string? NationalId = null,
    string? CreatedBy = null) : IRequest<Guid>;

public record CreateTenancyCommand(
    Guid TenantId,
    Guid ApartmentId,
    DateTime? StartDate = null,
    string? CreatedBy = null) : IRequest<Guid>;

public record EndTenancyCommand(
    Guid TenancyId,
    string? Notes = null) : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetTenantsHandler(IApplicationDbContext db)
    : IRequestHandler<GetTenantsQuery, List<TenantDto>>
{
    public async Task<List<TenantDto>> Handle(GetTenantsQuery request, CancellationToken ct)
        => await db.Tenants
            .Where(t => t.IsActive)
            .OrderBy(t => t.FullName)
            .Select(t => new TenantDto(
                t.Id,
                t.FullName,
                t.PhoneNumber,
                t.Email,
                t.NationalId,
                t.IsActive,
                t.Tenancies.Count(ten => ten.Status == TenancyStatus.Active)))
            .ToListAsync(ct);
}

public class GetTenantHandler(IApplicationDbContext db)
    : IRequestHandler<GetTenantQuery, TenantDto>
{
    public async Task<TenantDto> Handle(GetTenantQuery request, CancellationToken ct)
    {
        var tenant = await db.Tenants
            .Where(t => t.Id == request.Id && t.IsActive)
            .Select(t => new TenantDto(
                t.Id,
                t.FullName,
                t.PhoneNumber,
                t.Email,
                t.NationalId,
                t.IsActive,
                t.Tenancies.Count(ten => ten.Status == TenancyStatus.Active)))
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException(nameof(Tenant), request.Id);

        return tenant;
    }
}

public class GetApartmentTenanciesHandler(IApplicationDbContext db)
    : IRequestHandler<GetApartmentTenanciesQuery, List<TenancyDto>>
{
    public async Task<List<TenancyDto>> Handle(GetApartmentTenanciesQuery request, CancellationToken ct)
        => await db.Tenancies
            .Where(t => t.ApartmentId == request.ApartmentId)
            .Include(t => t.Tenant)
            .Include(t => t.Apartment)
            .OrderByDescending(t => t.StartDate)
            .Select(t => new TenancyDto(
                t.Id,
                t.TenantId,
                t.Tenant.FullName,
                t.Tenant.PhoneNumber,
                t.ApartmentId,
                t.Apartment.UnitNumber,
                t.Status,
                t.StartDate,
                t.EndDate,
                t.Notes))
            .ToListAsync(ct);
}

public class CreateTenantHandler(IApplicationDbContext db)
    : IRequestHandler<CreateTenantCommand, Guid>
{
    public async Task<Guid> Handle(CreateTenantCommand cmd, CancellationToken ct)
    {
        if (await db.Tenants.AnyAsync(t => t.PhoneNumber == cmd.PhoneNumber && t.IsActive, ct))
            throw new ConflictException($"A tenant with phone number '{cmd.PhoneNumber}' already exists.");

        var tenant = Tenant.Create(cmd.FullName, cmd.PhoneNumber, cmd.Email, cmd.NationalId, cmd.CreatedBy);
        db.Tenants.Add(tenant);
        await db.SaveChangesAsync(ct);
        return tenant.Id;
    }
}

public class CreateTenancyHandler(IApplicationDbContext db)
    : IRequestHandler<CreateTenancyCommand, Guid>
{
    public async Task<Guid> Handle(CreateTenancyCommand cmd, CancellationToken ct)
    {
        if (!await db.Tenants.AnyAsync(t => t.Id == cmd.TenantId && t.IsActive, ct))
            throw new NotFoundException(nameof(Tenant), cmd.TenantId);

        if (!await db.Apartments.AnyAsync(a => a.Id == cmd.ApartmentId && !a.IsDeleted, ct))
            throw new NotFoundException(nameof(Apartment), cmd.ApartmentId);

        // Close any active tenancy for this apartment if replacing
        var existingActive = await db.Tenancies
            .FirstOrDefaultAsync(t => t.ApartmentId == cmd.ApartmentId && t.Status == TenancyStatus.Active, ct);
        if (existingActive is not null)
            existingActive.End("Ended by assignment of new tenant.");

        var tenancy = Tenancy.Create(cmd.TenantId, cmd.ApartmentId, cmd.StartDate, cmd.CreatedBy);
        db.Tenancies.Add(tenancy);
        await db.SaveChangesAsync(ct);
        return tenancy.Id;
    }
}

public class EndTenancyHandler(IApplicationDbContext db)
    : IRequestHandler<EndTenancyCommand, Unit>
{
    public async Task<Unit> Handle(EndTenancyCommand cmd, CancellationToken ct)
    {
        var tenancy = await db.Tenancies.FindAsync([cmd.TenancyId], ct)
            ?? throw new NotFoundException(nameof(Tenancy), cmd.TenancyId);

        tenancy.End(cmd.Notes);
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
