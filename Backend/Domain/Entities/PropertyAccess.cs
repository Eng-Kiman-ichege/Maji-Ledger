using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Fine-grained authorization record linking an <see cref="ApplicationUser"/> to a
/// <see cref="Property"/> with an explicit access role.
/// Revoked (not deleted) when access is removed.
/// </summary>
public class PropertyAccess : BaseEntity
{
    public Guid ApplicationUserId { get; private set; }
    public Guid PropertyId { get; private set; }
    public PropertyAccessRole AccessRole { get; private set; }
    public DateTime GrantedAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }
    public string GrantedBy { get; private set; } = default!;

    // Navigation
    public ApplicationUser ApplicationUser { get; private set; } = default!;
    public Property Property { get; private set; } = default!;

    private PropertyAccess() { }

    public static PropertyAccess Grant(
        Guid userId,
        Guid propertyId,
        PropertyAccessRole accessRole,
        string grantedBy)
    {
        return new PropertyAccess
        {
            ApplicationUserId = userId,
            PropertyId = propertyId,
            AccessRole = accessRole,
            GrantedAt = DateTime.UtcNow,
            GrantedBy = grantedBy
        };
    }

    public void Revoke() => RevokedAt = DateTime.UtcNow;

    public bool IsActive => RevokedAt is null;
}
