using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MajiLedger.Infrastructure.Persistence.Configurations;

public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> b)
    {
        b.ToTable("ApplicationUsers");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.Email).HasMaxLength(320).IsRequired();
        b.Property(x => x.PhoneNumber).HasMaxLength(20).IsRequired();
        b.Property(x => x.FullName).HasMaxLength(200).IsRequired();
        b.Property(x => x.PasswordHash).HasMaxLength(512).IsRequired();
        b.Property(x => x.Role).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreatedAt).IsRequired();

        b.HasIndex(x => x.Email).IsUnique().HasDatabaseName("IX_ApplicationUsers_Email");
        b.HasIndex(x => x.PhoneNumber).IsUnique().HasDatabaseName("IX_ApplicationUsers_PhoneNumber");
        b.HasIndex(x => x.OwnerId).HasDatabaseName("IX_ApplicationUsers_OwnerId");

        b.HasOne(x => x.Owner)
         .WithMany(x => x.LinkedUsers)
         .HasForeignKey(x => x.OwnerId)
         .OnDelete(DeleteBehavior.SetNull)
         .IsRequired(false);

        b.HasOne(x => x.Tenant)
         .WithMany()
         .HasForeignKey(x => x.TenantId)
         .OnDelete(DeleteBehavior.SetNull)
         .IsRequired(false);

        b.HasIndex(x => x.TenantId).HasDatabaseName("IX_ApplicationUsers_TenantId");
    }
}

public class PropertyAccessConfiguration : IEntityTypeConfiguration<PropertyAccess>
{
    public void Configure(EntityTypeBuilder<PropertyAccess> b)
    {
        b.ToTable("PropertyAccesses");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        b.Property(x => x.AccessRole).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(x => x.GrantedBy).HasMaxLength(200).IsRequired();
        b.Property(x => x.GrantedAt).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();

        // Filtered unique: one active grant per user per property
        b.HasIndex(x => new { x.ApplicationUserId, x.PropertyId })
         .IsUnique()
         .HasFilter("[RevokedAt] IS NULL")
         .HasDatabaseName("UIX_PropertyAccesses_UserProperty_Active");

        b.HasIndex(x => x.PropertyId).HasDatabaseName("IX_PropertyAccesses_PropertyId");

        b.HasOne(x => x.ApplicationUser)
         .WithMany(x => x.PropertyAccesses)
         .HasForeignKey(x => x.ApplicationUserId)
         .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(x => x.Property)
         .WithMany(x => x.AccessGrants)
         .HasForeignKey(x => x.PropertyId)
         .OnDelete(DeleteBehavior.Cascade);
    }
}
