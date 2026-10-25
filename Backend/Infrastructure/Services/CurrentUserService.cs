using MajiLedger.Application.Common.Interfaces;

namespace MajiLedger.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    // Resolved from ClaimsPrincipal in WebAPI via IHttpContextAccessor when authenticated
    public string? UserId => "System";
    public string? Role => "Admin";
}
