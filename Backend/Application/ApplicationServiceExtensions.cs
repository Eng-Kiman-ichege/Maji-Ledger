using FluentValidation;
using MajiLedger.Application.Common.Behaviours;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace MajiLedger.Application;

/// <summary>
/// Extension method to register all Application layer services.
/// Call from Program.cs or Infrastructure layer DI registration.
/// </summary>
public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(ApplicationServiceExtensions).Assembly;

        // Register all MediatR handlers from this assembly
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));
        });

        // Register all FluentValidation validators from this assembly
        services.AddValidatorsFromAssembly(assembly);

        return services;
    }
}
