using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// A water meter registered to an apartment. A meter can be reassigned;
/// historical assignments are preserved via MeterAssignment records.
/// </summary>
public class Meter : AuditableEntity
{
    public string MeterNumber { get; private set; } = default!;
    public string? SerialNumber { get; private set; }
    public Guid? ApartmentId { get; private set; }
    public MeterStatus Status { get; private set; } = MeterStatus.Active;

    /// <summary>Masked display identifier shown on the Scan-to-Pay page.</summary>
    public string MaskedIdentifier => MeterNumber.Length > 4
        ? $"****{MeterNumber[^4..]}"
        : "****";

    // Navigation
    public Apartment? Apartment { get; private set; }
    public QrCodeRegistration? QrCodeRegistration { get; private set; }
    public ICollection<MeterAssignment> Assignments { get; private set; } = [];
    public ICollection<WaterTransaction> Transactions { get; private set; } = [];

    private Meter() { }

    public static Meter Create(string meterNumber, string? serialNumber = null, Guid? apartmentId = null, string? createdBy = null)
    {
        return new Meter
        {
            MeterNumber = meterNumber,
            SerialNumber = serialNumber,
            ApartmentId = apartmentId,
            CreatedBy = createdBy
        };
    }

    public void UpdateStatus(MeterStatus status) { Status = status; MarkUpdated(); }
}
