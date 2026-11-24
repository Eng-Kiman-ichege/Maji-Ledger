using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// A building or block within a property.
/// Soft-deleted so historical meter and tenancy records remain linked.
/// </summary>
public class Building : AuditableEntity
{
    public Guid PropertyId { get; private set; }
    public string Name { get; private set; } = default!;
    public string? BuildingCode { get; private set; }   // Unique within property, e.g. "BLK-A"
    public string? Description { get; private set; }
    public int? FloorCount { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation
    public Property Property { get; private set; } = default!;
    public ICollection<Apartment> Apartments { get; private set; } = [];

    private Building() { }

    public static Building Create(
        Guid propertyId,
        string name,
        int? floorCount = null,
        string? description = null,
        string? createdBy = null,
        string? buildingCode = null)
    {
        return new Building
        {
            PropertyId = propertyId,
            Name = name,
            FloorCount = floorCount,
            Description = description,
            BuildingCode = buildingCode,
            IsActive = true,
            CreatedBy = createdBy
        };
    }

    public void Update(string name, int? floorCount, string? description, string updatedBy, string? buildingCode = null)
    {
        Name = name;
        FloorCount = floorCount;
        Description = description;
        BuildingCode = buildingCode ?? BuildingCode;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }

    public void Deactivate(string updatedBy) { IsActive = false; UpdatedBy = updatedBy; MarkUpdated(); }
    public void Activate(string updatedBy) { IsActive = true; UpdatedBy = updatedBy; MarkUpdated(); }
}
