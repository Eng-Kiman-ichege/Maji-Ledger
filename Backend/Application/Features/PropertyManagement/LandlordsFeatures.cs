using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.PropertyManagement;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record LandlordDto(
    Guid Id,
    string FullName,
    string PhoneNumber,
    string? Email,
    string? NationalId,
    string? KraPin,
    string? Address,
    bool IsActive,
    int AssignedPropertiesCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record LandlordDetailDto(
    Guid Id,
    string FullName,
    string PhoneNumber,
    string? Email,
    string? NationalId,
    string? KraPin,
    string? Address,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    List<LandlordAssignmentDto> AssignedProperties);

public record LandlordAssignmentDto(
    Guid AssignmentId,
    Guid PropertyId,
    string PropertyName,
    string? PropertyCode,
    OwnershipRole Role,
    bool IsPrimaryOwner,
    DateTime AssignedAt,
    DateTime? EffectiveTo,
    bool IsActive);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetLandlordsQuery : IRequest<List<LandlordDto>>;

public record GetLandlordByIdQuery(Guid Id) : IRequest<LandlordDetailDto>;

public record GetLandlordPropertiesQuery(Guid LandlordId) : IRequest<List<LandlordAssignmentDto>>;

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreateLandlordCommand(
    string FullName,
    string PhoneNumber,
    string? Email = null,
    string? NationalId = null,
    string? KraPin = null,
    string? Address = null,
    string? CreatedBy = null) : IRequest<Guid>;

public record UpdateLandlordCommand(
    Guid Id,
    string FullName,
    string PhoneNumber,
    string? Email = null,
    string? NationalId = null,
    string? KraPin = null,
    string? Address = null,
    string? UpdatedBy = null) : IRequest<Unit>;

public record ActivateLandlordCommand(Guid Id, string? UpdatedBy = null) : IRequest<Unit>;

public record DeactivateLandlordCommand(Guid Id, string? UpdatedBy = null) : IRequest<Unit>;

public record AssignLandlordToPropertyCommand(
    Guid LandlordId,
    Guid PropertyId,
    OwnershipRole Role = OwnershipRole.PrimaryOwner,
    string? CreatedBy = null) : IRequest<Guid>;

public record RemoveLandlordAssignmentCommand(Guid AssignmentId) : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetLandlordsHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetLandlordsQuery, List<LandlordDto>>
{
    public async Task<List<LandlordDto>> Handle(GetLandlordsQuery request, CancellationToken ct)
    {
        var query = db.Owners.AsQueryable();

        // If caller is scoped to a specific owner, restrict to their own record
        if (currentUser.OwnerId.HasValue && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("PlatformAdmin"))
        {
            query = query.Where(o => o.Id == currentUser.OwnerId.Value);
        }

        return await query
            .OrderBy(o => o.FullName)
            .Select(o => new LandlordDto(
                o.Id,
                o.FullName,
                o.PhoneNumber,
                o.Email,
                o.NationalId,
                o.KraPin,
                o.Address,
                o.IsActive,
                o.Ownerships.Count(po => po.EffectiveTo == null),
                o.CreatedAt,
                o.UpdatedAt))
            .ToListAsync(ct);
    }
}

public class GetLandlordByIdHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetLandlordByIdQuery, LandlordDetailDto>
{
    public async Task<LandlordDetailDto> Handle(GetLandlordByIdQuery request, CancellationToken ct)
    {
        if (currentUser.OwnerId.HasValue && currentUser.OwnerId.Value != request.Id &&
            !currentUser.IsInRole("Admin") && !currentUser.IsInRole("PlatformAdmin"))
        {
            throw new ForbiddenException("You cannot access another landlord's details.");
        }

        var landlord = await db.Owners
            .Include(o => o.Ownerships.Where(po => po.EffectiveTo == null))
                .ThenInclude(po => po.Property)
            .FirstOrDefaultAsync(o => o.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(Owner), request.Id);

        var assignments = landlord.Ownerships
            .Select(po => new LandlordAssignmentDto(
                po.Id,
                po.PropertyId,
                po.Property.Name,
                po.Property.PropertyCode,
                po.Role,
                po.Role == OwnershipRole.PrimaryOwner,
                po.EffectiveFrom,
                po.EffectiveTo,
                po.EffectiveTo == null))
            .ToList();

        return new LandlordDetailDto(
            landlord.Id,
            landlord.FullName,
            landlord.PhoneNumber,
            landlord.Email,
            landlord.NationalId,
            landlord.KraPin,
            landlord.Address,
            landlord.IsActive,
            landlord.CreatedAt,
            landlord.UpdatedAt,
            assignments);
    }
}

public class GetLandlordPropertiesHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetLandlordPropertiesQuery, List<LandlordAssignmentDto>>
{
    public async Task<List<LandlordAssignmentDto>> Handle(GetLandlordPropertiesQuery request, CancellationToken ct)
    {
        if (currentUser.OwnerId.HasValue && currentUser.OwnerId.Value != request.LandlordId &&
            !currentUser.IsInRole("Admin") && !currentUser.IsInRole("PlatformAdmin"))
        {
            throw new ForbiddenException("You cannot access another landlord's properties.");
        }

        return await db.PropertyOwnerships
            .Where(po => po.OwnerId == request.LandlordId && po.EffectiveTo == null)
            .Include(po => po.Property)
            .OrderByDescending(po => po.EffectiveFrom)
            .Select(po => new LandlordAssignmentDto(
                po.Id,
                po.PropertyId,
                po.Property.Name,
                po.Property.PropertyCode,
                po.Role,
                po.Role == OwnershipRole.PrimaryOwner,
                po.EffectiveFrom,
                po.EffectiveTo,
                po.EffectiveTo == null))
            .ToListAsync(ct);
    }
}

public class CreateLandlordHandler(IApplicationDbContext db)
    : IRequestHandler<CreateLandlordCommand, Guid>
{
    public async Task<Guid> Handle(CreateLandlordCommand cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.FullName))
            throw new ValidationException(nameof(cmd.FullName), "Full name is required.");

        if (string.IsNullOrWhiteSpace(cmd.PhoneNumber))
            throw new ValidationException(nameof(cmd.PhoneNumber), "Phone number is required.");

        if (await db.Owners.AnyAsync(o => o.PhoneNumber == cmd.PhoneNumber, ct))
            throw new ConflictException($"A landlord with phone number '{cmd.PhoneNumber}' already exists.");

        var landlord = Owner.Create(
            cmd.FullName,
            cmd.PhoneNumber,
            cmd.Email,
            cmd.NationalId,
            cmd.KraPin,
            cmd.Address,
            cmd.CreatedBy);

        db.Owners.Add(landlord);
        await db.SaveChangesAsync(ct);
        return landlord.Id;
    }
}

public class UpdateLandlordHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateLandlordCommand, Unit>
{
    public async Task<Unit> Handle(UpdateLandlordCommand cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.FullName))
            throw new ValidationException(nameof(cmd.FullName), "Full name is required.");

        if (string.IsNullOrWhiteSpace(cmd.PhoneNumber))
            throw new ValidationException(nameof(cmd.PhoneNumber), "Phone number is required.");

        var landlord = await db.Owners.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(Owner), cmd.Id);

        if (await db.Owners.AnyAsync(o => o.PhoneNumber == cmd.PhoneNumber && o.Id != cmd.Id, ct))
            throw new ConflictException($"Another landlord with phone number '{cmd.PhoneNumber}' already exists.");

        landlord.Update(
            cmd.FullName,
            cmd.PhoneNumber,
            cmd.Email,
            cmd.NationalId,
            cmd.KraPin,
            cmd.Address,
            cmd.UpdatedBy ?? "system");

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class ActivateLandlordHandler(IApplicationDbContext db)
    : IRequestHandler<ActivateLandlordCommand, Unit>
{
    public async Task<Unit> Handle(ActivateLandlordCommand cmd, CancellationToken ct)
    {
        var landlord = await db.Owners.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(Owner), cmd.Id);

        landlord.Activate(cmd.UpdatedBy ?? "system");
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class DeactivateLandlordHandler(IApplicationDbContext db)
    : IRequestHandler<DeactivateLandlordCommand, Unit>
{
    public async Task<Unit> Handle(DeactivateLandlordCommand cmd, CancellationToken ct)
    {
        var landlord = await db.Owners.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(Owner), cmd.Id);

        landlord.Deactivate(cmd.UpdatedBy ?? "system");
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class AssignLandlordToPropertyHandler(IApplicationDbContext db)
    : IRequestHandler<AssignLandlordToPropertyCommand, Guid>
{
    public async Task<Guid> Handle(AssignLandlordToPropertyCommand cmd, CancellationToken ct)
    {
        var landlord = await db.Owners.FindAsync([cmd.LandlordId], ct)
            ?? throw new NotFoundException(nameof(Owner), cmd.LandlordId);

        if (!landlord.IsActive)
            throw new ValidationException(nameof(cmd.LandlordId), "Cannot assign an inactive landlord.");

        var property = await db.Properties.FindAsync([cmd.PropertyId], ct)
            ?? throw new NotFoundException(nameof(Property), cmd.PropertyId);

        if (!property.IsActive)
            throw new ValidationException(nameof(cmd.PropertyId), "Cannot assign to an inactive property.");

        var existing = await db.PropertyOwnerships
            .FirstOrDefaultAsync(po => po.OwnerId == cmd.LandlordId && po.PropertyId == cmd.PropertyId && po.EffectiveTo == null, ct);

        if (existing is not null)
            throw new ConflictException("This landlord is already actively assigned to this property.");

        // If assigning as PrimaryOwner, verify no other active PrimaryOwner exists
        if (cmd.Role == OwnershipRole.PrimaryOwner)
        {
            var activePrimary = await db.PropertyOwnerships
                .FirstOrDefaultAsync(po => po.PropertyId == cmd.PropertyId && po.Role == OwnershipRole.PrimaryOwner && po.EffectiveTo == null, ct);

            if (activePrimary is not null)
                throw new ConflictException($"Property '{property.Name}' already has an active primary landlord.");
        }

        var assignment = PropertyOwnership.Create(cmd.LandlordId, cmd.PropertyId, cmd.Role, cmd.CreatedBy);
        db.PropertyOwnerships.Add(assignment);
        await db.SaveChangesAsync(ct);
        return assignment.Id;
    }
}

public class RemoveLandlordAssignmentHandler(IApplicationDbContext db)
    : IRequestHandler<RemoveLandlordAssignmentCommand, Unit>
{
    public async Task<Unit> Handle(RemoveLandlordAssignmentCommand cmd, CancellationToken ct)
    {
        var assignment = await db.PropertyOwnerships.FindAsync([cmd.AssignmentId], ct)
            ?? throw new NotFoundException(nameof(PropertyOwnership), cmd.AssignmentId);

        assignment.Close();
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
