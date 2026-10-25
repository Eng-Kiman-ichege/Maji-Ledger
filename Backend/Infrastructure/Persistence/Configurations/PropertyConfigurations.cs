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
        b.Property(x => x.Description).HasMaxLength(500);
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
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasQueryFilter(x => !x.IsDeleted);

        b.HasIndex(x => new { x.BuildingId, x.UnitNumber })
         .IsUnique()
         .HasFilter("[DeletedAt] IS NULL")
         .HasDatabaseName("UIX_Apartments_BuildingId_UnitNumber_Active");

        b.HasIndex(x => x.BuildingId).HasDatabaseName("IX_Apartments_BuildingId");

        b.HasOne(x => x.Building)
         .WithMany(x => x.Apartments)
         .HasForeignKey(x => x.BuildingId)
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
        b.Property(x => x.FullName).HasMaxLength(200).IsRequired();
        b.Property(x => x.PhoneNumber).HasMaxLength(20).IsRequired();
        b.Property(x => x.Email).HasMaxLength(320);
        b.Property(x => x.NationalId).HasMaxLength(20);
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasIndex(x => x.PhoneNumber).HasDatabaseName("IX_Tenants_PhoneNumber");
    }
}

public class TenancyConfiguration : IEntityTypeConfiguration<Tenancy>
{
    public void Configure(EntityTypeBuilder<Tenancy> b)
    {
        b.ToTable("Tenancies");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(x => x.StartDate).IsRequired();
        b.Property(x => x.Notes).HasMaxLength(1000);
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.CreatedAt).IsRequired();

        // One active tenancy per apartment
        b.HasIndex(x => x.ApartmentId)
         .IsUnique()
         .HasFilter("[Status] = 'Active'")
         .HasDatabaseName("UIX_Tenancies_ApartmentId_Active");

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
