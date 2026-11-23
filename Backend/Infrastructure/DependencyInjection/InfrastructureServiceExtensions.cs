using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MajiLedger.Infrastructure.DependencyInjection;

public static class InfrastructureServiceExtensions
{
    /// <summary>
    /// Registers Infrastructure services: EF Core (SQL Server), repositories, and external clients.
    /// The connection string is read from configuration — not hard-coded here.
    /// </summary>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("PropertyLedgerDb")
            ?? configuration.GetConnectionString("MajiLedgerDb")
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Database connection string ('PropertyLedgerDb' or 'MajiLedgerDb') is not configured. " +
                "Add it to appsettings.json or environment variables.");

        services.AddDbContext<MajiLedgerDbContext>(options =>
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null);
            }));

        services.AddScoped<IApplicationDbContext>(sp =>
            sp.GetRequiredService<MajiLedgerDbContext>());

        // Infrastructure & external services
        services.AddSingleton<IPasswordHasher, Security.PasswordHasher>();
        services.AddSingleton<IJwtTokenService, Security.JwtTokenService>();
        services.AddSingleton<IDateTime, Services.DateTimeService>();
        services.AddScoped<ICurrentUserService, Services.CurrentUserService>();
        services.AddScoped<IStsTokenService, Services.PlaceholderStsTokenService>();
        services.AddScoped<ISmsGatewayService, Services.PlaceholderSmsGatewayService>();
        services.AddScoped<IPaymentGatewayService, Services.PlaceholderPaymentGatewayService>();
        services.AddSingleton<IQrCodeGeneratorService, Services.QrCodeGeneratorService>();

        return services;
    }
}
