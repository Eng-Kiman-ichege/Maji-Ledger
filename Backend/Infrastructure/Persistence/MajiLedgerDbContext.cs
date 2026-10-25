using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Infrastructure.Persistence;

/// <summary>
/// EF Core DbContext for Maji Ledger. Implements IApplicationDbContext so the
/// Application layer never has a direct dependency on EF Core or SQL Server.
/// All entity type configurations are applied from the Configurations folder
/// via <see cref="ModelBuilder.ApplyConfigurationsFromAssembly"/>.
/// </summary>
public class MajiLedgerDbContext : DbContext, IApplicationDbContext
{
    public MajiLedgerDbContext(DbContextOptions<MajiLedgerDbContext> options) : base(options) { }

    // ── Authorization ─────────────────────────────────────────────────────────
    public DbSet<ApplicationUser>       ApplicationUsers       => Set<ApplicationUser>();
    public DbSet<PropertyAccess>        PropertyAccesses       => Set<PropertyAccess>();

    // ── Property Domain ───────────────────────────────────────────────────────
    public DbSet<Owner>                 Owners                 => Set<Owner>();
    public DbSet<Property>              Properties             => Set<Property>();
    public DbSet<PropertyOwnership>     PropertyOwnerships     => Set<PropertyOwnership>();
    public DbSet<Building>              Buildings              => Set<Building>();
    public DbSet<Apartment>             Apartments             => Set<Apartment>();
    public DbSet<Tenant>                Tenants                => Set<Tenant>();
    public DbSet<Tenancy>               Tenancies              => Set<Tenancy>();

    // ── Meter Domain ──────────────────────────────────────────────────────────
    public DbSet<Meter>                 Meters                 => Set<Meter>();
    public DbSet<MeterAssignment>       MeterAssignments       => Set<MeterAssignment>();
    public DbSet<SharedMeterBillingPoint> SharedMeterBillingPoints => Set<SharedMeterBillingPoint>();
    public DbSet<MeterReading>          MeterReadings          => Set<MeterReading>();

    // ── Tariff Domain ─────────────────────────────────────────────────────────
    public DbSet<WaterTariff>           WaterTariffs           => Set<WaterTariff>();
    public DbSet<TariffTier>            TariffTiers            => Set<TariffTier>();

    // ── QR & Payment Config ───────────────────────────────────────────────────
    public DbSet<PaymentProviderConfig> PaymentProviderConfigs => Set<PaymentProviderConfig>();
    public DbSet<QrCodeRegistration>    QrCodeRegistrations    => Set<QrCodeRegistration>();
    public DbSet<QrCodeAuditLog>        QrCodeAuditLogs        => Set<QrCodeAuditLog>();

    // ── Transaction Domain ────────────────────────────────────────────────────
    public DbSet<PaymentAttempt>        PaymentAttempts        => Set<PaymentAttempt>();
    public DbSet<Payment>               Payments               => Set<Payment>();
    public DbSet<WaterPurchase>         WaterPurchases         => Set<WaterPurchase>();
    public DbSet<WaterToken>            WaterTokens            => Set<WaterToken>();
    public DbSet<TokenGenerationAttempt> TokenGenerationAttempts => Set<TokenGenerationAttempt>();
    public DbSet<SmsDeliveryRecord>     SmsDeliveryRecords     => Set<SmsDeliveryRecord>();
    public DbSet<TransactionAuditLog>   TransactionAuditLogs   => Set<TransactionAuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Apply all IEntityTypeConfiguration<T> implementations in this assembly.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(MajiLedgerDbContext).Assembly);
    }
}
