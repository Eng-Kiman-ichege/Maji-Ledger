using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Links an owner to a property with a role (e.g., primary owner, co-owner).
/// </summary>
public class PropertyOwnership : BaseEntity
{
    public Guid OwnerId { get; private set; }
    public Guid PropertyId { get; private set; }
    public string Role { get; private set; } = "Owner";
    public DateTime EffectiveFrom { get; private set; }
    public DateTime? EffectiveTo { get; private set; }

    // Navigation
    public Owner Owner { get; private set; } = default!;
    public Property Property { get; private set; } = default!;

    private PropertyOwnership() { }

    public static PropertyOwnership Create(Guid ownerId, Guid propertyId, string role = "Owner")
    {
        return new PropertyOwnership
        {
            OwnerId = ownerId,
            PropertyId = propertyId,
            Role = role,
            EffectiveFrom = DateTime.UtcNow
        };
    }
}
