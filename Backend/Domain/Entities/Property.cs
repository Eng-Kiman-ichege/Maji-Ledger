using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// A property (estate or stand-alone property) owned by one or more owners.
/// </summary>
public class Property : AuditableEntity
{
    public string Name { get; private set; } = default!;
    public string? Description { get; private set; }
    public PropertyType Type { get; private set; }
    public string? PhysicalAddress { get; private set; }
    public string? County { get; private set; }
    public string? Town { get; private set; }

    // Navigation
    public ICollection<Building> Buildings { get; private set; } = [];
    public ICollection<PropertyOwnership> Ownerships { get; private set; } = [];

    private Property() { }

    public static Property Create(
        string name,
        PropertyType type,
        string? physicalAddress = null,
        string? county = null,
        string? town = null,
        string? description = null,
        string? createdBy = null)
    {
        return new Property
        {
            Name = name,
            Type = type,
            PhysicalAddress = physicalAddress,
            County = county,
            Town = town,
            Description = description,
            CreatedBy = createdBy
        };
    }
}
