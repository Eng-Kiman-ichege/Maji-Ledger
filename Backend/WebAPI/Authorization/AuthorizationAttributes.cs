using Microsoft.AspNetCore.Authorization;

namespace MajiLedger.WebAPI.Authorization;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class HasPermissionAttribute(string permission) : AuthorizeAttribute(policy: permission)
{
    public string Permission { get; } = permission;
}

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class RequiresModuleAttribute(string module) : AuthorizeAttribute(policy: $"Module:{module}")
{
    public string Module { get; } = module;
}
