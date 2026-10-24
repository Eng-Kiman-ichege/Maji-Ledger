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
        var connectionString = configuration.GetConnectionString("MajiLedgerDb")
            ?? throw new InvalidOperationException(
                "Connection string 'MajiLedgerDb' is not configured. " +
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

        return services;
    }
}
