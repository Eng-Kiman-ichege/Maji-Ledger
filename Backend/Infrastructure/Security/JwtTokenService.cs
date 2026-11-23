using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Application.Common.Security;
using MajiLedger.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace MajiLedger.Infrastructure.Security;

public class JwtTokenService(IConfiguration configuration) : IJwtTokenService
{
    public string GenerateToken(ApplicationUser user, IEnumerable<Guid> authorizedPropertyIds)
    {
        var secret = configuration["Jwt:Secret"] 
                     ?? configuration["JwtSettings:Secret"]
                     ?? "PropertyLedger_DefaultSecureDevelopmentSecretKey_MustBeAtLeast32BytesLong!";
        var issuer = configuration["Jwt:Issuer"] ?? configuration["JwtSettings:Issuer"] ?? "PropertyLedger";
        var audience = configuration["Jwt:Audience"] ?? configuration["JwtSettings:Audience"] ?? "PropertyLedgerClients";
        var expiryMinutesStr = configuration["Jwt:ExpiryMinutes"] ?? configuration["JwtSettings:ExpiryMinutes"];
        var expiry = int.TryParse(expiryMinutesStr, out var mins) && mins > 0
            ? TimeSpan.FromMinutes(mins)
            : TimeSpan.FromDays(7);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var propertyIdsList = authorizedPropertyIds.Select(p => p.ToString()).ToList();
        var permissions = RolePermissions.GetPermissionsForRole(user.Role);
        var modules = RolePermissions.GetModulesForRole(user.Role);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("role", user.Role.ToString()),
            new("ownerId", user.OwnerId?.ToString() ?? string.Empty),
            new("propertyIds", string.Join(",", propertyIdsList))
        };

        foreach (var mod in modules)
        {
            claims.Add(new Claim("module", mod));
        }

        foreach (var perm in permissions)
        {
            claims.Add(new Claim("permission", perm));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.Add(expiry),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
