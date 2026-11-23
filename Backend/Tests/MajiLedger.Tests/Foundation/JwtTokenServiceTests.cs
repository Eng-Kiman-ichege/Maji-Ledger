using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FluentAssertions;
using MajiLedger.Application.Common.Security;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MajiLedger.Infrastructure.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace MajiLedger.Tests.Foundation;

public class JwtTokenServiceTests
{
    private readonly IConfiguration _configuration;
    private const string Secret = "TestSecurityKeyForPropertyLedgerMustBeAtLeast32Bytes!";
    private const string Issuer = "PropertyLedgerTests";
    private const string Audience = "PropertyLedgerTestClients";

    public JwtTokenServiceTests()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = Secret,
            ["Jwt:Issuer"] = Issuer,
            ["Jwt:Audience"] = Audience,
            ["Jwt:ExpiryMinutes"] = "120"
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();
    }

    [Fact]
    public void GenerateToken_IncludesRequiredClaims_AndValidStructure()
    {
        var tokenService = new JwtTokenService(_configuration);
        var user = ApplicationUser.Create(
            "admin@propertyledger.com",
            "SaltedHashPlaceholder",
            "Super Administrator",
            "+254711000111",
            UserRole.Admin);

        var propertyId1 = Guid.NewGuid();
        var propertyId2 = Guid.NewGuid();

        var tokenString = tokenService.GenerateToken(user, [propertyId1, propertyId2]);
        tokenString.Should().NotBeNullOrWhiteSpace();

        // Validate token cryptographic signature and claims
        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Secret)),
            ValidateIssuer = true,
            ValidIssuer = Issuer,
            ValidateAudience = true,
            ValidAudience = Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        var principal = tokenHandler.ValidateToken(tokenString, validationParameters, out var validatedToken);
        validatedToken.Should().NotBeNull();

        principal.FindFirst(ClaimTypes.Email)?.Value.Should().Be("admin@propertyledger.com");
        principal.FindFirst(ClaimTypes.Role)?.Value.Should().Be("Admin");

        var propIdsClaim = principal.FindFirst("propertyIds")?.Value;
        propIdsClaim.Should().Contain(propertyId1.ToString());
        propIdsClaim.Should().Contain(propertyId2.ToString());
    }

    [Fact]
    public void GenerateToken_EncodesModulesAndPermissionsBasedOnRole()
    {
        var tokenService = new JwtTokenService(_configuration);
        var ownerUser = ApplicationUser.Create(
            "landlord@propertyledger.com",
            "SaltedHashPlaceholder",
            "Landlord User",
            "+254722000222",
            UserRole.Owner,
            ownerId: Guid.NewGuid());

        var tokenString = tokenService.GenerateToken(ownerUser, []);

        var tokenHandler = new JwtSecurityTokenHandler();
        var jwt = tokenHandler.ReadJwtToken(tokenString);

        var modules = jwt.Claims.Where(c => c.Type == "module").Select(c => c.Value).ToList();
        modules.Should().Contain(AppModules.PropertyManagement);
        modules.Should().Contain(AppModules.WaterLedger);
        modules.Should().NotContain(AppModules.PlatformAdmin);

        var permissions = jwt.Claims.Where(c => c.Type == "permission").Select(c => c.Value).ToList();
        permissions.Should().Contain(Permissions.Properties.View);
        permissions.Should().Contain(Permissions.Rent.View);
        permissions.Should().NotContain(Permissions.Users.Manage);
    }
}
