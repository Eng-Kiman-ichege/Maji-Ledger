using MajiLedger.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MajiLedger.Infrastructure.Persistence.Configurations;

public class PaymentAttemptConfiguration : IEntityTypeConfiguration<PaymentAttempt>
{
    public void Configure(EntityTypeBuilder<PaymentAttempt> b)
    {
        b.ToTable("PaymentAttempts");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        b.Property(x => x.RequestedAmount).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.CustomerPhone).HasMaxLength(20).IsRequired();
        b.Property(x => x.Channel).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(x => x.ProviderCheckoutId).HasMaxLength(100);
        b.Property(x => x.FailureReason).HasMaxLength(500);
        b.Property(x => x.InitiatedAt).IsRequired();
        b.Property(x => x.ExpiresAt).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        // Partial unique index on provider checkout ID (non-null only)
        b.HasIndex(x => x.ProviderCheckoutId)
         .IsUnique()
         .HasFilter("[ProviderCheckoutId] IS NOT NULL")
         .HasDatabaseName("UIX_PaymentAttempts_ProviderCheckoutId");

        b.HasIndex(x => x.MeterId).HasDatabaseName("IX_PaymentAttempts_MeterId");
        b.HasIndex(x => x.Status).HasDatabaseName("IX_PaymentAttempts_Status");
        b.HasIndex(x => x.PaymentProviderConfigId).HasDatabaseName("IX_PaymentAttempts_PaymentProviderConfigId");

        b.HasOne(x => x.Meter)
         .WithMany(x => x.PaymentAttempts)
         .HasForeignKey(x => x.MeterId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.QrCodeRegistration)
         .WithMany(x => x.PaymentAttempts)
         .HasForeignKey(x => x.QrCodeRegistrationId)
         .OnDelete(DeleteBehavior.SetNull)
         .IsRequired(false);

        b.HasOne(x => x.PaymentProviderConfig)
         .WithMany(x => x.PaymentAttempts)
         .HasForeignKey(x => x.PaymentProviderConfigId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> b)
    {
        b.ToTable("Payments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        b.Property(x => x.AmountConfirmed).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.Currency).HasMaxLength(10).IsRequired().HasDefaultValue("KES");
        b.Property(x => x.ProviderRef).HasMaxLength(100).IsRequired();
        b.Property(x => x.PaidAt).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        // Globally unique provider reference — deduplication guard
        b.HasIndex(x => x.ProviderRef)
         .IsUnique()
         .HasDatabaseName("UIX_Payments_ProviderRef");

        b.HasIndex(x => x.PaymentAttemptId)
         .IsUnique()
         .HasDatabaseName("UIX_Payments_PaymentAttemptId");

        b.HasOne(x => x.PaymentAttempt)
         .WithOne(x => x.Payment)
         .HasForeignKey<Payment>(x => x.PaymentAttemptId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}

public class WaterPurchaseConfiguration : IEntityTypeConfiguration<WaterPurchase>
{
    public void Configure(EntityTypeBuilder<WaterPurchase> b)
    {
        b.ToTable("WaterPurchases");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        b.Property(x => x.UnitsCalculated).HasColumnType("decimal(10,4)").IsRequired();
        b.Property(x => x.AmountApplied).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        // One purchase per confirmed payment
        b.HasIndex(x => x.PaymentId).IsUnique().HasDatabaseName("UIX_WaterPurchases_PaymentId");
        b.HasIndex(x => x.MeterId).HasDatabaseName("IX_WaterPurchases_MeterId");
        b.HasIndex(x => x.TariffId).HasDatabaseName("IX_WaterPurchases_TariffId");

        b.HasOne(x => x.Payment)
         .WithOne(x => x.WaterPurchase)
         .HasForeignKey<WaterPurchase>(x => x.PaymentId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Meter)
         .WithMany(x => x.WaterPurchases)
         .HasForeignKey(x => x.MeterId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Tariff)
         .WithMany(x => x.WaterPurchases)
         .HasForeignKey(x => x.TariffId)
         .OnDelete(DeleteBehavior.Restrict)
         .IsRequired(false);
    }
}

public class WaterTokenConfiguration : IEntityTypeConfiguration<WaterToken>
{
    public void Configure(EntityTypeBuilder<WaterToken> b)
    {
        b.ToTable("WaterTokens");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        b.Property(x => x.StsToken).HasMaxLength(25).IsRequired();
        b.Property(x => x.StsRequestRef).HasMaxLength(100);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(x => x.IssuedAt).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        // STS token must be globally unique
        b.HasIndex(x => x.StsToken).IsUnique().HasDatabaseName("UIX_WaterTokens_StsToken");
        // One token per purchase
        b.HasIndex(x => x.WaterPurchaseId).IsUnique().HasDatabaseName("UIX_WaterTokens_WaterPurchaseId");

        b.HasOne(x => x.WaterPurchase)
         .WithOne(x => x.WaterToken)
         .HasForeignKey<WaterToken>(x => x.WaterPurchaseId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}

public class TokenGenerationAttemptConfiguration : IEntityTypeConfiguration<TokenGenerationAttempt>
{
    public void Configure(EntityTypeBuilder<TokenGenerationAttempt> b)
    {
        b.ToTable("TokenGenerationAttempts");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        b.Property(x => x.AttemptNumber).IsRequired();
        b.Property(x => x.StsRequestPayload).IsRequired();   // JSON — no length cap
        b.Property(x => x.Succeeded).IsRequired();
        b.Property(x => x.FailureReason).HasMaxLength(1000);
        b.Property(x => x.AttemptedAt).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasIndex(x => x.WaterPurchaseId).HasDatabaseName("IX_TokenGenerationAttempts_WaterPurchaseId");

        b.HasOne(x => x.WaterPurchase)
         .WithMany(x => x.TokenGenerationAttempts)
         .HasForeignKey(x => x.WaterPurchaseId)
         .OnDelete(DeleteBehavior.Cascade);
    }
}

public class SmsDeliveryRecordConfiguration : IEntityTypeConfiguration<SmsDeliveryRecord>
{
    public void Configure(EntityTypeBuilder<SmsDeliveryRecord> b)
    {
        b.ToTable("SmsDeliveryRecords");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        b.Property(x => x.RecipientPhone).HasMaxLength(20).IsRequired();
        b.Property(x => x.MessageBody).HasMaxLength(500).IsRequired();
        b.Property(x => x.GatewayRef).HasMaxLength(100);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(x => x.SentAt).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasIndex(x => x.WaterTokenId).HasDatabaseName("IX_SmsDeliveryRecords_WaterTokenId");
        b.HasIndex(x => x.GatewayRef)
         .HasFilter("[GatewayRef] IS NOT NULL")
         .HasDatabaseName("IX_SmsDeliveryRecords_GatewayRef");

        b.HasOne(x => x.WaterToken)
         .WithMany(x => x.SmsDeliveries)
         .HasForeignKey(x => x.WaterTokenId)
         .OnDelete(DeleteBehavior.Cascade);
    }
}

public class TransactionAuditLogConfiguration : IEntityTypeConfiguration<TransactionAuditLog>
{
    public void Configure(EntityTypeBuilder<TransactionAuditLog> b)
    {
        b.ToTable("TransactionAuditLogs");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        b.Property(x => x.EntityType).HasMaxLength(100).IsRequired();
        b.Property(x => x.EventType).HasMaxLength(100).IsRequired();
        b.Property(x => x.OldValue);   // JSON — no length cap
        b.Property(x => x.NewValue);   // JSON — no length cap
        b.Property(x => x.PerformedBy).HasMaxLength(200).IsRequired();
        b.Property(x => x.IpAddress).HasMaxLength(45);
        b.Property(x => x.OccurredAt).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        // No FK — polymorphic audit log so any entity can be referenced
        b.HasIndex(x => new { x.EntityType, x.EntityId }).HasDatabaseName("IX_TransactionAuditLogs_Entity");
        b.HasIndex(x => x.OccurredAt).HasDatabaseName("IX_TransactionAuditLogs_OccurredAt");

        // Immutable — no navigation properties by design
        b.ToTable(t => t.HasCheckConstraint("CK_TransactionAuditLogs_EntityType", "[EntityType] <> ''"));
    }
}
