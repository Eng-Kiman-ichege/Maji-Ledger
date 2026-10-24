using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Infrastructure.Persistence;

/// <summary>
/// EF Core DbContext for Maji Ledger. Implements IApplicationDbContext so the
/// Application layer never has a direct dependency on EF Core or SQL Server.
/// </summary>
public class MajiLedgerDbContext : DbContext, IApplicationDbContext
{
    public MajiLedgerDbContext(DbContextOptions<MajiLedgerDbContext> options) : base(options) { }

    public DbSet<Property> Properties => Set<Property>();
    public DbSet<Building> Buildings => Set<Building>();
    public DbSet<Apartment> Apartments => Set<Apartment>();
    public DbSet<Owner> Owners => Set<Owner>();
    public DbSet<PropertyOwnership> PropertyOwnerships => Set<PropertyOwnership>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Tenancy> Tenancies => Set<Tenancy>();
    public DbSet<Meter> Meters => Set<Meter>();
    public DbSet<MeterAssignment> MeterAssignments => Set<MeterAssignment>();
    public DbSet<QrCodeRegistration> QrCodeRegistrations => Set<QrCodeRegistration>();
    public DbSet<WaterTransaction> WaterTransactions => Set<WaterTransaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // EF entity configurations are applied from the Configurations folder.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(MajiLedgerDbContext).Assembly);
    }
}
