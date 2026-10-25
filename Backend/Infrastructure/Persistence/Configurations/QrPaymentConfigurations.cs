using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MajiLedger.Infrastructure.Persistence.Configurations;

public class PaymentProviderConfigConfiguration : IEntityTypeConfiguration<PaymentProviderConfig>
{
    public void Configure(EntityTypeBuilder<PaymentProviderConfig> b)
    {
        b.ToTable("PaymentProviderConfigs");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.ProviderType).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(x => x.BusinessShortCode).HasMaxLength(20).IsRequired();
        b.Property(x => x.DisplayName).HasMaxLength(100).IsRequired();
        b.Property(x => x.EnvironmentType).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasIndex(x => new { x.PropertyId, x.ProviderType, x.BusinessShortCode })
         .IsUnique()
         .HasFilter("[IsActive] = 1")
         .HasDatabaseName("UIX_PaymentProviderConfigs_Property_Provider_Active");

        b.HasIndex(x => x.PropertyId).HasDatabaseName("IX_PaymentProviderConfigs_PropertyId");

        b.HasOne(x => x.Property)
         .WithMany(x => x.PaymentProviderConfigs)
         .HasForeignKey(x => x.PropertyId)
         .OnDelete(DeleteBehavior.Restrict)
         .IsRequired(false);
    }
}

public class QrCodeRegistrationConfiguration : IEntityTypeConfiguration<QrCodeRegistration>
{
    public void Configure(EntityTypeBuilder<QrCodeRegistration> b)
    {
        b.ToTable("QrCodeRegistrations");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.PublicToken).HasMaxLength(64).IsRequired();
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(x => x.RevokedReason).HasMaxLength(500);
        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.CreatedAt).IsRequired();

        // Global unique on public token — the only thing in the QR sticker URL
        b.HasIndex(x => x.PublicToken)
         .IsUnique()
         .HasDatabaseName("UIX_QrCodeRegistrations_PublicToken");

        // Only one ACTIVE QR registration per meter at a time
        b.HasIndex(x => x.MeterId)
         .IsUnique()
         .HasFilter("[Status] = 'Active'")
         .HasDatabaseName("UIX_QrCodeRegistrations_MeterId_Active");

        b.HasOne(x => x.Meter)
         .WithOne(x => x.ActiveQrCode)
         .HasForeignKey<QrCodeRegistration>(x => x.MeterId)
         .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.PaymentProviderConfig)
         .WithMany(x => x.QrCodeRegistrations)
         .HasForeignKey(x => x.PaymentProviderConfigId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}

public class QrCodeAuditLogConfiguration : IEntityTypeConfiguration<QrCodeAuditLog>
{
    public void Configure(EntityTypeBuilder<QrCodeAuditLog> b)
    {
        b.ToTable("QrCodeAuditLogs");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.EventType).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(x => x.PerformedBy).HasMaxLength(200).IsRequired();
        b.Property(x => x.Notes).HasMaxLength(1000);
        b.Property(x => x.OccurredAt).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasIndex(x => x.QrCodeRegistrationId).HasDatabaseName("IX_QrCodeAuditLogs_RegistrationId");

        b.HasOne(x => x.QrCodeRegistration)
         .WithMany(x => x.AuditLogs)
         .HasForeignKey(x => x.QrCodeRegistrationId)
         .OnDelete(DeleteBehavior.Cascade);
    }
}
