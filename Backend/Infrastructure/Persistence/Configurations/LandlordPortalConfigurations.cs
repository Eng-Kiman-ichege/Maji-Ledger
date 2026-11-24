using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MajiLedger.Infrastructure.Persistence.Configurations;

public class LandlordPortalConfigurations :
    IEntityTypeConfiguration<MaintenanceRequest>,
    IEntityTypeConfiguration<AppNotification>
{
    // ── MaintenanceRequest ────────────────────────────────────────────────────
    public void Configure(EntityTypeBuilder<MaintenanceRequest> b)
    {
        b.ToTable("MaintenanceRequests");
        b.HasKey(x => x.Id);

        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.Description).HasMaxLength(2000).IsRequired();
        b.Property(x => x.AssignedTo).HasMaxLength(200);
        b.Property(x => x.CompletionNotes).HasMaxLength(2000);
        b.Property(x => x.CancelledReason).HasMaxLength(1000);
        b.Property(x => x.CreatedBy).HasMaxLength(450).IsRequired();

        b.Property(x => x.EstimatedCost).HasColumnType("decimal(18,2)");
        b.Property(x => x.ActualCost).HasColumnType("decimal(18,2)");

        b.Property(x => x.Category).HasConversion<int>();
        b.Property(x => x.Priority).HasConversion<int>();
        b.Property(x => x.Status).HasConversion<int>();

        b.HasOne(x => x.Property)
            .WithMany()
            .HasForeignKey(x => x.PropertyId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Building)
            .WithMany()
            .HasForeignKey(x => x.BuildingId)
            .OnDelete(DeleteBehavior.SetNull);

        b.HasOne(x => x.Apartment)
            .WithMany()
            .HasForeignKey(x => x.ApartmentId)
            .OnDelete(DeleteBehavior.SetNull);

        b.HasOne(x => x.Tenancy)
            .WithMany()
            .HasForeignKey(x => x.TenancyId)
            .OnDelete(DeleteBehavior.SetNull);

        b.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.SetNull);

        b.HasIndex(x => x.PropertyId);
        b.HasIndex(x => x.ApartmentId);
        b.HasIndex(x => x.Status);
        b.HasIndex(x => x.CreatedAt);
    }

    // ── AppNotification ───────────────────────────────────────────────────────
    public void Configure(EntityTypeBuilder<AppNotification> b)
    {
        b.ToTable("AppNotifications");
        b.HasKey(x => x.Id);

        b.Property(x => x.UserId).IsRequired();
        b.Property(x => x.Title).HasMaxLength(300).IsRequired();
        b.Property(x => x.Message).HasMaxLength(2000).IsRequired();
        b.Property(x => x.RelatedEntityType).HasMaxLength(100);
        b.Property(x => x.Type).HasConversion<int>();

        b.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(x => x.Owner)
            .WithMany()
            .HasForeignKey(x => x.OwnerId)
            .OnDelete(DeleteBehavior.SetNull);

        b.HasIndex(x => x.UserId);
        b.HasIndex(x => x.IsRead);
        b.HasIndex(x => x.CreatedAt);
    }
}
