using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MajiLedger.Infrastructure.Persistence.Configurations;

public class MeterConfiguration : IEntityTypeConfiguration<Meter>
{
    public void Configure(EntityTypeBuilder<Meter> b)
    {
        b.ToTable("Meters");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.MeterNumber).HasMaxLength(50).IsRequired();
        b.Property(x => x.SerialNumber).HasMaxLength(100);
        b.Property(x => x.Manufacturer).HasMaxLength(100);
        b.Property(x => x.Model).HasMaxLength(100);
        b.Property(x => x.Type).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(x => x.IntegrationType).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(x => x.LastReading).HasColumnType("decimal(18,4)");
        b.Property(x => x.Notes).HasMaxLength(500);
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.CreatedAt).IsRequired();

        // MaskedIdentifier and ActiveQrCode are computed — not stored
        b.Ignore(x => x.MaskedIdentifier);
        b.Ignore(x => x.ActiveQrCode);

        b.HasIndex(x => x.MeterNumber).IsUnique().HasDatabaseName("IX_Meters_MeterNumber");
        b.HasIndex(x => x.CurrentApartmentId).HasDatabaseName("IX_Meters_CurrentApartmentId");

        b.HasOne(x => x.CurrentApartment)
         .WithMany()
         .HasForeignKey(x => x.CurrentApartmentId)
         .OnDelete(DeleteBehavior.SetNull)
         .IsRequired(false);

        b.HasOne(x => x.Tariff)
         .WithMany(x => x.Meters)
         .HasForeignKey(x => x.TariffId)
         .OnDelete(DeleteBehavior.SetNull)
         .IsRequired(false);
    }
}

public class MeterAssignmentConfiguration : IEntityTypeConfiguration<MeterAssignment>
{
    public void Configure(EntityTypeBuilder<MeterAssignment> b)
    {
        b.ToTable("MeterAssignments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.AssignedBy).HasMaxLength(200);
        b.Property(x => x.AssignedAt).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        // Filtered unique: one active assignment per meter
        b.HasIndex(x => x.MeterId)
         .IsUnique()
         .HasFilter("[UnassignedAt] IS NULL")
         .HasDatabaseName("UIX_MeterAssignments_MeterId_Active");

        b.HasIndex(x => x.ApartmentId).HasDatabaseName("IX_MeterAssignments_ApartmentId");

        b.HasOne(x => x.Meter)
         .WithMany(x => x.Assignments)
         .HasForeignKey(x => x.MeterId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Apartment)
         .WithMany(x => x.MeterAssignments)
         .HasForeignKey(x => x.ApartmentId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}

public class SharedMeterBillingPointConfiguration : IEntityTypeConfiguration<SharedMeterBillingPoint>
{
    public void Configure(EntityTypeBuilder<SharedMeterBillingPoint> b)
    {
        b.ToTable("SharedMeterBillingPoints");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.AllocationFraction).HasColumnType("decimal(5,4)").IsRequired();
        b.Property(x => x.Notes).HasMaxLength(500);
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.EffectiveFrom).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasIndex(x => new { x.MeterId, x.ApartmentId })
         .HasFilter("[EffectiveTo] IS NULL")
         .HasDatabaseName("IX_SharedMeterBillingPoints_MeterId_Active");

        b.HasOne(x => x.Meter)
         .WithMany(x => x.SharedBillingPoints)
         .HasForeignKey(x => x.MeterId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Apartment)
         .WithMany(x => x.SharedBillingPoints)
         .HasForeignKey(x => x.ApartmentId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}

public class MeterReadingConfiguration : IEntityTypeConfiguration<MeterReading>
{
    public void Configure(EntityTypeBuilder<MeterReading> b)
    {
        b.ToTable("MeterReadings");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.ReadingValue).HasColumnType("decimal(12,3)").IsRequired();
        b.Property(x => x.Source).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(x => x.RecordedBy).HasMaxLength(200);
        b.Property(x => x.ReadAt).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasIndex(x => new { x.MeterId, x.ReadAt }).HasDatabaseName("IX_MeterReadings_MeterId_ReadAt");

        b.HasOne(x => x.Meter)
         .WithMany(x => x.Readings)
         .HasForeignKey(x => x.MeterId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}

public class WaterTariffConfiguration : IEntityTypeConfiguration<WaterTariff>
{
    public void Configure(EntityTypeBuilder<WaterTariff> b)
    {
        b.ToTable("WaterTariffs");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.Description).HasMaxLength(500);
        b.Property(x => x.BillingCycle).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(x => x.BaseCharge).HasColumnType("decimal(10,2)").IsRequired();
        b.Property(x => x.UnitRate).HasColumnType("decimal(10,4)").IsRequired();
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.EffectiveFrom).IsRequired();
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasIndex(x => x.PropertyId).HasDatabaseName("IX_WaterTariffs_PropertyId");
        b.HasIndex(x => x.IsActive)
         .HasFilter("[IsActive] = 1")
         .HasDatabaseName("IX_WaterTariffs_Active");

        b.HasOne(x => x.Property)
         .WithMany(x => x.Tariffs)
         .HasForeignKey(x => x.PropertyId)
         .OnDelete(DeleteBehavior.SetNull)
         .IsRequired(false);
    }
}

public class TariffTierConfiguration : IEntityTypeConfiguration<TariffTier>
{
    public void Configure(EntityTypeBuilder<TariffTier> b)
    {
        b.ToTable("TariffTiers");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.FromUnits).HasColumnType("decimal(10,3)").IsRequired();
        b.Property(x => x.ToUnits).HasColumnType("decimal(10,3)");
        b.Property(x => x.RatePerUnit).HasColumnType("decimal(10,4)").IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasIndex(x => new { x.TariffId, x.TierOrder })
         .IsUnique()
         .HasDatabaseName("UIX_TariffTiers_TariffId_TierOrder");

        b.HasOne(x => x.Tariff)
         .WithMany(x => x.Tiers)
         .HasForeignKey(x => x.TariffId)
         .OnDelete(DeleteBehavior.Cascade);
    }
}


public class WaterTransactionConfiguration : IEntityTypeConfiguration<WaterTransaction>
{
    public void Configure(EntityTypeBuilder<WaterTransaction> b)
    {
        b.ToTable("WaterTransactions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        b.Property(x => x.TransactionReference).HasMaxLength(50).IsRequired();
        b.Property(x => x.ExternalTransactionReference).HasMaxLength(100);
        b.Property(x => x.PhoneNumber).HasMaxLength(30).IsRequired();
        b.Property(x => x.Amount).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.UnitsPurchased).HasColumnType("decimal(18,4)").IsRequired();
        b.Property(x => x.UnitPrice).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.PaymentMethod).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(x => x.PaymentStatus).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(x => x.TokenStatus).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(x => x.TokenValue).HasMaxLength(100);
        b.Property(x => x.FailureReason).HasMaxLength(500);
        b.Property(x => x.Notes).HasMaxLength(500);
        b.Property(x => x.TransactionDate).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        // Unique Transaction Reference
        b.HasIndex(x => x.TransactionReference)
         .IsUnique()
         .HasDatabaseName("UIX_WaterTransactions_TransactionReference");

        // Filtered unique external reference for confirmed payments
        b.HasIndex(x => x.ExternalTransactionReference)
         .IsUnique()
         .HasFilter("[ExternalTransactionReference] IS NOT NULL AND [PaymentStatus] = 'Confirmed'")
         .HasDatabaseName("UIX_WaterTransactions_ExternalRef_Confirmed");

        // Fast lookup indexes
        b.HasIndex(x => x.PropertyId).HasDatabaseName("IX_WaterTransactions_PropertyId");
        b.HasIndex(x => x.UnitId).HasDatabaseName("IX_WaterTransactions_UnitId");
        b.HasIndex(x => x.WaterMeterId).HasDatabaseName("IX_WaterTransactions_WaterMeterId");
        b.HasIndex(x => x.TransactionDate).HasDatabaseName("IX_WaterTransactions_TransactionDate");
        b.HasIndex(x => x.PaymentStatus).HasDatabaseName("IX_WaterTransactions_PaymentStatus");
        b.HasIndex(x => x.TokenStatus).HasDatabaseName("IX_WaterTransactions_TokenStatus");

        // Relationships
        b.HasOne(x => x.Property)
         .WithMany()
         .HasForeignKey(x => x.PropertyId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Unit)
         .WithMany()
         .HasForeignKey(x => x.UnitId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.WaterMeter)
         .WithMany()
         .HasForeignKey(x => x.WaterMeterId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Tenant)
         .WithMany()
         .HasForeignKey(x => x.TenantId)
         .OnDelete(DeleteBehavior.Restrict)
         .IsRequired(false);
    }
}

public class WaterReadingConfiguration : IEntityTypeConfiguration<WaterReading>
{
    public void Configure(EntityTypeBuilder<WaterReading> b)
    {
        b.ToTable("WaterReadings");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        b.Property(x => x.PreviousReading).HasColumnType("decimal(18,4)").IsRequired();
        b.Property(x => x.CurrentReading).HasColumnType("decimal(18,4)").IsRequired();
        b.Property(x => x.Consumption).HasColumnType("decimal(18,4)").IsRequired();
        b.Property(x => x.ReadingSource).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(x => x.RecordedByUserId).HasMaxLength(200);
        b.Property(x => x.Notes).HasMaxLength(500);
        b.Property(x => x.ReadingDate).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasIndex(x => x.WaterMeterId).HasDatabaseName("IX_WaterReadings_WaterMeterId");
        b.HasIndex(x => x.ReadingDate).HasDatabaseName("IX_WaterReadings_ReadingDate");

        b.HasOne(x => x.WaterMeter)
         .WithMany()
         .HasForeignKey(x => x.WaterMeterId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}
