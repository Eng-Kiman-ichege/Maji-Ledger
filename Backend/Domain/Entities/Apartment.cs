using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// An apartment or house unit within a building.
/// </summary>
public class Apartment : AuditableEntity
{
    public Guid BuildingId { get; private set; }
    public string UnitNumber { get; private set; } = default!;
    public string? Floor { get; private set; }
    public string? Description { get; private set; }

    // Navigation
    public Building Building { get; private set; } = default!;
    public ICollection<Tenancy> Tenancies { get; private set; } = [];
    public ICollection<Meter> Meters { get; private set; } = [];

    private Apartment() { }

    public static Apartment Create(Guid buildingId, string unitNumber, string? floor = null, string? description = null, string? createdBy = null)
    {
        return new Apartment
        {
            BuildingId = buildingId,
            UnitNumber = unitNumber,
            Floor = floor,
            Description = description,
            CreatedBy = createdBy
        };
    }
}
