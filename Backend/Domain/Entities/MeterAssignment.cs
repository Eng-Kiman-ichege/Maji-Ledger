using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Records the full history of meter assignments to apartments.
/// When a meter is moved to a new apartment, the old assignment is closed
/// and a new record is created.
/// </summary>
public class MeterAssignment : BaseEntity
{
    public Guid MeterId { get; private set; }
    public Guid ApartmentId { get; private set; }
    public DateTime AssignedAt { get; private set; }
    public DateTime? UnassignedAt { get; private set; }
    public string? AssignedBy { get; private set; }

    // Navigation
    public Meter Meter { get; private set; } = default!;
    public Apartment Apartment { get; private set; } = default!;

    private MeterAssignment() { }

    public static MeterAssignment Create(Guid meterId, Guid apartmentId, string? assignedBy = null)
    {
        return new MeterAssignment
        {
            MeterId = meterId,
            ApartmentId = apartmentId,
            AssignedAt = DateTime.UtcNow,
            AssignedBy = assignedBy
        };
    }

    public void Close() => UnassignedAt = DateTime.UtcNow;
}
