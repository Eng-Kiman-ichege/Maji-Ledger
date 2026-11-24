using System.Reflection;
using FluentAssertions;
using MajiLedger.WebAPI.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace MajiLedger.Tests.Foundation;

public class SecurityAttributesAndControllerProtectionTests
{
    [Theory]
    [InlineData(typeof(PropertiesController))]
    [InlineData(typeof(MetersController))]
    [InlineData(typeof(TenantsController))]
    [InlineData(typeof(TokensController))]
    [InlineData(typeof(TariffsController))]
    [InlineData(typeof(OwnersController))]
    [InlineData(typeof(UsersController))]
    [InlineData(typeof(PaymentConfigsController))]
    [InlineData(typeof(DashboardController))]
    [InlineData(typeof(PaymentsController))]
    [InlineData(typeof(QrCodesController))]
    public void SensitiveControllers_MustHaveAuthorizeAttributeAtClassLevel(Type controllerType)
    {
        var authorizeAttribute = controllerType.GetCustomAttributes<AuthorizeAttribute>().FirstOrDefault();
        authorizeAttribute.Should().NotBeNull(
            $"Controller {controllerType.Name} exposes sensitive data or state-changing operations and must be protected with [Authorize]");
    }

    [Theory]
    [InlineData(typeof(UsersController))]
    [InlineData(typeof(PaymentConfigsController))]
    public void AdministrativeControllers_MustRequireAdminRole(Type controllerType)
    {
        var authorizeAttribute = controllerType.GetCustomAttributes<AuthorizeAttribute>().FirstOrDefault();
        authorizeAttribute.Should().NotBeNull();
        authorizeAttribute!.Roles.Should().Contain("Admin");
    }

    [Fact]
    public void PublicEndpoints_MustBeExplicitlyMarkedWithAllowAnonymous()
    {
        // Login must allow anonymous
        var loginMethod = typeof(AuthController).GetMethod(nameof(AuthController.Login));
        loginMethod.Should().NotBeNull();
        loginMethod!.GetCustomAttribute<AllowAnonymousAttribute>().Should().NotBeNull();

        // Health check must allow anonymous
        var healthClass = typeof(HealthController).GetCustomAttribute<AllowAnonymousAttribute>();
        healthClass.Should().NotBeNull();

        // Customer Scan-to-Pay landing must allow anonymous
        var scanMethod = typeof(PaymentsController).GetMethod(nameof(PaymentsController.GetScanToPayDetails));
        scanMethod.Should().NotBeNull();
        scanMethod!.GetCustomAttribute<AllowAnonymousAttribute>().Should().NotBeNull();
    }
}
