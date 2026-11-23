using MajiLedger.Application.Common.Interfaces;

namespace MajiLedger.Infrastructure.Services;

/// <summary>
/// Infrastructure fallback current user service used when outside HTTP request context (e.g. background tasks).
/// WebAPI registers its own HttpContext-aware implementation.
/// </summary>
public class CurrentUserService : ICurrentUserService
{
    public string? UserId => "System";
    public string? Email => "system@propertyledger.local";
    public string? Role => "Admin";
    public bool IsAuthenticated => true;
    public Guid? OwnerId => null;
    public IReadOnlyList<Guid> AuthorizedPropertyIds => Array.Empty<Guid>();
    public IReadOnlyList<string> Permissions => Array.Empty<string>();
    public IReadOnlyList<string> Modules => Array.Empty<string>();
    public bool IsInRole(string role) => string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase);
    public bool HasPermission(string permission) => true;
    public bool HasModuleAccess(string module) => true;
    public bool HasPropertyAccess(Guid propertyId) => true;
}
