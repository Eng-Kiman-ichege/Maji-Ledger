namespace MajiLedger.Application.Common.Security;

public static class AppModules
{
    public const string PropertyManagement = "PropertyManagement";
    public const string WaterLedger = "WaterLedger";
    public const string PlatformAdmin = "PlatformAdmin";

    public static readonly IReadOnlyList<string> All = [PropertyManagement, WaterLedger, PlatformAdmin];
}
