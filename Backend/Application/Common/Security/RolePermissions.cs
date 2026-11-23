using MajiLedger.Domain.Enums;

namespace MajiLedger.Application.Common.Security;

public static class RolePermissions
{
    public static IReadOnlyList<string> GetPermissionsForRole(UserRole role) => role switch
    {
        UserRole.Admin =>
        [
            Permissions.Properties.View,
            Permissions.Properties.Manage,
            Permissions.Units.View,
            Permissions.Units.Manage,
            Permissions.Tenancies.View,
            Permissions.Tenancies.Manage,
            Permissions.Rent.View,
            Permissions.Rent.Manage,
            Permissions.Water.View,
            Permissions.Water.Manage,
            Permissions.Users.View,
            Permissions.Users.Manage,
            Permissions.Audit.View
        ],
        UserRole.Owner =>
        [
            Permissions.Properties.View,
            Permissions.Units.View,
            Permissions.Tenancies.View,
            Permissions.Rent.View,
            Permissions.Rent.Manage,
            Permissions.Water.View,
            Permissions.Water.Manage
        ],
        UserRole.Manager =>
        [
            Permissions.Properties.View,
            Permissions.Units.View,
            Permissions.Units.Manage,
            Permissions.Tenancies.View,
            Permissions.Tenancies.Manage,
            Permissions.Rent.View,
            Permissions.Water.View
        ],
        UserRole.Staff =>
        [
            Permissions.Properties.View,
            Permissions.Units.View,
            Permissions.Water.View
        ],
        UserRole.FinanceOfficer =>
        [
            Permissions.Properties.View,
            Permissions.Units.View,
            Permissions.Rent.View,
            Permissions.Rent.Manage,
            Permissions.Water.View,
            Permissions.Water.Manage
        ],
        UserRole.Tenant =>
        [
            Permissions.Tenancies.View,
            Permissions.Rent.View,
            Permissions.Water.View
        ],
        _ => Array.Empty<string>()
    };

    public static IReadOnlyList<string> GetModulesForRole(UserRole role) => role switch
    {
        UserRole.Admin => [AppModules.PlatformAdmin, AppModules.PropertyManagement, AppModules.WaterLedger],
        UserRole.Owner => [AppModules.PropertyManagement, AppModules.WaterLedger],
        UserRole.Manager => [AppModules.PropertyManagement, AppModules.WaterLedger],
        UserRole.Staff => [AppModules.PropertyManagement, AppModules.WaterLedger],
        UserRole.FinanceOfficer => [AppModules.PropertyManagement, AppModules.WaterLedger],
        UserRole.Tenant => [AppModules.PropertyManagement, AppModules.WaterLedger],
        _ => Array.Empty<string>()
    };
}
