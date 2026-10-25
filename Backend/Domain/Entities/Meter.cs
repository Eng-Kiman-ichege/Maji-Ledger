using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// A water meter device. The <see cref="CurrentApartmentId"/> denormalizes the active
/// assignment for fast lookup; full history lives in <see cref="MeterAssignment"/>.
/// </summary>
public class Meter : AuditableEntity
{
    public string MeterNumber { get; private set; } = default!;
    public string? SerialNumber { get; private set; }
    public MeterType Type { get; private set; } = MeterType.Prepaid;
    public MeterStatus Status { get; private set; } = MeterStatus.Active;

    /// <summary>Denormalized current apartment for fast QR resolution. Updated via <see cref="MeterAssignment"/>.</summary>
    public Guid? CurrentApartmentId { get; private set; }

    /// <summary>Tariff override. Falls back to property tariff, then global tariff if null.</summary>
    public Guid? TariffId { get; private set; }

    /// <summary>Masked display identifier shown publicly (e.g. on the Scan-to-Pay page).</summary>
    public string MaskedIdentifier => MeterNumber.Length > 4
        ? $"****{MeterNumber[^4..]}"
        : "****";

    // Navigation
    public Apartment? CurrentApartment { get; private set; }
    public WaterTariff? Tariff { get; private set; }
    public QrCodeRegistration? ActiveQrCode { get; private set; }
    public ICollection<MeterAssignment> Assignments { get; private set; } = [];
    public ICollection<SharedMeterBillingPoint> SharedBillingPoints { get; private set; } = [];
    public ICollection<MeterReading> Readings { get; private set; } = [];
    public ICollection<PaymentAttempt> PaymentAttempts { get; private set; } = [];
    public ICollection<WaterPurchase> WaterPurchases { get; private set; } = [];

    private Meter() { }

    public static Meter Create(
        string meterNumber,
        MeterType type = MeterType.Prepaid,
        string? serialNumber = null,
        Guid? currentApartmentId = null,
        string? createdBy = null)
    {
        return new Meter
        {
            MeterNumber = meterNumber,
            Type = type,
            SerialNumber = serialNumber,
            CurrentApartmentId = currentApartmentId,
            CreatedBy = createdBy
        };
    }

    public void AssignToApartment(Guid apartmentId, string? updatedBy = null)
    {
        CurrentApartmentId = apartmentId;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }

    public void UnassignFromApartment(string? updatedBy = null)
    {
        CurrentApartmentId = null;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }

    public void SetTariff(Guid? tariffId, string? updatedBy = null)
    {
        TariffId = tariffId;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }

    public void UpdateStatus(MeterStatus status, string? updatedBy = null)
    {
        Status = status;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }
}
