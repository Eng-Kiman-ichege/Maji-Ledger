using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// System identity record for platform users.
/// Separate from the business <see cref="Owner"/> profile.
/// Authentication strategy (ASP.NET Identity vs. custom JWT vs. external IdP)
/// is to be confirmed — this is a custom entity that can be migrated later.
/// </summary>
public class ApplicationUser : BaseEntity
{
    public string Email { get; private set; } = default!;
    public string PhoneNumber { get; private set; } = default!;
    public string FullName { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;
    public UserRole Role { get; private set; }
    public bool IsActive { get; private set; } = true;

    /// <summary>Optional link to an <see cref="Owner"/> profile when this user is a property owner.</summary>
    public Guid? OwnerId { get; private set; }

    /// <summary>Optional link to a <see cref="Tenant"/> profile when this user is a tenant.</summary>
    public Guid? TenantId { get; private set; }

    // Navigation
    public Owner? Owner { get; private set; }
    public Tenant? Tenant { get; private set; }
    public ICollection<PropertyAccess> PropertyAccesses { get; private set; } = [];

    private ApplicationUser() { }

    public static ApplicationUser Create(
        string email,
        string phoneNumber,
        string fullName,
        string passwordHash,
        UserRole role,
        Guid? ownerId = null,
        Guid? tenantId = null)
    {
        return new ApplicationUser
        {
            Email = email.Trim().ToLowerInvariant(),
            PhoneNumber = phoneNumber,
            FullName = fullName,
            PasswordHash = passwordHash,
            Role = role,
            OwnerId = ownerId,
            TenantId = tenantId
        };
    }

    public void Activate() { IsActive = true; MarkUpdated(); }
    public void Deactivate() { IsActive = false; MarkUpdated(); }
    public void UpdatePassword(string newHash) { PasswordHash = newHash; MarkUpdated(); }
    public void UpdateProfile(string fullName, string phoneNumber)
    {
        FullName = fullName.Trim();
        PhoneNumber = phoneNumber.Trim();
        MarkUpdated();
    }
    public void AssignRole(UserRole role) { Role = role; MarkUpdated(); }
    public void LinkToOwner(Guid ownerId) { OwnerId = ownerId; MarkUpdated(); }
    public void LinkToTenant(Guid tenantId) { TenantId = tenantId; MarkUpdated(); }
}
