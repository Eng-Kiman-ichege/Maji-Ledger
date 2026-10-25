using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Bridges a confirmed <see cref="Payment"/> to water units and a <see cref="WaterToken"/>.
/// Captures the tariff snapshot used at the time of purchase for immutable audit purposes.
/// </summary>
public class WaterPurchase : BaseEntity
{
    public Guid PaymentId { get; private set; }
    public Guid MeterId { get; private set; }

    /// <summary>Snapshot of the tariff ID used to calculate units. Preserved even if the tariff later changes.</summary>
    public Guid? TariffId { get; private set; }

    /// <summary>Amount applied to units after deducting BaseCharge and other fixed fees.</summary>
    public decimal AmountApplied { get; private set; }

    /// <summary>Water units (m³) calculated from AmountApplied using the tariff rate.</summary>
    public decimal UnitsCalculated { get; private set; }

    public WaterPurchaseStatus Status { get; private set; } = WaterPurchaseStatus.Pending;

    // Navigation
    public Payment Payment { get; private set; } = default!;
    public Meter Meter { get; private set; } = default!;
    public WaterTariff? Tariff { get; private set; }
    public WaterToken? WaterToken { get; private set; }
    public ICollection<TokenGenerationAttempt> TokenGenerationAttempts { get; private set; } = [];

    private WaterPurchase() { }

    public static WaterPurchase Create(
        Guid paymentId,
        Guid meterId,
        decimal amountApplied,
        decimal unitsCalculated,
        Guid? tariffId = null)
    {
        return new WaterPurchase
        {
            PaymentId = paymentId,
            MeterId = meterId,
            AmountApplied = amountApplied,
            UnitsCalculated = unitsCalculated,
            TariffId = tariffId,
            Status = WaterPurchaseStatus.Pending
        };
    }

    public void SetUnitsCalculated(decimal units) { UnitsCalculated = units; }
    public void MarkTokenIssued() { Status = WaterPurchaseStatus.TokenIssued; }
    public void MarkTokenFailed() { Status = WaterPurchaseStatus.TokenFailed; }
    public void MarkReconciled() { Status = WaterPurchaseStatus.Reconciled; }
}
