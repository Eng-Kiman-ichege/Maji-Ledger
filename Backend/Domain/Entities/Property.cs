using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// A property (estate or stand-alone plot) owned by one or more owners.
/// Soft-deleted — never hard-deleted so historical payment records remain valid.
/// </summary>
public class Property : AuditableEntity
{
    public string Name { get; private set; } = default!;
    public string? PropertyCode { get; private set; }   // Unique short code, e.g. "PROP-001"
    public string? Description { get; private set; }
    public PropertyType Type { get; private set; }
    public string? PhysicalAddress { get; private set; }
    public string? County { get; private set; }
    public string? Town { get; private set; }
    public string? PostalCode { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation
    public ICollection<Building> Buildings { get; private set; } = [];
    public ICollection<PropertyOwnership> Ownerships { get; private set; } = [];
    public ICollection<PropertyAccess> AccessGrants { get; private set; } = [];
    public ICollection<WaterTariff> Tariffs { get; private set; } = [];
    public ICollection<PaymentProviderConfig> PaymentProviderConfigs { get; private set; } = [];

    private Property() { }

    public static Property Create(
        string name,
        PropertyType type,
        string? physicalAddress = null,
        string? county = null,
        string? town = null,
        string? postalCode = null,
        string? description = null,
        string? propertyCode = null,
        string? createdBy = null)
    {
        return new Property
        {
            Name = name,
            Type = type,
            PhysicalAddress = physicalAddress,
            County = county,
            Town = town,
            PostalCode = postalCode,
            Description = description,
            PropertyCode = propertyCode,
            CreatedBy = createdBy
        };
    }

    public void Update(
        string name,
        PropertyType type,
        string? physicalAddress,
        string? county,
        string? town,
        string? postalCode,
        string? description,
        string updatedBy)
    {
        Name = name;
        Type = type;
        PhysicalAddress = physicalAddress;
        County = county;
        Town = town;
        PostalCode = postalCode;
        Description = description;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }

    public void Deactivate(string updatedBy)
    {
        IsActive = false;
        UpdatedBy = updatedBy;
        SoftDelete(updatedBy);
    }

    public void Activate(string updatedBy)
    {
        IsActive = true;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }

    public void SetPropertyCode(string code, string updatedBy)
    {
        PropertyCode = code;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }
}
