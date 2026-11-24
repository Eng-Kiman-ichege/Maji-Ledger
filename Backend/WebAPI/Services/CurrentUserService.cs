using System.Security.Claims;
using MajiLedger.Application.Common.Interfaces;

namespace MajiLedger.WebAPI.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    public string? UserId =>
        User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User?.FindFirst("sub")?.Value;

    public string? Email =>
        User?.FindFirst(ClaimTypes.Email)?.Value
        ?? User?.FindFirst("email")?.Value;

    public string? Role =>
        User?.FindFirst(ClaimTypes.Role)?.Value
        ?? User?.FindFirst("role")?.Value;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public Guid? OwnerId
    {
        get
        {
            var val = User?.FindFirst("ownerId")?.Value;
            return Guid.TryParse(val, out var id) ? id : null;
        }
    }

    public Guid? TenantId
    {
        get
        {
            var val = User?.FindFirst("tenantId")?.Value;
            return Guid.TryParse(val, out var id) ? id : null;
        }
    }

    public IReadOnlyList<Guid> AuthorizedPropertyIds
    {
        get
        {
            var val = User?.FindFirst("propertyIds")?.Value;
            if (string.IsNullOrWhiteSpace(val)) return Array.Empty<Guid>();

            return val.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => Guid.TryParse(s, out var id) ? (Guid?)id : null)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .ToList();
        }
    }

    public IReadOnlyList<string> Permissions =>
        User?.FindAll("permission").Select(c => c.Value).Distinct().ToList()
        ?? (IReadOnlyList<string>)Array.Empty<string>();

    public IReadOnlyList<string> Modules =>
        User?.FindAll("module").Select(c => c.Value).Distinct().ToList()
        ?? (IReadOnlyList<string>)Array.Empty<string>();

    public bool IsInRole(string role) =>
        !string.IsNullOrWhiteSpace(role) && (User?.IsInRole(role) ?? false);

    public bool HasPermission(string permission) =>
        !string.IsNullOrWhiteSpace(permission) && Permissions.Contains(permission, StringComparer.OrdinalIgnoreCase);

    public bool HasModuleAccess(string module) =>
        !string.IsNullOrWhiteSpace(module) && Modules.Contains(module, StringComparer.OrdinalIgnoreCase);

    public bool HasPropertyAccess(Guid propertyId) =>
        IsInRole("Admin") || AuthorizedPropertyIds.Contains(propertyId);
}
