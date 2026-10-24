using MajiLedger.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Common.Interfaces;

/// <summary>
/// Defines the EF Core DbContext surface exposed to the Application layer.
/// The Application layer never references EF Core directly — only this abstraction.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<Property> Properties { get; }
    DbSet<Building> Buildings { get; }
    DbSet<Apartment> Apartments { get; }
    DbSet<Owner> Owners { get; }
    DbSet<PropertyOwnership> PropertyOwnerships { get; }
    DbSet<Tenant> Tenants { get; }
    DbSet<Tenancy> Tenancies { get; }
    DbSet<Meter> Meters { get; }
    DbSet<MeterAssignment> MeterAssignments { get; }
    DbSet<QrCodeRegistration> QrCodeRegistrations { get; }
    DbSet<WaterTransaction> WaterTransactions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
