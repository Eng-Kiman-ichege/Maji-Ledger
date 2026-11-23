using Microsoft.AspNetCore.Authorization;

namespace MajiLedger.WebAPI.Authorization;

public class ModuleAccessRequirement(string moduleName) : IAuthorizationRequirement
{
    public string ModuleName { get; } = moduleName;
}

public class ModuleAccessAuthorizationHandler : AuthorizationHandler<ModuleAccessRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ModuleAccessRequirement requirement)
    {
        var hasModule = context.User.FindAll("module")
            .Any(c => string.Equals(c.Value, requirement.ModuleName, StringComparison.OrdinalIgnoreCase));

        if (hasModule || context.User.IsInRole("Admin"))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
