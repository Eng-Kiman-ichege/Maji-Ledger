using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MajiLedger.Infrastructure.Persistence.Configurations;

public class OwnerConfiguration : IEntityTypeConfiguration<Owner>
{
    public void Configure(EntityTypeBuilder<Owner> b)
    {
        b.ToTable("Owners");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.FullName).HasMaxLength(200).IsRequired();
        b.Property(x => x.PhoneNumber).HasMaxLength(20).IsRequired();
        b.Property(x => x.Email).HasMaxLength(320);
        b.Property(x => x.NationalId).HasMaxLength(20);
        b.Property(x => x.KraPin).HasMaxLength(20);
        b.Property(x => x.Address).HasMaxLength(500);
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasIndex(x => x.PhoneNumber).IsUnique().HasDatabaseName("IX_Owners_PhoneNumber");
    }
}

public class PropertyConfiguration : IEntityTypeConfiguration<Property>
{
    public void Configure(EntityTypeBuilder<Property> b)
    {
        b.ToTable("Properties");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.Name).HasMaxLength(200).IsRequired();
        b.Property(x => x.PropertyCode).HasMaxLength(50);
        b.Property(x => x.Type).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(x => x.PhysicalAddress).HasMaxLength(500);
        b.Property(x => x.County).HasMaxLength(100);
        b.Property(x => x.Town).HasMaxLength(100);
        b.Property(x => x.PostalCode).HasMaxLength(10);
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasQueryFilter(x => !x.IsDeleted); // Global soft-delete filter

        b.HasIndex(x => x.Name).HasDatabaseName("IX_Properties_Name");
        b.HasIndex(x => x.PropertyCode)
         .IsUnique()
         .HasFilter("[PropertyCode] IS NOT NULL")
         .HasDatabaseName("UIX_Properties_PropertyCode");
        b.HasIndex(x => new { x.County, x.Town }).HasDatabaseName("IX_Properties_County_Town");
    }
}

public class PropertyOwnershipConfiguration : IEntityTypeConfiguration<PropertyOwnership>
{
    public void Configure(EntityTypeBuilder<PropertyOwnership> b)
    {
        b.ToTable("PropertyOwnerships");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.Role).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.EffectiveFrom).IsRequired();

        // Filtered unique: only one PrimaryOwner per property at a time
        b.HasIndex(x => new { x.PropertyId, x.Role })
         .IsUnique()
         .HasFilter("[Role] = 'PrimaryOwner' AND [EffectiveTo] IS NULL")
         .HasDatabaseName("UIX_PropertyOwnerships_PrimaryOwner_Active");

        b.HasIndex(x => x.PropertyId)
         .HasFilter("[EffectiveTo] IS NULL")
         .HasDatabaseName("IX_PropertyOwnerships_PropertyId_Active");

        b.HasOne(x => x.Owner)
         .WithMany(x => x.Ownerships)
         .HasForeignKey(x => x.OwnerId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Property)
         .WithMany(x => x.Ownerships)
         .HasForeignKey(x => x.PropertyId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}

public class BuildingConfiguration : IEntityTypeConfiguration<Building>
{
    public void Configure(EntityTypeBuilder<Building> b)
    {
        b.ToTable("Buildings");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.BuildingCode).HasMaxLength(50);
        b.Property(x => x.Description).HasMaxLength(500);
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasQueryFilter(x => !x.IsDeleted);

        // Unique building name within a property (active only)
        b.HasIndex(x => new { x.PropertyId, x.Name })
         .IsUnique()
         .HasFilter("[DeletedAt] IS NULL")
         .HasDatabaseName("UIX_Buildings_PropertyId_Name_Active");

        b.HasIndex(x => x.PropertyId).HasDatabaseName("IX_Buildings_PropertyId");

        b.HasOne(x => x.Property)
         .WithMany(x => x.Buildings)
         .HasForeignKey(x => x.PropertyId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}

public class UnitTypeConfiguration : IEntityTypeConfiguration<UnitType>
{
    public void Configure(EntityTypeBuilder<UnitType> b)
    {
        b.ToTable("UnitTypes");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.Description).HasMaxLength(500);
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.SortOrder).HasDefaultValue(0);
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasIndex(x => x.Name).IsUnique().HasDatabaseName("UIX_UnitTypes_Name");
    }
}

public class ApartmentConfiguration : IEntityTypeConfiguration<Apartment>
{
    public void Configure(EntityTypeBuilder<Apartment> b)
    {
        b.ToTable("Apartments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.UnitNumber).HasMaxLength(20).IsRequired();
        b.Property(x => x.Floor).HasMaxLength(10);
        b.Property(x => x.Description).HasMaxLength(500);
        b.Property(x => x.MonthlyRent).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
        b.Property(x => x.IsOccupied).HasDefaultValue(false);
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasQueryFilter(x => !x.IsDeleted);

        b.HasIndex(x => new { x.BuildingId, x.UnitNumber })
         .IsUnique()
         .HasFilter("[DeletedAt] IS NULL")
         .HasDatabaseName("UIX_Apartments_BuildingId_UnitNumber_Active");

        b.HasIndex(x => x.BuildingId).HasDatabaseName("IX_Apartments_BuildingId");
        b.HasIndex(x => x.PropertyId).HasDatabaseName("IX_Apartments_PropertyId");
        b.HasIndex(x => x.UnitTypeId).HasDatabaseName("IX_Apartments_UnitTypeId");

        b.HasOne(x => x.Building)
         .WithMany(x => x.Apartments)
         .HasForeignKey(x => x.BuildingId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Property)
         .WithMany()
         .HasForeignKey(x => x.PropertyId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.UnitType)
         .WithMany(x => x.Apartments)
         .HasForeignKey(x => x.UnitTypeId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> b)
    {
        b.ToTable("Tenants");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.FirstName).HasMaxLength(100);
        b.Property(x => x.MiddleName).HasMaxLength(100);
        b.Property(x => x.LastName).HasMaxLength(100);
        b.Property(x => x.FullName).HasMaxLength(200).IsRequired();
        b.Property(x => x.PhoneNumber).HasMaxLength(20).IsRequired();
        b.Property(x => x.AlternativePhoneNumber).HasMaxLength(20);
        b.Property(x => x.Email).HasMaxLength(320);
        b.Property(x => x.NationalId).HasMaxLength(20);
        b.Property(x => x.Address).HasMaxLength(500);
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasIndex(x => x.PhoneNumber).HasDatabaseName("IX_Tenants_PhoneNumber");
        b.HasIndex(x => x.NationalId).HasDatabaseName("IX_Tenants_NationalId");
        b.HasIndex(x => x.UserId).HasDatabaseName("IX_Tenants_UserId");

        b.HasOne(x => x.User)
         .WithMany()
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.SetNull)
         .IsRequired(false);
    }
}

public class TenancyConfiguration : IEntityTypeConfiguration<Tenancy>
{
    public void Configure(EntityTypeBuilder<Tenancy> b)
    {
        b.ToTable("Tenancies");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.TenancyReference).HasMaxLength(50);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(x => x.StartDate).IsRequired();
        b.Property(x => x.MonthlyRent).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
        b.Property(x => x.SecurityDeposit).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
        b.Property(x => x.RentPaymentDueDay).HasDefaultValue(1);
        b.Property(x => x.BillingFrequency).HasConversion<string>().HasMaxLength(20).HasDefaultValue(BillingFrequency.Monthly);
        b.Property(x => x.AgreementNotes).HasMaxLength(1000);
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.CreatedAt).IsRequired();

        // One active tenancy per apartment
        b.HasIndex(x => x.ApartmentId)
         .IsUnique()
         .HasFilter("[Status] = 'Active'")
         .HasDatabaseName("UIX_Tenancies_ApartmentId_Active");

        b.HasIndex(x => x.TenancyReference)
         .IsUnique()
         .HasFilter("[TenancyReference] IS NOT NULL")
         .HasDatabaseName("UIX_Tenancies_TenancyReference");

        b.HasOne(x => x.Tenant)
         .WithMany(x => x.Tenancies)
         .HasForeignKey(x => x.TenantId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Apartment)
         .WithMany(x => x.Tenancies)
         .HasForeignKey(x => x.ApartmentId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}

public class TenancyTenantConfiguration : IEntityTypeConfiguration<TenancyTenant>
{
    public void Configure(EntityTypeBuilder<TenancyTenant> b)
    {
        b.ToTable("TenancyTenants");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.IsPrimaryTenant).HasDefaultValue(false);
        b.Property(x => x.JoinedAt).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        // Filtered unique: only one primary tenant per tenancy where occupant has not left
        b.HasIndex(x => new { x.TenancyId, x.IsPrimaryTenant })
         .IsUnique()
         .HasFilter("[IsPrimaryTenant] = 1 AND [LeftAt] IS NULL")
         .HasDatabaseName("UIX_TenancyTenants_PrimaryTenant_Active");

        // Filtered unique: prevent duplicate active assignment of same tenant to same tenancy
        b.HasIndex(x => new { x.TenancyId, x.TenantId })
         .IsUnique()
         .HasFilter("[LeftAt] IS NULL")
         .HasDatabaseName("UIX_TenancyTenants_Tenancy_Tenant_Active");

        b.HasOne(x => x.Tenancy)
         .WithMany(x => x.Tenants)
         .HasForeignKey(x => x.TenancyId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Tenant)
         .WithMany(x => x.TenancyAssignments)
         .HasForeignKey(x => x.TenantId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}
