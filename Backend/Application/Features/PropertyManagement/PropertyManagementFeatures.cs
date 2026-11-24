using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.PropertyManagement;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record PropertySummaryDto(
    Guid Id,
    string Name,
    string? PropertyCode,
    PropertyType Type,
    string? PhysicalAddress,
    string? County,
    string? Town,
    string? PostalCode,
    string? Description,
    bool IsActive,
    int BuildingCount,
    int TotalUnits,
    int OccupiedUnits,
    int VacantUnits,
    decimal TotalExpectedRent,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record PropertyDetailDto(
    Guid Id,
    string Name,
    string? PropertyCode,
    PropertyType Type,
    string? PhysicalAddress,
    string? County,
    string? Town,
    string? PostalCode,
    string? Description,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    List<BuildingSummaryDto> Buildings,
    List<LandlordAssignmentDto> Landlords);

public record BuildingSummaryDto(
    Guid Id,
    Guid PropertyId,
    string Name,
    string? BuildingCode,
    int? FloorCount,
    string? Description,
    bool IsActive,
    int UnitCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record UnitDetailDto(
    Guid Id,
    Guid PropertyId,
    Guid BuildingId,
    string BuildingName,
    Guid? UnitTypeId,
    string? UnitTypeName,
    string UnitNumber,
    string? Floor,
    string? Description,
    decimal MonthlyRent,
    bool IsOccupied,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetPropertiesManagementQuery : IRequest<List<PropertySummaryDto>>;

public record GetPropertyManagementByIdQuery(Guid Id) : IRequest<PropertyDetailDto>;

public record GetBuildingsManagementQuery(Guid PropertyId) : IRequest<List<BuildingSummaryDto>>;

public record GetBuildingManagementByIdQuery(Guid Id) : IRequest<BuildingSummaryDto>;

public record GetUnitsManagementQuery(Guid? PropertyId = null, Guid? BuildingId = null) : IRequest<List<UnitDetailDto>>;

public record GetUnitManagementByIdQuery(Guid Id) : IRequest<UnitDetailDto>;

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreatePropertyManagementCommand(
    string Name,
    string? PropertyCode = null,
    PropertyType Type = PropertyType.Residential,
    string? PhysicalAddress = null,
    string? County = null,
    string? Town = null,
    string? PostalCode = null,
    string? Description = null,
    Guid? AssignedLandlordId = null,
    string? CreatedBy = null) : IRequest<Guid>;

public record UpdatePropertyManagementCommand(
    Guid Id,
    string Name,
    string? PropertyCode,
    PropertyType Type,
    string? PhysicalAddress,
    string? County,
    string? Town,
    string? PostalCode,
    string? Description,
    string? UpdatedBy = null) : IRequest<Unit>;

public record ActivatePropertyManagementCommand(Guid Id, string? UpdatedBy = null) : IRequest<Unit>;

public record DeactivatePropertyManagementCommand(Guid Id, string? UpdatedBy = null) : IRequest<Unit>;

public record CreateBuildingManagementCommand(
    Guid PropertyId,
    string Name,
    string? BuildingCode = null,
    int? FloorCount = null,
    string? Description = null,
    string? CreatedBy = null) : IRequest<Guid>;

public record UpdateBuildingManagementCommand(
    Guid Id,
    string Name,
    string? BuildingCode,
    int? FloorCount,
    string? Description,
    string? UpdatedBy = null) : IRequest<Unit>;

public record ActivateBuildingManagementCommand(Guid Id, string? UpdatedBy = null) : IRequest<Unit>;

public record DeactivateBuildingManagementCommand(Guid Id, string? UpdatedBy = null) : IRequest<Unit>;

public record CreateUnitManagementCommand(
    Guid PropertyId,
    Guid BuildingId,
    string UnitNumber,
    Guid? UnitTypeId = null,
    string? Floor = null,
    string? Description = null,
    decimal MonthlyRent = 0m,
    string? CreatedBy = null) : IRequest<Guid>;

public record UpdateUnitManagementCommand(
    Guid Id,
    string UnitNumber,
    Guid? UnitTypeId,
    string? Floor,
    string? Description,
    decimal MonthlyRent,
    string? UpdatedBy = null) : IRequest<Unit>;

public record SetUnitRentCommand(
    Guid Id,
    decimal MonthlyRent,
    string? UpdatedBy = null) : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetPropertiesManagementHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetPropertiesManagementQuery, List<PropertySummaryDto>>
{
    public async Task<List<PropertySummaryDto>> Handle(GetPropertiesManagementQuery request, CancellationToken ct)
    {
        var query = db.Properties.AsQueryable();

        // Landlord data isolation: if caller is an Owner/Landlord, restrict to assigned properties
        if (currentUser.OwnerId.HasValue && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("PlatformAdmin"))
        {
            var assignedPropertyIds = await db.PropertyOwnerships
                .Where(po => po.OwnerId == currentUser.OwnerId.Value && po.EffectiveTo == null)
                .Select(po => po.PropertyId)
                .ToListAsync(ct);

            query = query.Where(p => assignedPropertyIds.Contains(p.Id));
        }

        var properties = await query
            .OrderBy(p => p.Name)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.PropertyCode,
                p.Type,
                p.PhysicalAddress,
                p.County,
                p.Town,
                p.PostalCode,
                p.Description,
                p.IsActive,
                p.CreatedAt,
                p.UpdatedAt,
                BuildingCount = p.Buildings.Count(b => !b.IsDeleted),
                Apartments = p.Buildings
                    .Where(b => !b.IsDeleted)
                    .SelectMany(b => b.Apartments.Where(a => !a.IsDeleted))
                    .Select(a => new { a.IsOccupied, a.MonthlyRent })
                    .ToList()
            })
            .ToListAsync(ct);

        return properties.Select(p => new PropertySummaryDto(
            p.Id,
            p.Name,
            p.PropertyCode,
            p.Type,
            p.PhysicalAddress,
            p.County,
            p.Town,
            p.PostalCode,
            p.Description,
            p.IsActive,
            p.BuildingCount,
            p.Apartments.Count,
            p.Apartments.Count(a => a.IsOccupied),
            p.Apartments.Count(a => !a.IsOccupied),
            p.Apartments.Sum(a => a.MonthlyRent),
            p.CreatedAt,
            p.UpdatedAt)).ToList();
    }
}

public class GetPropertyManagementByIdHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetPropertyManagementByIdQuery, PropertyDetailDto>
{
    public async Task<PropertyDetailDto> Handle(GetPropertyManagementByIdQuery request, CancellationToken ct)
    {
        // Enforce landlord authorization
        if (currentUser.OwnerId.HasValue && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("PlatformAdmin"))
        {
            var hasAccess = await db.PropertyOwnerships
                .AnyAsync(po => po.PropertyId == request.Id && po.OwnerId == currentUser.OwnerId.Value && po.EffectiveTo == null, ct);
            if (!hasAccess)
                throw new ForbiddenException("You are not authorized to access this property.");
        }

        var property = await db.Properties
            .Include(p => p.Buildings.Where(b => !b.IsDeleted))
                .ThenInclude(b => b.Apartments.Where(a => !a.IsDeleted))
            .Include(p => p.Ownerships.Where(po => po.EffectiveTo == null))
                .ThenInclude(po => po.Owner)
            .FirstOrDefaultAsync(p => p.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(Property), request.Id);

        var buildings = property.Buildings
            .Select(b => new BuildingSummaryDto(
                b.Id,
                b.PropertyId,
                b.Name,
                b.BuildingCode,
                b.FloorCount,
                b.Description,
                b.IsActive,
                b.Apartments.Count(a => !a.IsDeleted),
                b.CreatedAt,
                b.UpdatedAt))
            .ToList();

        var landlords = property.Ownerships
            .Select(po => new LandlordAssignmentDto(
                po.Id,
                po.PropertyId,
                property.Name,
                property.PropertyCode,
                po.Role,
                po.Role == OwnershipRole.PrimaryOwner,
                po.EffectiveFrom,
                po.EffectiveTo,
                po.EffectiveTo == null))
            .ToList();

        return new PropertyDetailDto(
            property.Id,
            property.Name,
            property.PropertyCode,
            property.Type,
            property.PhysicalAddress,
            property.County,
            property.Town,
            property.PostalCode,
            property.Description,
            property.IsActive,
            property.CreatedAt,
            property.UpdatedAt,
            buildings,
            landlords);
    }
}

public class CreatePropertyManagementHandler(IApplicationDbContext db)
    : IRequestHandler<CreatePropertyManagementCommand, Guid>
{
    public async Task<Guid> Handle(CreatePropertyManagementCommand cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.Name))
            throw new ValidationException(nameof(cmd.Name), "Property name is required.");

        var trimmedCode = string.IsNullOrWhiteSpace(cmd.PropertyCode) ? null : cmd.PropertyCode.Trim();
        if (trimmedCode is not null)
        {
            if (await db.Properties.AnyAsync(p => p.PropertyCode == trimmedCode, ct))
                throw new ConflictException($"Property code '{trimmedCode}' is already in use.");
        }

        if (cmd.AssignedLandlordId.HasValue)
        {
            var landlord = await db.Owners.FindAsync([cmd.AssignedLandlordId.Value], ct)
                ?? throw new NotFoundException(nameof(Owner), cmd.AssignedLandlordId.Value);

            if (!landlord.IsActive)
                throw new ValidationException(nameof(cmd.AssignedLandlordId), "Assigned landlord is inactive.");
        }

        var property = Property.Create(
            cmd.Name.Trim(),
            cmd.Type,
            cmd.PhysicalAddress,
            cmd.County,
            cmd.Town,
            cmd.PostalCode,
            cmd.Description,
            trimmedCode,
            cmd.CreatedBy);

        db.Properties.Add(property);

        if (cmd.AssignedLandlordId.HasValue)
        {
            var assignment = PropertyOwnership.Create(
                cmd.AssignedLandlordId.Value,
                property.Id,
                OwnershipRole.PrimaryOwner,
                cmd.CreatedBy);
            db.PropertyOwnerships.Add(assignment);
        }

        await db.SaveChangesAsync(ct);
        return property.Id;
    }
}

public class UpdatePropertyManagementHandler(IApplicationDbContext db)
    : IRequestHandler<UpdatePropertyManagementCommand, Unit>
{
    public async Task<Unit> Handle(UpdatePropertyManagementCommand cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.Name))
            throw new ValidationException(nameof(cmd.Name), "Property name is required.");

        var property = await db.Properties.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(Property), cmd.Id);

        var trimmedCode = string.IsNullOrWhiteSpace(cmd.PropertyCode) ? null : cmd.PropertyCode.Trim();
        if (trimmedCode is not null)
        {
            if (await db.Properties.AnyAsync(p => p.PropertyCode == trimmedCode && p.Id != cmd.Id, ct))
                throw new ConflictException($"Property code '{trimmedCode}' is already in use by another property.");
        }

        property.Update(
            cmd.Name.Trim(),
            cmd.Type,
            cmd.PhysicalAddress,
            cmd.County,
            cmd.Town,
            cmd.PostalCode,
            cmd.Description,
            cmd.UpdatedBy ?? "system");

        if (trimmedCode != property.PropertyCode)
        {
            property.SetPropertyCode(trimmedCode!, cmd.UpdatedBy ?? "system");
        }

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class ActivatePropertyManagementHandler(IApplicationDbContext db)
    : IRequestHandler<ActivatePropertyManagementCommand, Unit>
{
    public async Task<Unit> Handle(ActivatePropertyManagementCommand cmd, CancellationToken ct)
    {
        var property = await db.Properties.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(Property), cmd.Id);

        property.Activate(cmd.UpdatedBy ?? "system");
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class DeactivatePropertyManagementHandler(IApplicationDbContext db)
    : IRequestHandler<DeactivatePropertyManagementCommand, Unit>
{
    public async Task<Unit> Handle(DeactivatePropertyManagementCommand cmd, CancellationToken ct)
    {
        var property = await db.Properties.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(Property), cmd.Id);

        property.Deactivate(cmd.UpdatedBy ?? "system");
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class GetBuildingsManagementHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetBuildingsManagementQuery, List<BuildingSummaryDto>>
{
    public async Task<List<BuildingSummaryDto>> Handle(GetBuildingsManagementQuery request, CancellationToken ct)
    {
        if (currentUser.OwnerId.HasValue && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("PlatformAdmin"))
        {
            var hasAccess = await db.PropertyOwnerships
                .AnyAsync(po => po.PropertyId == request.PropertyId && po.OwnerId == currentUser.OwnerId.Value && po.EffectiveTo == null, ct);
            if (!hasAccess)
                throw new ForbiddenException("You are not authorized to access this property's buildings.");
        }

        return await db.Buildings
            .Where(b => b.PropertyId == request.PropertyId && !b.IsDeleted)
            .OrderBy(b => b.Name)
            .Select(b => new BuildingSummaryDto(
                b.Id,
                b.PropertyId,
                b.Name,
                b.BuildingCode,
                b.FloorCount,
                b.Description,
                b.IsActive,
                b.Apartments.Count(a => !a.IsDeleted),
                b.CreatedAt,
                b.UpdatedAt))
            .ToListAsync(ct);
    }
}

public class GetBuildingManagementByIdHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetBuildingManagementByIdQuery, BuildingSummaryDto>
{
    public async Task<BuildingSummaryDto> Handle(GetBuildingManagementByIdQuery request, CancellationToken ct)
    {
        var building = await db.Buildings
            .Where(b => b.Id == request.Id && !b.IsDeleted)
            .Select(b => new BuildingSummaryDto(
                b.Id,
                b.PropertyId,
                b.Name,
                b.BuildingCode,
                b.FloorCount,
                b.Description,
                b.IsActive,
                b.Apartments.Count(a => !a.IsDeleted),
                b.CreatedAt,
                b.UpdatedAt))
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException(nameof(Building), request.Id);

        if (currentUser.OwnerId.HasValue && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("PlatformAdmin"))
        {
            var hasAccess = await db.PropertyOwnerships
                .AnyAsync(po => po.PropertyId == building.PropertyId && po.OwnerId == currentUser.OwnerId.Value && po.EffectiveTo == null, ct);
            if (!hasAccess)
                throw new ForbiddenException("You are not authorized to access this building.");
        }

        return building;
    }
}

public class CreateBuildingManagementHandler(IApplicationDbContext db)
    : IRequestHandler<CreateBuildingManagementCommand, Guid>
{
    public async Task<Guid> Handle(CreateBuildingManagementCommand cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.Name))
            throw new ValidationException(nameof(cmd.Name), "Building name is required.");

        var property = await db.Properties.FindAsync([cmd.PropertyId], ct)
            ?? throw new NotFoundException(nameof(Property), cmd.PropertyId);

        var trimmedCode = string.IsNullOrWhiteSpace(cmd.BuildingCode) ? null : cmd.BuildingCode.Trim();
        if (trimmedCode is not null)
        {
            if (await db.Buildings.AnyAsync(b => b.PropertyId == cmd.PropertyId && b.BuildingCode == trimmedCode && !b.IsDeleted, ct))
                throw new ConflictException($"Building code '{trimmedCode}' is already in use within property '{property.Name}'.");
        }

        if (await db.Buildings.AnyAsync(b => b.PropertyId == cmd.PropertyId && b.Name == cmd.Name.Trim() && !b.IsDeleted, ct))
            throw new ConflictException($"A building named '{cmd.Name.Trim()}' already exists in property '{property.Name}'.");

        var building = Building.Create(
            cmd.PropertyId,
            cmd.Name.Trim(),
            cmd.FloorCount,
            cmd.Description,
            cmd.CreatedBy,
            trimmedCode);

        db.Buildings.Add(building);
        await db.SaveChangesAsync(ct);
        return building.Id;
    }
}

public class UpdateBuildingManagementHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateBuildingManagementCommand, Unit>
{
    public async Task<Unit> Handle(UpdateBuildingManagementCommand cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.Name))
            throw new ValidationException(nameof(cmd.Name), "Building name is required.");

        var building = await db.Buildings.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(Building), cmd.Id);

        var trimmedCode = string.IsNullOrWhiteSpace(cmd.BuildingCode) ? null : cmd.BuildingCode.Trim();
        if (trimmedCode is not null)
        {
            if (await db.Buildings.AnyAsync(b => b.PropertyId == building.PropertyId && b.BuildingCode == trimmedCode && b.Id != cmd.Id && !b.IsDeleted, ct))
                throw new ConflictException($"Building code '{trimmedCode}' is already in use by another building in this property.");
        }

        building.Update(cmd.Name.Trim(), cmd.FloorCount, cmd.Description, cmd.UpdatedBy ?? "system", trimmedCode);
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class ActivateBuildingManagementHandler(IApplicationDbContext db)
    : IRequestHandler<ActivateBuildingManagementCommand, Unit>
{
    public async Task<Unit> Handle(ActivateBuildingManagementCommand cmd, CancellationToken ct)
    {
        var building = await db.Buildings.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(Building), cmd.Id);

        building.Activate(cmd.UpdatedBy ?? "system");
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class DeactivateBuildingManagementHandler(IApplicationDbContext db)
    : IRequestHandler<DeactivateBuildingManagementCommand, Unit>
{
    public async Task<Unit> Handle(DeactivateBuildingManagementCommand cmd, CancellationToken ct)
    {
        var building = await db.Buildings.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(Building), cmd.Id);

        building.Deactivate(cmd.UpdatedBy ?? "system");
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class GetUnitsManagementHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetUnitsManagementQuery, List<UnitDetailDto>>
{
    public async Task<List<UnitDetailDto>> Handle(GetUnitsManagementQuery request, CancellationToken ct)
    {
        var query = db.Apartments
            .Include(a => a.Building)
            .Include(a => a.UnitType)
            .Where(a => !a.IsDeleted)
            .AsQueryable();

        if (request.PropertyId.HasValue)
            query = query.Where(a => a.Building.PropertyId == request.PropertyId.Value);

        if (request.BuildingId.HasValue)
            query = query.Where(a => a.BuildingId == request.BuildingId.Value);

        // Landlord authorization filter
        if (currentUser.OwnerId.HasValue && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("PlatformAdmin"))
        {
            var assignedProperties = await db.PropertyOwnerships
                .Where(po => po.OwnerId == currentUser.OwnerId.Value && po.EffectiveTo == null)
                .Select(po => po.PropertyId)
                .ToListAsync(ct);

            query = query.Where(a => assignedProperties.Contains(a.Building.PropertyId));
        }

        return await query
            .OrderBy(a => a.Building.Name)
            .ThenBy(a => a.UnitNumber)
            .Select(a => new UnitDetailDto(
                a.Id,
                a.Building.PropertyId,
                a.BuildingId,
                a.Building.Name,
                a.UnitTypeId,
                a.UnitType != null ? a.UnitType.Name : null,
                a.UnitNumber,
                a.Floor,
                a.Description,
                a.MonthlyRent,
                a.IsOccupied,
                !a.IsDeleted,
                a.CreatedAt,
                a.UpdatedAt))
            .ToListAsync(ct);
    }
}

public class GetUnitManagementByIdHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetUnitManagementByIdQuery, UnitDetailDto>
{
    public async Task<UnitDetailDto> Handle(GetUnitManagementByIdQuery request, CancellationToken ct)
    {
        var unit = await db.Apartments
            .Include(a => a.Building)
            .Include(a => a.UnitType)
            .Where(a => a.Id == request.Id && !a.IsDeleted)
            .Select(a => new UnitDetailDto(
                a.Id,
                a.Building.PropertyId,
                a.BuildingId,
                a.Building.Name,
                a.UnitTypeId,
                a.UnitType != null ? a.UnitType.Name : null,
                a.UnitNumber,
                a.Floor,
                a.Description,
                a.MonthlyRent,
                a.IsOccupied,
                !a.IsDeleted,
                a.CreatedAt,
                a.UpdatedAt))
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException(nameof(Apartment), request.Id);

        if (currentUser.OwnerId.HasValue && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("PlatformAdmin"))
        {
            var hasAccess = await db.PropertyOwnerships
                .AnyAsync(po => po.PropertyId == unit.PropertyId && po.OwnerId == currentUser.OwnerId.Value && po.EffectiveTo == null, ct);
            if (!hasAccess)
                throw new ForbiddenException("You are not authorized to access this unit.");
        }

        return unit;
    }
}

public class CreateUnitManagementHandler(IApplicationDbContext db)
    : IRequestHandler<CreateUnitManagementCommand, Guid>
{
    public async Task<Guid> Handle(CreateUnitManagementCommand cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.UnitNumber))
            throw new ValidationException(nameof(cmd.UnitNumber), "Unit number is required.");

        if (cmd.MonthlyRent < 0)
            throw new ValidationException(nameof(cmd.MonthlyRent), "Monthly rent cannot be negative.");

        var building = await db.Buildings.FindAsync([cmd.BuildingId], ct)
            ?? throw new NotFoundException(nameof(Building), cmd.BuildingId);

        if (building.PropertyId != cmd.PropertyId)
            throw new ValidationException(nameof(cmd.BuildingId), "The specified building does not belong to the given property.");

        if (cmd.UnitTypeId.HasValue)
        {
            var unitType = await db.UnitTypes.FindAsync([cmd.UnitTypeId.Value], ct)
                ?? throw new NotFoundException(nameof(UnitType), cmd.UnitTypeId.Value);

            if (!unitType.IsActive)
                throw new ValidationException(nameof(cmd.UnitTypeId), "Cannot assign an inactive unit type.");
        }

        var trimmedNumber = cmd.UnitNumber.Trim();
        if (await db.Apartments.AnyAsync(a => a.BuildingId == cmd.BuildingId && a.UnitNumber == trimmedNumber && !a.IsDeleted, ct))
            throw new ConflictException($"Unit number '{trimmedNumber}' already exists in building '{building.Name}'.");

        var apartment = Apartment.Create(
            cmd.BuildingId,
            trimmedNumber,
            cmd.Floor,
            cmd.Description,
            cmd.CreatedBy,
            cmd.PropertyId,
            cmd.UnitTypeId,
            cmd.MonthlyRent);

        db.Apartments.Add(apartment);
        await db.SaveChangesAsync(ct);
        return apartment.Id;
    }
}

public class UpdateUnitManagementHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateUnitManagementCommand, Unit>
{
    public async Task<Unit> Handle(UpdateUnitManagementCommand cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.UnitNumber))
            throw new ValidationException(nameof(cmd.UnitNumber), "Unit number is required.");

        if (cmd.MonthlyRent < 0)
            throw new ValidationException(nameof(cmd.MonthlyRent), "Monthly rent cannot be negative.");

        var unit = await db.Apartments.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(Apartment), cmd.Id);

        if (cmd.UnitTypeId.HasValue)
        {
            var unitType = await db.UnitTypes.FindAsync([cmd.UnitTypeId.Value], ct)
                ?? throw new NotFoundException(nameof(UnitType), cmd.UnitTypeId.Value);

            if (!unitType.IsActive)
                throw new ValidationException(nameof(cmd.UnitTypeId), "Cannot assign an inactive unit type.");
        }

        var trimmedNumber = cmd.UnitNumber.Trim();
        if (await db.Apartments.AnyAsync(a => a.BuildingId == unit.BuildingId && a.UnitNumber == trimmedNumber && a.Id != cmd.Id && !a.IsDeleted, ct))
            throw new ConflictException($"Unit number '{trimmedNumber}' already exists in this building.");

        unit.Update(
            trimmedNumber,
            cmd.Floor,
            cmd.Description,
            cmd.UnitTypeId,
            cmd.MonthlyRent,
            cmd.UpdatedBy ?? "system");

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class SetUnitRentHandler(IApplicationDbContext db)
    : IRequestHandler<SetUnitRentCommand, Unit>
{
    public async Task<Unit> Handle(SetUnitRentCommand cmd, CancellationToken ct)
    {
        if (cmd.MonthlyRent < 0)
            throw new ValidationException(nameof(cmd.MonthlyRent), "Monthly rent cannot be negative.");

        var unit = await db.Apartments.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(Apartment), cmd.Id);

        unit.SetRent(cmd.MonthlyRent, cmd.UpdatedBy ?? "system");
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
