using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Links an owner to a property with a role and effective date range.
/// Historical records are preserved when ownership changes.
/// </summary>
public class PropertyOwnership : BaseEntity
{
    public Guid OwnerId { get; private set; }
    public Guid PropertyId { get; private set; }
    public OwnershipRole Role { get; private set; } = OwnershipRole.PrimaryOwner;
    public DateTime EffectiveFrom { get; private set; }
    public DateTime? EffectiveTo { get; private set; }
    public string? CreatedBy { get; private set; }

    // Navigation
    public Owner Owner { get; private set; } = default!;
    public Property Property { get; private set; } = default!;

    private PropertyOwnership() { }

    public static PropertyOwnership Create(
        Guid ownerId,
        Guid propertyId,
        OwnershipRole role = OwnershipRole.PrimaryOwner,
        string? createdBy = null)
    {
        return new PropertyOwnership
        {
            OwnerId = ownerId,
            PropertyId = propertyId,
            Role = role,
            EffectiveFrom = DateTime.UtcNow,
            CreatedBy = createdBy
        };
    }

    public void Close() => EffectiveTo = DateTime.UtcNow;

    public bool IsCurrent => EffectiveTo is null;
}
