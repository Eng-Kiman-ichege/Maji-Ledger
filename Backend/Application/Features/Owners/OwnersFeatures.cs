using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.Owners;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record OwnerDto(
    Guid Id,
    string FullName,
    string PhoneNumber,
    string? Email,
    string? NationalId,
    string? KraPin,
    bool IsActive,
    int OwnedPropertiesCount);

public record PropertyOwnershipDto(
    Guid Id,
    Guid OwnerId,
    string OwnerName,
    string OwnerPhone,
    Guid PropertyId,
    string PropertyName,
    OwnershipRole Role,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    bool IsCurrent);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetOwnersQuery : IRequest<List<OwnerDto>>;

public record GetOwnerQuery(Guid Id) : IRequest<OwnerDto>;

public record GetPropertyOwnersQuery(Guid PropertyId) : IRequest<List<PropertyOwnershipDto>>;

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreateOwnerCommand(
    string FullName,
    string PhoneNumber,
    string? Email = null,
    string? NationalId = null,
    string? KraPin = null,
    string? CreatedBy = null) : IRequest<Guid>;

public record AssignPropertyOwnershipCommand(
    Guid OwnerId,
    Guid PropertyId,
    OwnershipRole Role = OwnershipRole.PrimaryOwner,
    string? CreatedBy = null) : IRequest<Guid>;

public record RemovePropertyOwnershipCommand(
    Guid OwnershipId) : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetOwnersHandler(IApplicationDbContext db)
    : IRequestHandler<GetOwnersQuery, List<OwnerDto>>
{
    public async Task<List<OwnerDto>> Handle(GetOwnersQuery request, CancellationToken ct)
        => await db.Owners
            .Where(o => o.IsActive)
            .OrderBy(o => o.FullName)
            .Select(o => new OwnerDto(
                o.Id,
                o.FullName,
                o.PhoneNumber,
                o.Email,
                o.NationalId,
                o.KraPin,
                o.IsActive,
                o.Ownerships.Count(po => po.EffectiveTo == null)))
            .ToListAsync(ct);
}

public class GetOwnerHandler(IApplicationDbContext db)
    : IRequestHandler<GetOwnerQuery, OwnerDto>
{
    public async Task<OwnerDto> Handle(GetOwnerQuery request, CancellationToken ct)
    {
        var owner = await db.Owners
            .Where(o => o.Id == request.Id && o.IsActive)
            .Select(o => new OwnerDto(
                o.Id,
                o.FullName,
                o.PhoneNumber,
                o.Email,
                o.NationalId,
                o.KraPin,
                o.IsActive,
                o.Ownerships.Count(po => po.EffectiveTo == null)))
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException(nameof(Owner), request.Id);

        return owner;
    }
}

public class GetPropertyOwnersHandler(IApplicationDbContext db)
    : IRequestHandler<GetPropertyOwnersQuery, List<PropertyOwnershipDto>>
{
    public async Task<List<PropertyOwnershipDto>> Handle(GetPropertyOwnersQuery request, CancellationToken ct)
        => await db.PropertyOwnerships
            .Where(po => po.PropertyId == request.PropertyId)
            .Include(po => po.Owner)
            .Include(po => po.Property)
            .OrderByDescending(po => po.EffectiveFrom)
            .Select(po => new PropertyOwnershipDto(
                po.Id,
                po.OwnerId,
                po.Owner.FullName,
                po.Owner.PhoneNumber,
                po.PropertyId,
                po.Property.Name,
                po.Role,
                po.EffectiveFrom,
                po.EffectiveTo,
                po.EffectiveTo == null))
            .ToListAsync(ct);
}

public class CreateOwnerHandler(IApplicationDbContext db)
    : IRequestHandler<CreateOwnerCommand, Guid>
{
    public async Task<Guid> Handle(CreateOwnerCommand cmd, CancellationToken ct)
    {
        if (await db.Owners.AnyAsync(o => o.PhoneNumber == cmd.PhoneNumber && o.IsActive, ct))
            throw new ConflictException($"An owner with phone number '{cmd.PhoneNumber}' already exists.");

        var owner = Owner.Create(cmd.FullName, cmd.PhoneNumber, cmd.Email, cmd.NationalId, cmd.KraPin, cmd.CreatedBy);
        db.Owners.Add(owner);
        await db.SaveChangesAsync(ct);
        return owner.Id;
    }
}

public class AssignPropertyOwnershipHandler(IApplicationDbContext db)
    : IRequestHandler<AssignPropertyOwnershipCommand, Guid>
{
    public async Task<Guid> Handle(AssignPropertyOwnershipCommand cmd, CancellationToken ct)
    {
        if (!await db.Owners.AnyAsync(o => o.Id == cmd.OwnerId && o.IsActive, ct))
            throw new NotFoundException(nameof(Owner), cmd.OwnerId);

        if (!await db.Properties.AnyAsync(p => p.Id == cmd.PropertyId && p.IsActive, ct))
            throw new NotFoundException(nameof(Property), cmd.PropertyId);

        var existing = await db.PropertyOwnerships
            .FirstOrDefaultAsync(po => po.OwnerId == cmd.OwnerId && po.PropertyId == cmd.PropertyId && po.EffectiveTo == null, ct);

        if (existing is not null)
            throw new ConflictException("This owner is already currently assigned to this property.");

        var ownership = PropertyOwnership.Create(cmd.OwnerId, cmd.PropertyId, cmd.Role, cmd.CreatedBy);
        db.PropertyOwnerships.Add(ownership);
        await db.SaveChangesAsync(ct);
        return ownership.Id;
    }
}

public class RemovePropertyOwnershipHandler(IApplicationDbContext db)
    : IRequestHandler<RemovePropertyOwnershipCommand, Unit>
{
    public async Task<Unit> Handle(RemovePropertyOwnershipCommand cmd, CancellationToken ct)
    {
        var ownership = await db.PropertyOwnerships.FindAsync([cmd.OwnershipId], ct)
            ?? throw new NotFoundException(nameof(PropertyOwnership), cmd.OwnershipId);

        ownership.Close();
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
