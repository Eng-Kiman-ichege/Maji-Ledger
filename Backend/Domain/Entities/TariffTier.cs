using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// A pricing tier within a <see cref="WaterTariff"/>.
/// E.g. 0–5 m³ @ KES 50/m³, 5–20 m³ @ KES 80/m³.
/// Tiers must be non-overlapping and contiguous (enforced at application layer).
/// </summary>
public class TariffTier : BaseEntity
{
    public Guid TariffId { get; private set; }
    public int TierOrder { get; private set; }
    public decimal FromUnits { get; private set; }
    public decimal? ToUnits { get; private set; }   // null = no upper limit
    public decimal RatePerUnit { get; private set; }  // KES per m³

    // Navigation
    public WaterTariff Tariff { get; private set; } = default!;

    private TariffTier() { }

    public static TariffTier Create(
        Guid tariffId,
        int tierOrder,
        decimal fromUnits,
        decimal ratePerUnit,
        decimal? toUnits = null)
    {
        return new TariffTier
        {
            TariffId = tariffId,
            TierOrder = tierOrder,
            FromUnits = fromUnits,
            ToUnits = toUnits,
            RatePerUnit = ratePerUnit
        };
    }

    /// <summary>Calculate the charge for a given number of units that fall within this tier.</summary>
    public decimal CalculateCharge(decimal unitsInThisTier) => unitsInThisTier * RatePerUnit;
}
