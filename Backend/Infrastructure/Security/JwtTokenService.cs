using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace MajiLedger.Infrastructure.Security;

public class JwtTokenService(IConfiguration configuration) : IJwtTokenService
{
    public string GenerateToken(ApplicationUser user, IEnumerable<Guid> authorizedPropertyIds)
    {
        var secret = configuration["Jwt:Secret"] 
                     ?? "MajiLedgerSecureKey2026_SuperSecretKeyForJwtTokenGeneration_WaterMeteringSystem!";
        var issuer = configuration["Jwt:Issuer"] ?? "MajiLedger";
        var audience = configuration["Jwt:Audience"] ?? "MajiLedgerClients";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var propertyIdsList = authorizedPropertyIds.Select(p => p.ToString()).ToList();
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

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
