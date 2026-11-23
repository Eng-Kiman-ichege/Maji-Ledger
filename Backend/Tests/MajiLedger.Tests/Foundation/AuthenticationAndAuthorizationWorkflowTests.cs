using System.Security.Claims;
using FluentAssertions;
using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.Auth;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MajiLedger.Infrastructure.Persistence;
using MajiLedger.Infrastructure.Security;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace MajiLedger.Tests.Foundation;

public class AuthenticationAndAuthorizationWorkflowTests
{
    private MajiLedgerDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<MajiLedgerDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new MajiLedgerDbContext(options);
    }

    private IConfiguration CreateConfiguration()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "VeryStrongIntegrationTestKeyForPropertyLedger2026!",
                ["Jwt:Issuer"] = "PropertyLedger",
                ["Jwt:Audience"] = "PropertyLedgerClients"
            })
            .Build();
    }

    [Fact]
    public async Task LoginHandler_ValidCredentials_ReturnsJwtAndUserDto_WithoutExposingPasswordHash()
    {
        var dbName = Guid.NewGuid().ToString();
        var hasher = new PasswordHasher();
        var config = CreateConfiguration();
        var jwtService = new JwtTokenService(config);

        using (var db = CreateDbContext(dbName))
        {
            var rawPassword = "TestPassword@123";
            var passwordHash = hasher.HashPassword(rawPassword);

            var user = ApplicationUser.Create(
                email: "john.owner@propertyledger.com",
                phoneNumber: "+254700112233",
                fullName: "John Owner",
                passwordHash: passwordHash,
                role: UserRole.Owner,
                ownerId: Guid.NewGuid());

            db.ApplicationUsers.Add(user);
            await db.SaveChangesAsync();
        }

        using (var db = CreateDbContext(dbName))
        {
            var handler = new LoginHandler(db, hasher, jwtService);
            var result = await handler.Handle(
                new LoginCommand("john.owner@propertyledger.com", "TestPassword@123"),
                CancellationToken.None);

            result.Should().NotBeNull();
            result.Token.Should().NotBeNullOrWhiteSpace();
            result.User.Email.Should().Be("john.owner@propertyledger.com");
            result.User.FullName.Should().Be("John Owner");
            result.User.Role.Should().Be(UserRole.Owner);

            // Verify password hash is nowhere in the returned DTO
            result.User.GetType().GetProperty("PasswordHash").Should().BeNull();

            // Verify permissions and modules are populated
            result.User.Permissions.Should().NotBeNull();
            result.User.Permissions.Should().Contain(Permissions.Rent.View);
            result.User.Modules.Should().Contain(AppModules.PropertyManagement);
        }
    }

    [Fact]
    public async Task LoginHandler_InvalidPassword_ThrowsValidationException()
    {
        var dbName = Guid.NewGuid().ToString();
        var hasher = new PasswordHasher();
        var config = CreateConfiguration();
        var jwtService = new JwtTokenService(config);

        using (var db = CreateDbContext(dbName))
        {
            var user = ApplicationUser.Create(
                email: "user@propertyledger.com",
                phoneNumber: "+254711223344",
                fullName: "User Name",
                passwordHash: hasher.HashPassword("CorrectPassword!"),
                role: UserRole.Manager);

            db.ApplicationUsers.Add(user);
            await db.SaveChangesAsync();
        }

        using (var db = CreateDbContext(dbName))
        {
            var handler = new LoginHandler(db, hasher, jwtService);
            var act = async () => await handler.Handle(
                new LoginCommand("user@propertyledger.com", "WrongPassword!"),
                CancellationToken.None);

            await act.Should().ThrowAsync<ValidationException>()
                .WithMessage("Invalid email or password.");
        }
    }

    [Fact]
    public async Task LoginHandler_NonExistentEmail_ThrowsValidationException()
    {
        var dbName = Guid.NewGuid().ToString();
        var hasher = new PasswordHasher();
        var config = CreateConfiguration();
        var jwtService = new JwtTokenService(config);

        using (var db = CreateDbContext(dbName))
        {
            var handler = new LoginHandler(db, hasher, jwtService);
            var act = async () => await handler.Handle(
                new LoginCommand("ghost@propertyledger.com", "AnyPassword!"),
                CancellationToken.None);

            await act.Should().ThrowAsync<ValidationException>()
                .WithMessage("Invalid email or password.");
        }
    }

    [Fact]
    public void RolePermissions_SuperAdmin_HasAllPermissionsAndModules()
    {
        var perms = RolePermissions.GetPermissionsForRole(UserRole.Admin);
        var modules = RolePermissions.GetModulesForRole(UserRole.Admin);

        perms.Should().Contain(Permissions.Properties.Manage);
        perms.Should().Contain(Permissions.Users.Manage);
        perms.Should().Contain(Permissions.Audit.View);

        modules.Should().Contain(AppModules.PlatformAdmin);
        modules.Should().Contain(AppModules.PropertyManagement);
        modules.Should().Contain(AppModules.WaterLedger);
    }

    [Fact]
    public void RolePermissions_Owner_HasRestrictedPermissionsAndModules()
    {
        var perms = RolePermissions.GetPermissionsForRole(UserRole.Owner);
        var modules = RolePermissions.GetModulesForRole(UserRole.Owner);

        perms.Should().Contain(Permissions.Properties.View);
        perms.Should().Contain(Permissions.Rent.View);
        perms.Should().NotContain(Permissions.Users.Manage); // Cannot manage system users

        modules.Should().Contain(AppModules.PropertyManagement);
        modules.Should().Contain(AppModules.WaterLedger);
        modules.Should().NotContain(AppModules.PlatformAdmin);
    }

    [Fact]
    public void CurrentUserService_Unauthenticated_ReturnsNullAndFalse_DoesNotDefaultToAdmin()
    {
        var httpContextAccessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext() // No user principal attached
        };

        var currentUserService = new MajiLedger.WebAPI.Services.CurrentUserService(httpContextAccessor);

        currentUserService.IsAuthenticated.Should().BeFalse();
        currentUserService.UserId.Should().BeNull();
        currentUserService.Role.Should().BeNull();
        currentUserService.Email.Should().BeNull();
        currentUserService.OwnerId.Should().BeNull();
        currentUserService.AuthorizedPropertyIds.Should().BeEmpty();
        currentUserService.Permissions.Should().BeEmpty();
        currentUserService.Modules.Should().BeEmpty();
        currentUserService.IsInRole("Admin").Should().BeFalse();
        currentUserService.HasPermission(Permissions.Properties.Manage).Should().BeFalse();
    }

    [Fact]
    public void CurrentUserService_Authenticated_ParsesClaimsCorrectly()
    {
        var userId = Guid.NewGuid();
        var propId1 = Guid.NewGuid();
        var propId2 = Guid.NewGuid();

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, "landlord@propertyledger.com"),
            new(ClaimTypes.Role, "Owner"),
            new("role", "Owner"),
            new("propertyIds", $"{propId1},{propId2}"),
            new("permission", Permissions.Rent.View),
            new("permission", Permissions.Properties.View),
            new("module", AppModules.PropertyManagement)
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var httpContextAccessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        var currentUserService = new MajiLedger.WebAPI.Services.CurrentUserService(httpContextAccessor);

        currentUserService.IsAuthenticated.Should().BeTrue();
        currentUserService.UserId.Should().Be(userId.ToString());
        currentUserService.Email.Should().Be("landlord@propertyledger.com");
        currentUserService.Role.Should().Be("Owner");
        currentUserService.IsInRole("Owner").Should().BeTrue();
        currentUserService.IsInRole("Admin").Should().BeFalse();

        currentUserService.AuthorizedPropertyIds.Should().Contain(propId1);
        currentUserService.AuthorizedPropertyIds.Should().Contain(propId2);
        currentUserService.HasPropertyAccess(propId1).Should().BeTrue();
        currentUserService.HasPropertyAccess(Guid.NewGuid()).Should().BeFalse();

        currentUserService.HasPermission(Permissions.Rent.View).Should().BeTrue();
        currentUserService.HasPermission(Permissions.Users.Manage).Should().BeFalse();

        currentUserService.HasModuleAccess(AppModules.PropertyManagement).Should().BeTrue();
        currentUserService.HasModuleAccess(AppModules.PlatformAdmin).Should().BeFalse();
    }
}
