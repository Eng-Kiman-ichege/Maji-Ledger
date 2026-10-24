using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// A building or block within a property.
/// </summary>
public class Building : AuditableEntity
{
    public Guid PropertyId { get; private set; }
    public string Name { get; private set; } = default!;
    public string? Description { get; private set; }
    public int? FloorCount { get; private set; }

    // Navigation
    public Property Property { get; private set; } = default!;
    public ICollection<Apartment> Apartments { get; private set; } = [];

    private Building() { }

    public static Building Create(Guid propertyId, string name, int? floorCount = null, string? description = null, string? createdBy = null)
    {
        return new Building
        {
            PropertyId = propertyId,
            Name = name,
            FloorCount = floorCount,
            Description = description,
            CreatedBy = createdBy
        };
    }
}
