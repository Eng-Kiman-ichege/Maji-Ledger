using System.Security.Claims;
using MajiLedger.Application.Common.Interfaces;

namespace MajiLedger.WebAPI.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public string? UserId =>
        httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value
        ?? "System";

    public string? Role =>
        httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value
        ?? httpContextAccessor.HttpContext?.User?.FindFirst("role")?.Value
        ?? "Admin";
}
