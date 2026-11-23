namespace MajiLedger.Application.Common.Interfaces;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? Email { get; }
    string? Role { get; }
    bool IsAuthenticated { get; }
    Guid? OwnerId { get; }
    IReadOnlyList<Guid> AuthorizedPropertyIds { get; }
    IReadOnlyList<string> Permissions { get; }
    IReadOnlyList<string> Modules { get; }
    bool IsInRole(string role);
    bool HasPermission(string permission);
    bool HasModuleAccess(string module);
    bool HasPropertyAccess(Guid propertyId);
}
