using MajiLedger.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MajiLedger.Infrastructure.Persistence.Configurations;

public class RentChargeConfiguration : IEntityTypeConfiguration<RentCharge>
{
    public void Configure(EntityTypeBuilder<RentCharge> b)
    {
        b.ToTable("RentCharges");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        b.Property(x => x.ChargeReference).HasMaxLength(50).IsRequired();
        b.Property(x => x.BillingPeriod).HasMaxLength(20).IsRequired();
        b.Property(x => x.Amount).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.AmountPaid).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(x => x.Description).HasMaxLength(500);
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.CancellationReason).HasMaxLength(500);
        b.Property(x => x.BillingDate).IsRequired();
        b.Property(x => x.DueDate).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        // Unique charge reference
        b.HasIndex(x => x.ChargeReference)
         .IsUnique()
         .HasDatabaseName("UIX_RentCharges_ChargeReference");

        // Fast lookup indexes
        b.HasIndex(x => new { x.TenancyId, x.BillingPeriod })
         .HasDatabaseName("IX_RentCharges_Tenancy_BillingPeriod");

        b.HasIndex(x => x.PropertyId).HasDatabaseName("IX_RentCharges_PropertyId");
        b.HasIndex(x => x.ApartmentId).HasDatabaseName("IX_RentCharges_ApartmentId");
        b.HasIndex(x => x.TenantId).HasDatabaseName("IX_RentCharges_TenantId");
        b.HasIndex(x => x.DueDate).HasDatabaseName("IX_RentCharges_DueDate");
        b.HasIndex(x => x.Status).HasDatabaseName("IX_RentCharges_Status");

        // Relationships
        b.HasOne(x => x.Tenancy)
         .WithMany()
         .HasForeignKey(x => x.TenancyId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Tenant)
         .WithMany()
         .HasForeignKey(x => x.TenantId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Property)
         .WithMany()
         .HasForeignKey(x => x.PropertyId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Apartment)
         .WithMany()
         .HasForeignKey(x => x.ApartmentId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasMany(x => x.Allocations)
         .WithOne(x => x.RentCharge)
         .HasForeignKey(x => x.RentChargeId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}

public class RentPaymentConfiguration : IEntityTypeConfiguration<RentPayment>
{
    public void Configure(EntityTypeBuilder<RentPayment> b)
    {
        b.ToTable("RentPayments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        b.Property(x => x.PaymentReference).HasMaxLength(50).IsRequired();
        b.Property(x => x.ReceiptNumber).HasMaxLength(50).IsRequired();
        b.Property(x => x.Amount).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.AmountAllocated).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.PaymentMethod).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(x => x.PaymentStatus).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(x => x.TransactionReference).HasMaxLength(100);
        b.Property(x => x.PayerName).HasMaxLength(200);
        b.Property(x => x.PayerPhoneNumber).HasMaxLength(50);
        b.Property(x => x.Notes).HasMaxLength(1000);
        b.Property(x => x.RecordedByUserId).HasMaxLength(200);
        b.Property(x => x.ReversalReason).HasMaxLength(500);
        b.Property(x => x.PaymentDate).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        // Unique indexes
        b.HasIndex(x => x.PaymentReference)
         .IsUnique()
         .HasDatabaseName("UIX_RentPayments_PaymentReference");

        b.HasIndex(x => x.ReceiptNumber)
         .IsUnique()
         .HasDatabaseName("UIX_RentPayments_ReceiptNumber");

        // Unique transaction reference for confirmed payments to prevent double recording
        b.HasIndex(x => x.TransactionReference)
         .IsUnique()
         .HasFilter("[TransactionReference] IS NOT NULL AND [PaymentStatus] = 'Confirmed'")
         .HasDatabaseName("UIX_RentPayments_TransactionReference_Confirmed");

        // Lookups
        b.HasIndex(x => x.PaymentDate).HasDatabaseName("IX_RentPayments_PaymentDate");
        b.HasIndex(x => x.PropertyId).HasDatabaseName("IX_RentPayments_PropertyId");
        b.HasIndex(x => x.ApartmentId).HasDatabaseName("IX_RentPayments_ApartmentId");
        b.HasIndex(x => x.TenantId).HasDatabaseName("IX_RentPayments_TenantId");
        b.HasIndex(x => x.TenancyId).HasDatabaseName("IX_RentPayments_TenancyId");
        b.HasIndex(x => x.PaymentStatus).HasDatabaseName("IX_RentPayments_PaymentStatus");

        // Relationships
        b.HasOne(x => x.Tenancy)
         .WithMany()
         .HasForeignKey(x => x.TenancyId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Tenant)
         .WithMany()
         .HasForeignKey(x => x.TenantId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Property)
         .WithMany()
         .HasForeignKey(x => x.PropertyId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Apartment)
         .WithMany()
         .HasForeignKey(x => x.ApartmentId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasMany(x => x.Allocations)
         .WithOne(x => x.RentPayment)
         .HasForeignKey(x => x.RentPaymentId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}

public class PaymentAllocationConfiguration : IEntityTypeConfiguration<PaymentAllocation>
{
    public void Configure(EntityTypeBuilder<PaymentAllocation> b)
    {
        b.ToTable("PaymentAllocations");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        b.Property(x => x.AllocatedAmount).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.AllocatedAt).IsRequired();
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.ReversalReason).HasMaxLength(500);
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasIndex(x => x.RentPaymentId).HasDatabaseName("IX_PaymentAllocations_RentPaymentId");
        b.HasIndex(x => x.RentChargeId).HasDatabaseName("IX_PaymentAllocations_RentChargeId");
    }
}

public class TenantCreditConfiguration : IEntityTypeConfiguration<TenantCredit>
{
    public void Configure(EntityTypeBuilder<TenantCredit> b)
    {
        b.ToTable("TenantCredits");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        b.Property(x => x.CreditReference).HasMaxLength(50).IsRequired();
        b.Property(x => x.OriginalAmount).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.RemainingCredit).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(x => x.Reason).HasMaxLength(250).IsRequired();
        b.Property(x => x.Notes).HasMaxLength(500);
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasIndex(x => x.CreditReference)
         .IsUnique()
         .HasDatabaseName("UIX_TenantCredits_CreditReference");

        b.HasIndex(x => x.TenantId).HasDatabaseName("IX_TenantCredits_TenantId");
        b.HasIndex(x => x.PropertyId).HasDatabaseName("IX_TenantCredits_PropertyId");
        b.HasIndex(x => x.Status).HasDatabaseName("IX_TenantCredits_Status");

        b.HasOne(x => x.Tenant)
         .WithMany()
         .HasForeignKey(x => x.TenantId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Tenancy)
         .WithMany()
         .HasForeignKey(x => x.TenancyId)
         .OnDelete(DeleteBehavior.Restrict)
         .IsRequired(false);

        b.HasOne(x => x.Property)
         .WithMany()
         .HasForeignKey(x => x.PropertyId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.SourcePayment)
         .WithMany()
         .HasForeignKey(x => x.SourcePaymentId)
         .OnDelete(DeleteBehavior.Restrict)
         .IsRequired(false);
    }
}
