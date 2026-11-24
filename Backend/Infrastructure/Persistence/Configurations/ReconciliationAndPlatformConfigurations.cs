using MajiLedger.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MajiLedger.Infrastructure.Persistence.Configurations;

public class ReconciliationAndPlatformConfigurations :
    IEntityTypeConfiguration<ReconciliationSession>,
    IEntityTypeConfiguration<ReconciliationDiscrepancy>,
    IEntityTypeConfiguration<SystemSetting>
{
    public void Configure(EntityTypeBuilder<ReconciliationSession> b)
    {
        b.ToTable("ReconciliationSessions");
        b.HasKey(x => x.Id);

        b.Property(x => x.LedgerType).HasConversion<int>().IsRequired();
        b.Property(x => x.Status).HasConversion<int>().IsRequired();

        b.Property(x => x.TotalInternalAmount).HasColumnType("decimal(18,2)");
        b.Property(x => x.TotalExternalAmount).HasColumnType("decimal(18,2)");
        b.Property(x => x.DiscrepancyAmount).HasColumnType("decimal(18,2)");

        b.Property(x => x.ReconciledBy).HasMaxLength(200).IsRequired();
        b.Property(x => x.Notes).HasMaxLength(2000);

        b.HasOne(x => x.Property)
            .WithMany()
            .HasForeignKey(x => x.PropertyId)
            .OnDelete(DeleteBehavior.SetNull);

        b.HasMany(x => x.Discrepancies)
            .WithOne(x => x.Session)
            .HasForeignKey(x => x.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(x => x.PropertyId);
        b.HasIndex(x => x.Status);
        b.HasIndex(x => x.CreatedAt);
    }

    public void Configure(EntityTypeBuilder<ReconciliationDiscrepancy> b)
    {
        b.ToTable("ReconciliationDiscrepancies");
        b.HasKey(x => x.Id);

        b.Property(x => x.TransactionReference).HasMaxLength(150).IsRequired();
        b.Property(x => x.InternalAmount).HasColumnType("decimal(18,2)");
        b.Property(x => x.ExternalAmount).HasColumnType("decimal(18,2)");
        b.Property(x => x.DiscrepancyReason).HasMaxLength(500).IsRequired();
        b.Property(x => x.ResolutionNotes).HasMaxLength(1000);
        b.Property(x => x.ResolvedBy).HasMaxLength(200);

        b.Property(x => x.Status).HasConversion<int>().IsRequired();

        b.HasIndex(x => x.SessionId);
        b.HasIndex(x => x.TransactionReference);
        b.HasIndex(x => x.Status);
    }

    public void Configure(EntityTypeBuilder<SystemSetting> b)
    {
        b.ToTable("SystemSettings");
        b.HasKey(x => x.Id);

        b.Property(x => x.Key).HasMaxLength(100).IsRequired();
        b.Property(x => x.Value).HasMaxLength(4000).IsRequired();
        b.Property(x => x.Description).HasMaxLength(500);
        b.Property(x => x.UpdatedBy).HasMaxLength(200);

        b.Property(x => x.Category).HasConversion<int>().IsRequired();

        b.HasIndex(x => x.Key).IsUnique();
        b.HasIndex(x => x.Category);
    }
}
