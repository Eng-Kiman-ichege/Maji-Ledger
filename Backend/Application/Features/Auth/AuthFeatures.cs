using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.Auth;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record UserDto(
    Guid Id,
    string Email,
    string FullName,
    string PhoneNumber,
    UserRole Role,
    Guid? OwnerId,
    List<Guid> AuthorizedPropertyIds);

public record LoginResultDto(
    string Token,
    UserDto User);

public record AssignedPropertySummaryDto(
    Guid PropertyId,
    string PropertyName,
    string? Town,
    string? County);

public record UserSummaryDto(
    Guid Id,
    string Email,
    string FullName,
    string PhoneNumber,
    UserRole Role,
    bool IsActive,
    Guid? OwnerId,
    string? OwnerName,
    List<AssignedPropertySummaryDto> AssignedProperties,
    DateTime CreatedAt);

// ── Queries & Commands ────────────────────────────────────────────────────────

public record LoginCommand(
    string Email,
    string Password) : IRequest<LoginResultDto>;

public record GetCurrentUserQuery(
    string? UserId = null) : IRequest<UserDto?>;

public record CreateUserCommand(
    string Email,
    string FullName,
    string PhoneNumber,
    string Password,
    UserRole Role,
    Guid? OwnerId = null,
    List<Guid>? PropertyIds = null) : IRequest<Guid>;

public record GetUsersQuery : IRequest<List<UserSummaryDto>>;

public record SeedDefaultAdminCommand : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class LoginHandler(
    IApplicationDbContext db,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwtTokenService)
    : IRequestHandler<LoginCommand, LoginResultDto>
{
    public async Task<LoginResultDto> Handle(LoginCommand request, CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await db.ApplicationUsers
            .Include(u => u.PropertyAccesses.Where(p => p.RevokedAt == null))
            .Include(u => u.Owner)
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail && u.IsActive, ct);

        if (user == null || !passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new ValidationException("Invalid email or password.");
        }

        // Resolve authorized properties
        var authorizedPropertyIds = new HashSet<Guid>(
            user.PropertyAccesses.Where(a => a.IsActive).Select(a => a.PropertyId));

        if (user.OwnerId.HasValue)
        {
            var ownedPropertyIds = await db.PropertyOwnerships
                .Where(po => po.OwnerId == user.OwnerId.Value && po.EffectiveTo == null)
                .Select(po => po.PropertyId)
                .ToListAsync(ct);

            foreach (var pid in ownedPropertyIds)
            {
                authorizedPropertyIds.Add(pid);
            }
        }

        var propList = authorizedPropertyIds.ToList();
        var token = jwtTokenService.GenerateToken(user, propList);

        var userDto = new UserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.PhoneNumber,
            user.Role,
            user.OwnerId,
            propList);

        return new LoginResultDto(token, userDto);
    }
}

public class GetCurrentUserHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUserService)
    : IRequestHandler<GetCurrentUserQuery, UserDto?>
{
    public async Task<UserDto?> Handle(GetCurrentUserQuery request, CancellationToken ct)
    {
        var userIdStr = request.UserId ?? currentUserService.UserId;
        if (string.IsNullOrWhiteSpace(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
        {
            return null;
        }

        var user = await db.ApplicationUsers
            .Include(u => u.PropertyAccesses.Where(p => p.RevokedAt == null))
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, ct);

        if (user == null) return null;

        var authorizedPropertyIds = new HashSet<Guid>(
            user.PropertyAccesses.Where(a => a.IsActive).Select(a => a.PropertyId));

        if (user.OwnerId.HasValue)
        {
            var ownedPropertyIds = await db.PropertyOwnerships
                .Where(po => po.OwnerId == user.OwnerId.Value && po.EffectiveTo == null)
                .Select(po => po.PropertyId)
                .ToListAsync(ct);

            foreach (var pid in ownedPropertyIds)
            {
                authorizedPropertyIds.Add(pid);
            }
        }

        return new UserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.PhoneNumber,
            user.Role,
            user.OwnerId,
            authorizedPropertyIds.ToList());
    }
}

public class CreateUserHandler(
    IApplicationDbContext db,
    IPasswordHasher passwordHasher,
    ICurrentUserService currentUserService)
    : IRequestHandler<CreateUserCommand, Guid>
{
    public async Task<Guid> Handle(CreateUserCommand request, CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var exists = await db.ApplicationUsers.AnyAsync(u => u.Email == normalizedEmail, ct);
        if (exists)
        {
            throw new ConflictException($"User with email '{request.Email}' already exists.");
        }

        var passwordHash = passwordHasher.HashPassword(request.Password);
        Guid? ownerId = request.OwnerId;

        // If creating a Property Owner and no Owner profile was passed, create one automatically
        if (request.Role == UserRole.Owner && !ownerId.HasValue)
        {
            var owner = Owner.Create(
                fullName: request.FullName,
                phoneNumber: request.PhoneNumber,
                email: normalizedEmail,
                createdBy: currentUserService.UserId);

            db.Owners.Add(owner);
            await db.SaveChangesAsync(ct);
            ownerId = owner.Id;
        }

        var user = ApplicationUser.Create(
            email: normalizedEmail,
            phoneNumber: request.PhoneNumber.Trim(),
            fullName: request.FullName.Trim(),
            passwordHash: passwordHash,
            role: request.Role,
            ownerId: ownerId);

        db.ApplicationUsers.Add(user);
        await db.SaveChangesAsync(ct);

        // Map assigned properties
        if (request.PropertyIds != null && request.PropertyIds.Count > 0)
        {
            foreach (var propId in request.PropertyIds.Distinct())
            {
                var access = PropertyAccess.Grant(
                    user.Id,
                    propId,
                    PropertyAccessRole.FullAccess,
                    currentUserService.UserId ?? "System");

                db.PropertyAccesses.Add(access);

                // If owner, also record property ownership if not already present
                if (ownerId.HasValue)
                {
                    var hasOwnership = await db.PropertyOwnerships
                        .AnyAsync(po => po.OwnerId == ownerId.Value && po.PropertyId == propId && po.EffectiveTo == null, ct);

                    if (!hasOwnership)
                    {
                        var ownership = PropertyOwnership.Create(
                            ownerId.Value,
                            propId,
                            OwnershipRole.PrimaryOwner,
                            currentUserService.UserId ?? "System");

                        db.PropertyOwnerships.Add(ownership);
                    }
                }
            }

            await db.SaveChangesAsync(ct);
        }

        return user.Id;
    }
}

public class GetUsersHandler(IApplicationDbContext db)
    : IRequestHandler<GetUsersQuery, List<UserSummaryDto>>
{
    public async Task<List<UserSummaryDto>> Handle(GetUsersQuery request, CancellationToken ct)
    {
        var users = await db.ApplicationUsers
            .Include(u => u.Owner)
            .Include(u => u.PropertyAccesses.Where(p => p.RevokedAt == null))
                .ThenInclude(pa => pa.Property)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync(ct);

        var result = new List<UserSummaryDto>();

        foreach (var u in users)
        {
            var assignedProperties = new List<AssignedPropertySummaryDto>();

            // Access grants
            foreach (var pa in u.PropertyAccesses.Where(a => a.IsActive && a.Property != null))
            {
                assignedProperties.Add(new AssignedPropertySummaryDto(
                    pa.Property.Id,
                    pa.Property.Name,
                    pa.Property.Town,
                    pa.Property.County));
            }

            // Owner properties
            if (u.OwnerId.HasValue)
            {
                var ownedProps = await db.PropertyOwnerships
                    .Include(po => po.Property)
                    .Where(po => po.OwnerId == u.OwnerId.Value && po.EffectiveTo == null && po.Property != null)
                    .Select(po => po.Property)
                    .ToListAsync(ct);

                foreach (var p in ownedProps)
                {
                    if (assignedProperties.All(ap => ap.PropertyId != p.Id))
                    {
                        assignedProperties.Add(new AssignedPropertySummaryDto(
                            p.Id,
                            p.Name,
                            p.Town,
                            p.County));
                    }
                }
            }

            result.Add(new UserSummaryDto(
                u.Id,
                u.Email,
                u.FullName,
                u.PhoneNumber,
                u.Role,
                u.IsActive,
                u.OwnerId,
                u.Owner?.FullName,
                assignedProperties,
                u.CreatedAt));
        }

        return result;
    }
}

public class SeedDefaultAdminHandler(
    IApplicationDbContext db,
    IPasswordHasher passwordHasher)
    : IRequestHandler<SeedDefaultAdminCommand, Unit>
{
    public async Task<Unit> Handle(SeedDefaultAdminCommand request, CancellationToken ct)
    {
        var hasAdmin = await db.ApplicationUsers.AnyAsync(u => u.Role == UserRole.Admin, ct);
        if (!hasAdmin)
        {
            var defaultAdmin = ApplicationUser.Create(
                email: "admin@majiledger.com",
                phoneNumber: "+254700000001",
                fullName: "Maji Ledger Administrator",
                passwordHash: passwordHasher.HashPassword("Admin@123456"),
                role: UserRole.Admin);

            db.ApplicationUsers.Add(defaultAdmin);
            await db.SaveChangesAsync(ct);
        }

        return Unit.Value;
    }
}
