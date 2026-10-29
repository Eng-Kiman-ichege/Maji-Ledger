using MajiLedger.Domain.Entities;

namespace MajiLedger.Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(ApplicationUser user, IEnumerable<Guid> authorizedPropertyIds);
}
