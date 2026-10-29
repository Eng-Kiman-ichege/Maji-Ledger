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

public record SeedDemoDataCommand : IRequest<Unit>;

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

public class SeedDemoDataHandler(
    IApplicationDbContext db,
    IPasswordHasher passwordHasher)
    : IRequestHandler<SeedDemoDataCommand, Unit>
{
    public async Task<Unit> Handle(SeedDemoDataCommand request, CancellationToken ct)
    {
        // 1. Ensure Admin exists
        var admin = await db.ApplicationUsers.FirstOrDefaultAsync(u => u.Role == UserRole.Admin, ct);
        if (admin == null)
        {
            admin = ApplicationUser.Create(
                email: "admin@majiledger.com",
                phoneNumber: "+254700000001",
                fullName: "Maji Ledger Administrator",
                passwordHash: passwordHasher.HashPassword("Admin@123456"),
                role: UserRole.Admin);
            db.ApplicationUsers.Add(admin);
            await db.SaveChangesAsync(ct);
        }

        // 2. Check if demo properties already seeded
        var hasDemoProps = await db.Properties.AnyAsync(p => p.Name == "Kilimani Heights", ct);
        if (hasDemoProps && await db.PaymentAttempts.AnyAsync(ct))
        {
            return Unit.Value;
        }

        // 3. Payment Provider Config
        var config = await db.PaymentProviderConfigs.FirstOrDefaultAsync(ct);
        if (config == null)
        {
            config = PaymentProviderConfig.Create(
                PaymentProviderType.MpesaPaybill,
                "522522",
                "Maji Ledger Collections",
                EnvironmentType.Production,
                null,
                "System");
            db.PaymentProviderConfigs.Add(config);
            await db.SaveChangesAsync(ct);
        }

        // 4. Default Water Tariff
        var tariff = await db.WaterTariffs.FirstOrDefaultAsync(ct);
        if (tariff == null)
        {
            tariff = WaterTariff.CreateFlat(
                "Standard Residential Flat Tariff",
                120.00m,
                50.00m,
                BillingCycle.PerUnit,
                null,
                DateTime.UtcNow,
                "System");
            db.WaterTariffs.Add(tariff);
            await db.SaveChangesAsync(ct);
        }

        // 5. Owner 1: James Mwangi
        var owner1 = await db.Owners.FirstOrDefaultAsync(o => o.Email == "owner@kilimani.com", ct);
        if (owner1 == null)
        {
            owner1 = Owner.Create(
                fullName: "James Mwangi",
                phoneNumber: "+254711223344",
                email: "owner@kilimani.com",
                nationalId: "24891022",
                kraPin: "A001928374Z",
                createdBy: "System");
            db.Owners.Add(owner1);
            await db.SaveChangesAsync(ct);
        }

        var userOwner1 = await db.ApplicationUsers.FirstOrDefaultAsync(u => u.Email == "owner@kilimani.com", ct);
        if (userOwner1 == null)
        {
            userOwner1 = ApplicationUser.Create(
                email: "owner@kilimani.com",
                phoneNumber: "+254711223344",
                fullName: "James Mwangi",
                passwordHash: passwordHasher.HashPassword("Owner@123456"),
                role: UserRole.Owner,
                ownerId: owner1.Id);
            db.ApplicationUsers.Add(userOwner1);
            await db.SaveChangesAsync(ct);
        }

        // 6. Owner 2: Sarah Wanjiku
        var owner2 = await db.Owners.FirstOrDefaultAsync(o => o.Email == "sarah.wanjiku@oakwood.co.ke", ct);
        if (owner2 == null)
        {
            owner2 = Owner.Create(
                fullName: "Sarah Wanjiku",
                phoneNumber: "+254722334455",
                email: "sarah.wanjiku@oakwood.co.ke",
                nationalId: "30192834",
                kraPin: "A009876543W",
                createdBy: "System");
            db.Owners.Add(owner2);
            await db.SaveChangesAsync(ct);
        }

        var userOwner2 = await db.ApplicationUsers.FirstOrDefaultAsync(u => u.Email == "sarah.wanjiku@oakwood.co.ke", ct);
        if (userOwner2 == null)
        {
            userOwner2 = ApplicationUser.Create(
                email: "sarah.wanjiku@oakwood.co.ke",
                phoneNumber: "+254722334455",
                fullName: "Sarah Wanjiku",
                passwordHash: passwordHasher.HashPassword("Owner@123456"),
                role: UserRole.Owner,
                ownerId: owner2.Id);
            db.ApplicationUsers.Add(userOwner2);
            await db.SaveChangesAsync(ct);
        }

        // 7. Properties
        // Property 1: Kilimani Heights
        var prop1 = await db.Properties.FirstOrDefaultAsync(p => p.Name == "Kilimani Heights", ct);
        if (prop1 == null)
        {
            prop1 = Property.Create("Kilimani Heights", PropertyType.Residential, "Argwings Kodhek Rd", "Nairobi", "Nairobi", "00100", "Premier residential apartments in Kilimani", "System");
            db.Properties.Add(prop1);
            await db.SaveChangesAsync(ct);
        }

        // Property 2: Kileleshwa Palms
        var prop2 = await db.Properties.FirstOrDefaultAsync(p => p.Name == "Kileleshwa Palms", ct);
        if (prop2 == null)
        {
            prop2 = Property.Create("Kileleshwa Palms", PropertyType.Residential, "Kandara Rd", "Nairobi", "Nairobi", "00100", "Modern family rental apartments", "System");
            db.Properties.Add(prop2);
            await db.SaveChangesAsync(ct);
        }

        // Property 3: Oakwood Executive Suites
        var prop3 = await db.Properties.FirstOrDefaultAsync(p => p.Name == "Oakwood Executive Suites", ct);
        if (prop3 == null)
        {
            prop3 = Property.Create("Oakwood Executive Suites", PropertyType.Mixed, "Mpaka Rd", "Westlands", "Nairobi", "00100", "Commercial and executive residential suites", "System");
            db.Properties.Add(prop3);
            await db.SaveChangesAsync(ct);
        }

        // Link Ownerships
        if (!await db.PropertyOwnerships.AnyAsync(po => po.OwnerId == owner1.Id && po.PropertyId == prop1.Id, ct))
        {
            db.PropertyOwnerships.Add(PropertyOwnership.Create(owner1.Id, prop1.Id, OwnershipRole.PrimaryOwner, "System"));
        }
        if (!await db.PropertyOwnerships.AnyAsync(po => po.OwnerId == owner1.Id && po.PropertyId == prop2.Id, ct))
        {
            db.PropertyOwnerships.Add(PropertyOwnership.Create(owner1.Id, prop2.Id, OwnershipRole.PrimaryOwner, "System"));
        }
        if (!await db.PropertyOwnerships.AnyAsync(po => po.OwnerId == owner2.Id && po.PropertyId == prop3.Id, ct))
        {
            db.PropertyOwnerships.Add(PropertyOwnership.Create(owner2.Id, prop3.Id, OwnershipRole.PrimaryOwner, "System"));
        }

        // Link User Access
        if (!await db.PropertyAccesses.AnyAsync(pa => pa.ApplicationUserId == userOwner1.Id && pa.PropertyId == prop1.Id, ct))
        {
            db.PropertyAccesses.Add(PropertyAccess.Grant(userOwner1.Id, prop1.Id, PropertyAccessRole.FullAccess, "System"));
        }
        if (!await db.PropertyAccesses.AnyAsync(pa => pa.ApplicationUserId == userOwner1.Id && pa.PropertyId == prop2.Id, ct))
        {
            db.PropertyAccesses.Add(PropertyAccess.Grant(userOwner1.Id, prop2.Id, PropertyAccessRole.FullAccess, "System"));
        }
        if (!await db.PropertyAccesses.AnyAsync(pa => pa.ApplicationUserId == userOwner2.Id && pa.PropertyId == prop3.Id, ct))
        {
            db.PropertyAccesses.Add(PropertyAccess.Grant(userOwner2.Id, prop3.Id, PropertyAccessRole.FullAccess, "System"));
        }
        await db.SaveChangesAsync(ct);

        // Buildings & Apartments for Kilimani Heights
        var bldg1A = await db.Buildings.FirstOrDefaultAsync(b => b.PropertyId == prop1.Id && b.Name == "Tower Alpha", ct);
        if (bldg1A == null)
        {
            bldg1A = Building.Create(prop1.Id, "Tower Alpha", 8, "Residential wing A", "System");
            db.Buildings.Add(bldg1A);
            await db.SaveChangesAsync(ct);

            for (int i = 1; i <= 4; i++)
            {
                var apt = Apartment.Create(bldg1A.Id, $"A-10{i}", "1", $"Apartment 10{i}", "System");
                db.Apartments.Add(apt);
                await db.SaveChangesAsync(ct);

                var meter = Meter.Create($"MTR-KLM-A{i:00}", MeterType.Prepaid, $"SN-882910{i}", apt.Id, "System");
                db.Meters.Add(meter);
                await db.SaveChangesAsync(ct);

                var qr = QrCodeRegistration.Create(meter.Id, config.Id, "System");
                db.QrCodeRegistrations.Add(qr);
            }
        }

        var bldg1B = await db.Buildings.FirstOrDefaultAsync(b => b.PropertyId == prop1.Id && b.Name == "Tower Beta", ct);
        if (bldg1B == null)
        {
            bldg1B = Building.Create(prop1.Id, "Tower Beta", 8, "Residential wing B", "System");
            db.Buildings.Add(bldg1B);
            await db.SaveChangesAsync(ct);

            for (int i = 1; i <= 4; i++)
            {
                var apt = Apartment.Create(bldg1B.Id, $"B-20{i}", "2", $"Apartment 20{i}", "System");
                db.Apartments.Add(apt);
                await db.SaveChangesAsync(ct);

                var meter = Meter.Create($"MTR-KLM-B{i:00}", MeterType.Prepaid, $"SN-883910{i}", apt.Id, "System");
                db.Meters.Add(meter);
                await db.SaveChangesAsync(ct);

                var qr = QrCodeRegistration.Create(meter.Id, config.Id, "System");
                db.QrCodeRegistrations.Add(qr);
            }
        }

        // Buildings & Apartments for Kileleshwa Palms
        var bldg2 = await db.Buildings.FirstOrDefaultAsync(b => b.PropertyId == prop2.Id && b.Name == "Palm Block", ct);
        if (bldg2 == null)
        {
            bldg2 = Building.Create(prop2.Id, "Palm Block", 4, "Main residential block", "System");
            db.Buildings.Add(bldg2);
            await db.SaveChangesAsync(ct);

            for (int i = 1; i <= 4; i++)
            {
                var apt = Apartment.Create(bldg2.Id, $"P-0{i}", "Ground", $"Unit P-0{i}", "System");
                db.Apartments.Add(apt);
                await db.SaveChangesAsync(ct);

                var meter = Meter.Create($"MTR-KLP-P{i:00}", MeterType.Prepaid, $"SN-991200{i}", apt.Id, "System");
                db.Meters.Add(meter);
                await db.SaveChangesAsync(ct);

                var qr = QrCodeRegistration.Create(meter.Id, config.Id, "System");
                db.QrCodeRegistrations.Add(qr);
            }
        }

        // Buildings & Apartments for Oakwood
        var bldg3 = await db.Buildings.FirstOrDefaultAsync(b => b.PropertyId == prop3.Id && b.Name == "Executive Wing", ct);
        if (bldg3 == null)
        {
            bldg3 = Building.Create(prop3.Id, "Executive Wing", 6, "Suites wing", "System");
            db.Buildings.Add(bldg3);
            await db.SaveChangesAsync(ct);

            for (int i = 1; i <= 4; i++)
            {
                var apt = Apartment.Create(bldg3.Id, $"Suite {i}01", $"{i}", $"Suite {i}01", "System");
                db.Apartments.Add(apt);
                await db.SaveChangesAsync(ct);

                var meter = Meter.Create($"MTR-OAK-S{i:00}", MeterType.Prepaid, $"SN-772910{i}", apt.Id, "System");
                db.Meters.Add(meter);
                await db.SaveChangesAsync(ct);

                var qr = QrCodeRegistration.Create(meter.Id, config.Id, "System");
                db.QrCodeRegistrations.Add(qr);
            }
        }

        await db.SaveChangesAsync(ct);

        // Fetch all active meters across these properties to attach transactions
        var meters = await db.Meters
            .Include(m => m.QrCodes)
            .Where(m => m.MeterNumber.StartsWith("MTR-"))
            .ToListAsync(ct);

        if (meters.Count > 0 && !await db.PaymentAttempts.AnyAsync(ct))
        {
            var random = new Random(42);
            var channels = new[] { PaymentChannel.MpesaPaybill, PaymentChannel.ScanToPay };
            var amounts = new[] { 600m, 1000m, 1500m, 2000m, 2500m, 3000m, 1200m, 800m, 1800m };

            for (int i = 0; i < 28; i++)
            {
                var targetMeter = meters[i % meters.Count];
                var channel = channels[i % channels.Length];
                var amount = amounts[i % amounts.Length];
                var phone = $"+2547{random.Next(10000000, 99999999)}";
                var daysAgo = (28 - i) / 2.0;
                var txnDate = DateTime.UtcNow.AddDays(-daysAgo).AddHours(random.Next(1, 12));

                var attempt = PaymentAttempt.Initiate(
                    targetMeter.Id,
                    config.Id,
                    channel,
                    phone,
                    amount,
                    targetMeter.ActiveQrCode?.Id);

                attempt.SetProviderCheckoutId($"WS_{i:0000}_{random.Next(10000, 99999)}");
                attempt.Confirm();
                db.PaymentAttempts.Add(attempt);
                await db.SaveChangesAsync(ct);

                var receiptRef = $"QK{random.Next(10000000, 99999999)}";
                var payment = Payment.Confirm(attempt.Id, receiptRef, amount, txnDate, "KES");
                db.Payments.Add(payment);
                await db.SaveChangesAsync(ct);

                // Tariff calculation: base charge KES 50, rate KES 120 / m3
                var amountForWater = Math.Max(0, amount - 50m);
                var units = Math.Round(amountForWater / 120m, 2);

                var purchase = WaterPurchase.Create(payment.Id, targetMeter.Id, amountForWater, units, tariff.Id);
                purchase.MarkTokenIssued();
                db.WaterPurchases.Add(purchase);
                await db.SaveChangesAsync(ct);

                // Generate 20-digit STS token in groups of 4 digits
                var tokenDigits = $"{random.Next(1000, 9999)}-{random.Next(1000, 9999)}-{random.Next(1000, 9999)}-{random.Next(1000, 9999)}-{random.Next(1000, 9999)}";
                var token = WaterToken.Issue(purchase.Id, tokenDigits, $"STS_REQ_{i:000}");
                token.MarkDelivered();
                db.WaterTokens.Add(token);
                await db.SaveChangesAsync(ct);
            }
        }

        return Unit.Value;
    }
}
