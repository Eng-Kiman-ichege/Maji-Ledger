using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.PropertyManagement;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record UnitTypeDto(
    Guid Id,
    string Name,
    string? Description,
    bool IsActive,
    int SortOrder,
    int UnitCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetUnitTypesQuery(bool IncludeInactive = false) : IRequest<List<UnitTypeDto>>;

public record GetUnitTypeByIdQuery(Guid Id) : IRequest<UnitTypeDto>;

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreateUnitTypeCommand(
    string Name,
    string? Description = null,
    int SortOrder = 0) : IRequest<Guid>;

public record UpdateUnitTypeCommand(
    Guid Id,
    string Name,
    string? Description = null,
    int SortOrder = 0) : IRequest<Unit>;

public record ActivateUnitTypeCommand(Guid Id) : IRequest<Unit>;

public record DeactivateUnitTypeCommand(Guid Id) : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetUnitTypesHandler(IApplicationDbContext db)
    : IRequestHandler<GetUnitTypesQuery, List<UnitTypeDto>>
{
    public async Task<List<UnitTypeDto>> Handle(GetUnitTypesQuery request, CancellationToken ct)
    {
        var query = db.UnitTypes.AsQueryable();
        if (!request.IncludeInactive)
            query = query.Where(u => u.IsActive);

        return await query
            .OrderBy(u => u.SortOrder)
            .ThenBy(u => u.Name)
            .Select(u => new UnitTypeDto(
                u.Id,
                u.Name,
                u.Description,
                u.IsActive,
                u.SortOrder,
                u.Apartments.Count(a => !a.IsDeleted),
                u.CreatedAt,
                u.UpdatedAt))
            .ToListAsync(ct);
    }
}

public class GetUnitTypeByIdHandler(IApplicationDbContext db)
    : IRequestHandler<GetUnitTypeByIdQuery, UnitTypeDto>
{
    public async Task<UnitTypeDto> Handle(GetUnitTypeByIdQuery request, CancellationToken ct)
    {
        var u = await db.UnitTypes
            .Where(x => x.Id == request.Id)
            .Select(x => new UnitTypeDto(
                x.Id,
                x.Name,
                x.Description,
                x.IsActive,
                x.SortOrder,
                x.Apartments.Count(a => !a.IsDeleted),
                x.CreatedAt,
                x.UpdatedAt))
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException(nameof(UnitType), request.Id);

        return u;
    }
}

public class CreateUnitTypeHandler(IApplicationDbContext db)
    : IRequestHandler<CreateUnitTypeCommand, Guid>
{
    public async Task<Guid> Handle(CreateUnitTypeCommand cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.Name))
            throw new ValidationException(nameof(cmd.Name), "Unit type name is required.");

        var trimmedName = cmd.Name.Trim();
        if (await db.UnitTypes.AnyAsync(u => u.Name == trimmedName, ct))
            throw new ConflictException($"Unit type '{trimmedName}' already exists.");

        var unitType = UnitType.Create(trimmedName, cmd.Description, cmd.SortOrder);
        db.UnitTypes.Add(unitType);
        await db.SaveChangesAsync(ct);
        return unitType.Id;
    }
}

public class UpdateUnitTypeHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateUnitTypeCommand, Unit>
{
    public async Task<Unit> Handle(UpdateUnitTypeCommand cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.Name))
            throw new ValidationException(nameof(cmd.Name), "Unit type name is required.");

        var unitType = await db.UnitTypes.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(UnitType), cmd.Id);

        var trimmedName = cmd.Name.Trim();
        if (await db.UnitTypes.AnyAsync(u => u.Name == trimmedName && u.Id != cmd.Id, ct))
            throw new ConflictException($"Another unit type named '{trimmedName}' already exists.");

        unitType.Update(trimmedName, cmd.Description, cmd.SortOrder);
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class ActivateUnitTypeHandler(IApplicationDbContext db)
    : IRequestHandler<ActivateUnitTypeCommand, Unit>
{
    public async Task<Unit> Handle(ActivateUnitTypeCommand cmd, CancellationToken ct)
    {
        var unitType = await db.UnitTypes.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(UnitType), cmd.Id);

        unitType.Activate();
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class DeactivateUnitTypeHandler(IApplicationDbContext db)
    : IRequestHandler<DeactivateUnitTypeCommand, Unit>
{
    public async Task<Unit> Handle(DeactivateUnitTypeCommand cmd, CancellationToken ct)
    {
        var unitType = await db.UnitTypes.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(UnitType), cmd.Id);

        unitType.Deactivate();
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
