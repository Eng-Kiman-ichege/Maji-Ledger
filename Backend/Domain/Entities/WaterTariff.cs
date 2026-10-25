using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// A water tariff schedule — can be global (PropertyId null) or property-specific.
/// Lookup priority: meter-specific → property tariff → global default.
/// </summary>
public class WaterTariff : AuditableEntity
{
    public Guid? PropertyId { get; private set; }
    public string Name { get; private set; } = default!;
    public string? Description { get; private set; }
    public BillingCycle BillingCycle { get; private set; }
    public decimal BaseCharge { get; private set; }
    public decimal UnitRate { get; private set; }
    public bool IsTiered { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTime EffectiveFrom { get; private set; }
    public DateTime? EffectiveTo { get; private set; }

    // Navigation
    public Property? Property { get; private set; }
    public ICollection<TariffTier> Tiers { get; private set; } = [];
    public ICollection<Meter> Meters { get; private set; } = [];
    public ICollection<WaterPurchase> WaterPurchases { get; private set; } = [];

    private WaterTariff() { }

    public static WaterTariff CreateFlat(
        string name,
        decimal unitRate,
        decimal baseCharge = 0,
        BillingCycle billingCycle = BillingCycle.PerUnit,
        Guid? propertyId = null,
        DateTime? effectiveFrom = null,
        string? createdBy = null)
    {
        return new WaterTariff
        {
            PropertyId = propertyId,
            Name = name,
            BillingCycle = billingCycle,
            BaseCharge = baseCharge,
            UnitRate = unitRate,
            IsTiered = false,
            EffectiveFrom = effectiveFrom ?? DateTime.UtcNow,
            CreatedBy = createdBy
        };
    }

    public static WaterTariff CreateTiered(
        string name,
        decimal baseCharge = 0,
        BillingCycle billingCycle = BillingCycle.PerUnit,
        Guid? propertyId = null,
        DateTime? effectiveFrom = null,
        string? createdBy = null)
    {
        return new WaterTariff
        {
            PropertyId = propertyId,
            Name = name,
            BillingCycle = billingCycle,
            BaseCharge = baseCharge,
            UnitRate = 0,
            IsTiered = true,
            EffectiveFrom = effectiveFrom ?? DateTime.UtcNow,
            CreatedBy = createdBy
        };
    }

    public void Expire(string updatedBy)
    {
        IsActive = false;
        EffectiveTo = DateTime.UtcNow;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }
}
