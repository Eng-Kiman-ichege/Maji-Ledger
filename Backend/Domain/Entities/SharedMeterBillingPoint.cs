using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Records an apartment's participation in a shared meter arrangement.
/// AllocationFraction determines what proportion of a purchase is attributed to this apartment.
/// The sum of all active fractions for a meter must equal 1.0 (enforced at application layer).
/// </summary>
public class SharedMeterBillingPoint : BaseEntity
{
    public Guid MeterId { get; private set; }
    public Guid ApartmentId { get; private set; }

    /// <summary>Proportion of each purchase attributed to this apartment. E.g. 0.5m = 50%.</summary>
    public decimal AllocationFraction { get; private set; }

    public DateTime EffectiveFrom { get; private set; }
    public DateTime? EffectiveTo { get; private set; }
    public string? Notes { get; private set; }
    public string? CreatedBy { get; private set; }

    // Navigation
    public Meter Meter { get; private set; } = default!;
    public Apartment Apartment { get; private set; } = default!;

    private SharedMeterBillingPoint() { }

    public static SharedMeterBillingPoint Create(
        Guid meterId,
        Guid apartmentId,
        decimal allocationFraction,
        DateTime? effectiveFrom = null,
        string? notes = null,
        string? createdBy = null)
    {
        if (allocationFraction <= 0 || allocationFraction > 1)
            throw new ArgumentOutOfRangeException(nameof(allocationFraction), "Must be between 0 (exclusive) and 1 (inclusive).");

        return new SharedMeterBillingPoint
        {
            MeterId = meterId,
            ApartmentId = apartmentId,
            AllocationFraction = allocationFraction,
            EffectiveFrom = effectiveFrom ?? DateTime.UtcNow,
            Notes = notes,
            CreatedBy = createdBy
        };
    }

    public void Close(string? notes = null)
    {
        EffectiveTo = DateTime.UtcNow;
        Notes = notes ?? Notes;
    }

    public bool IsActive => EffectiveTo is null;
}
