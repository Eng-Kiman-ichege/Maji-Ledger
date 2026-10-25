using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.Properties;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record PropertyDto(
    Guid Id,
    string Name,
    PropertyType Type,
    string? Address,
    string? Town,
    string? County,
    string? PostalCode,
    string? Description,
    bool IsActive,
    int BuildingCount);

public record BuildingDto(
    Guid Id,
    Guid PropertyId,
    string Name,
    string? Description,
    int? FloorCount,
    int ApartmentCount);

public record ApartmentDto(
    Guid Id,
    Guid BuildingId,
    string UnitNumber,
    string? Floor,
    string? Description,
    bool IsOccupied);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetPropertiesQuery : IRequest<List<PropertyDto>>;

public record GetPropertyQuery(Guid Id) : IRequest<PropertyDto>;

public record GetBuildingsQuery(Guid PropertyId) : IRequest<List<BuildingDto>>;

public record GetApartmentsQuery(Guid BuildingId) : IRequest<List<ApartmentDto>>;

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreatePropertyCommand(
    string Name,
    PropertyType Type = PropertyType.Residential,
    string? Address = null,
    string? County = null,
    string? Town = null,
    string? PostalCode = null,
    string? Description = null,
    string? CreatedBy = null) : IRequest<Guid>;

public record UpdatePropertyCommand(
    Guid Id,
    string Name,
    PropertyType Type,
    string? Address,
    string? County,
    string? Town,
    string? PostalCode,
    string? Description,
    string UpdatedBy) : IRequest<Unit>;

public record CreateBuildingCommand(
    Guid PropertyId,
    string Name,
    int? FloorCount = null,
    string? Description = null,
    string? CreatedBy = null) : IRequest<Guid>;

public record CreateApartmentCommand(
    Guid BuildingId,
    string UnitNumber,
    string? Floor = null,
    string? Description = null,
    string? CreatedBy = null) : IRequest<Guid>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetPropertiesHandler(IApplicationDbContext db)
    : IRequestHandler<GetPropertiesQuery, List<PropertyDto>>
{
    public async Task<List<PropertyDto>> Handle(GetPropertiesQuery request, CancellationToken ct)
        => await db.Properties
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .Select(p => new PropertyDto(
                p.Id,
                p.Name,
                p.Type,
                p.PhysicalAddress,
                p.Town,
                p.County,
                p.PostalCode,
                p.Description,
                p.IsActive,
                p.Buildings.Count(b => !b.IsDeleted)))
            .ToListAsync(ct);
}

public class GetPropertyHandler(IApplicationDbContext db)
    : IRequestHandler<GetPropertyQuery, PropertyDto>
{
    public async Task<PropertyDto> Handle(GetPropertyQuery request, CancellationToken ct)
    {
        var p = await db.Properties
            .Where(x => x.Id == request.Id && x.IsActive)
            .Select(p => new PropertyDto(
                p.Id,
                p.Name,
                p.Type,
                p.PhysicalAddress,
                p.Town,
                p.County,
                p.PostalCode,
                p.Description,
                p.IsActive,
                p.Buildings.Count(b => !b.IsDeleted)))
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException(nameof(Property), request.Id);

        return p;
    }
}

public class GetBuildingsHandler(IApplicationDbContext db)
    : IRequestHandler<GetBuildingsQuery, List<BuildingDto>>
{
    public async Task<List<BuildingDto>> Handle(GetBuildingsQuery request, CancellationToken ct)
        => await db.Buildings
            .Where(b => b.PropertyId == request.PropertyId && !b.IsDeleted)
            .OrderBy(b => b.Name)
            .Select(b => new BuildingDto(
                b.Id,
                b.PropertyId,
                b.Name,
                b.Description,
                b.FloorCount,
                b.Apartments.Count(a => !a.IsDeleted)))
            .ToListAsync(ct);
}

public class GetApartmentsHandler(IApplicationDbContext db)
    : IRequestHandler<GetApartmentsQuery, List<ApartmentDto>>
{
    public async Task<List<ApartmentDto>> Handle(GetApartmentsQuery request, CancellationToken ct)
        => await db.Apartments
            .Where(a => a.BuildingId == request.BuildingId && !a.IsDeleted)
            .OrderBy(a => a.UnitNumber)
            .Select(a => new ApartmentDto(
                a.Id,
                a.BuildingId,
                a.UnitNumber,
                a.Floor,
                a.Description,
                a.Tenancies.Any(t => t.EndDate == null)))
            .ToListAsync(ct);
}

public class CreatePropertyHandler(IApplicationDbContext db)
    : IRequestHandler<CreatePropertyCommand, Guid>
{
    public async Task<Guid> Handle(CreatePropertyCommand cmd, CancellationToken ct)
    {
        var property = Property.Create(
            cmd.Name,
            cmd.Type,
            cmd.Address,
            cmd.County,
            cmd.Town,
            cmd.PostalCode,
            cmd.Description,
            cmd.CreatedBy);

        db.Properties.Add(property);
        await db.SaveChangesAsync(ct);
        return property.Id;
    }
}

public class UpdatePropertyHandler(IApplicationDbContext db)
    : IRequestHandler<UpdatePropertyCommand, Unit>
{
    public async Task<Unit> Handle(UpdatePropertyCommand cmd, CancellationToken ct)
    {
        var property = await db.Properties.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(Property), cmd.Id);

        property.Update(
            cmd.Name,
            cmd.Type,
            cmd.Address,
            cmd.County,
            cmd.Town,
            cmd.PostalCode,
            cmd.Description,
            cmd.UpdatedBy);

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class CreateBuildingHandler(IApplicationDbContext db)
    : IRequestHandler<CreateBuildingCommand, Guid>
{
    public async Task<Guid> Handle(CreateBuildingCommand cmd, CancellationToken ct)
    {
        if (!await db.Properties.AnyAsync(p => p.Id == cmd.PropertyId && p.IsActive, ct))
            throw new NotFoundException(nameof(Property), cmd.PropertyId);

        var building = Building.Create(
            cmd.PropertyId,
            cmd.Name,
            cmd.FloorCount,
            cmd.Description,
            cmd.CreatedBy);

        db.Buildings.Add(building);
        await db.SaveChangesAsync(ct);
        return building.Id;
    }
}

public class CreateApartmentHandler(IApplicationDbContext db)
    : IRequestHandler<CreateApartmentCommand, Guid>
{
    public async Task<Guid> Handle(CreateApartmentCommand cmd, CancellationToken ct)
    {
        if (!await db.Buildings.AnyAsync(b => b.Id == cmd.BuildingId && !b.IsDeleted, ct))
            throw new NotFoundException(nameof(Building), cmd.BuildingId);

        var apartment = Apartment.Create(
            cmd.BuildingId,
            cmd.UnitNumber,
            cmd.Floor,
            cmd.Description,
            cmd.CreatedBy);

        db.Apartments.Add(apartment);
        await db.SaveChangesAsync(ct);
        return apartment.Id;
    }
}
