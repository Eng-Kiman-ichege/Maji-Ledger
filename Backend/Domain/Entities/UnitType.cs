using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Classification / category for a rentable unit (e.g. Bedsitter, 1 Bedroom, Shop).
/// Used by the Property Management module to group apartments and set default rents.
/// </summary>
public class UnitType : BaseEntity
{
    public string Name { get; private set; } = default!;
    public string? Description { get; private set; }
    public bool IsActive { get; private set; } = true;
    public int SortOrder { get; private set; }

    // Navigation
    public ICollection<Apartment> Apartments { get; private set; } = [];

    private UnitType() { }

    public static UnitType Create(
        string name,
        string? description = null,
        int sortOrder = 0)
    {
        return new UnitType
        {
            Name = name,
            Description = description,
            SortOrder = sortOrder,
            IsActive = true
        };
    }

    public void Update(string name, string? description, int sortOrder)
    {
        Name = name;
        Description = description;
        SortOrder = sortOrder;
    }

    public void Deactivate() => IsActive = false;
    public void Activate()   => IsActive = true;
}
