using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// An apartment or house unit within a building.
/// Soft-deleted — tenancy and meter histories must remain traceable.
/// Extended for Property Management: UnitTypeId, MonthlyRent, IsOccupied, PropertyId (denormalised).
/// </summary>
public class Apartment : AuditableEntity
{
    public Guid BuildingId { get; private set; }
    public Guid? PropertyId { get; private set; }   // Denormalised from Building.PropertyId for fast queries
    public Guid? UnitTypeId { get; private set; }   // FK to UnitType
    public string UnitNumber { get; private set; } = default!;
    public string? Floor { get; private set; }
    public string? Description { get; private set; }
    public decimal MonthlyRent { get; private set; }
    public bool IsOccupied { get; private set; }

    // Navigation
    public Building Building { get; private set; } = default!;
    public Property? Property { get; private set; }
    public UnitType? UnitType { get; private set; }
    public ICollection<Tenancy> Tenancies { get; private set; } = [];
    public ICollection<MeterAssignment> MeterAssignments { get; private set; } = [];
    public ICollection<SharedMeterBillingPoint> SharedBillingPoints { get; private set; } = [];

    private Apartment() { }

    public static Apartment Create(
        Guid buildingId,
        string unitNumber,
        string? floor = null,
        string? description = null,
        string? createdBy = null,
        Guid? propertyId = null,
        Guid? unitTypeId = null,
        decimal monthlyRent = 0)
    {
        return new Apartment
        {
            BuildingId = buildingId,
            PropertyId = propertyId,
            UnitTypeId = unitTypeId,
            UnitNumber = unitNumber,
            Floor = floor,
            Description = description,
            MonthlyRent = monthlyRent,
            IsOccupied = false,
            CreatedBy = createdBy
        };
    }

    public void SetRent(decimal monthlyRent, string updatedBy)
    {
        MonthlyRent = monthlyRent;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }

    public void SetUnitType(Guid unitTypeId, string updatedBy)
    {
        UnitTypeId = unitTypeId;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }

    public void MarkOccupied(string updatedBy)
    {
        IsOccupied = true;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }

    public void MarkVacant(string updatedBy)
    {
        IsOccupied = false;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }

    public void Update(
        string unitNumber,
        string? floor,
        string? description,
        Guid? unitTypeId,
        decimal monthlyRent,
        string updatedBy)
    {
        UnitNumber = unitNumber;
        Floor = floor;
        Description = description;
        UnitTypeId = unitTypeId;
        MonthlyRent = monthlyRent;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }
}
