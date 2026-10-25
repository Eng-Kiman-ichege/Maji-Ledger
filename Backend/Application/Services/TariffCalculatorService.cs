using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;

namespace MajiLedger.Application.Services;

public class TariffCalculatorService : ITariffCalculatorService
{
    public TariffCalculationResult CalculateUnits(WaterTariff tariff, decimal totalAmount)
    {
        if (totalAmount <= 0)
            throw new ValidationException("Payment amount must be greater than zero.");

        var baseCharge = tariff.BaseCharge;
        if (totalAmount < baseCharge)
            throw new ValidationException($"Payment amount KES {totalAmount:F2} is insufficient to cover base standing charge of KES {baseCharge:F2}.");

        var netAmount = totalAmount - baseCharge;

        if (!tariff.IsTiered)
        {
            if (tariff.UnitRate <= 0)
                throw new InvalidOperationException("Flat tariff must specify a positive unit rate.");

            var units = Math.Round(netAmount / tariff.UnitRate, 4);
            return new TariffCalculationResult(netAmount, baseCharge, units, tariff.UnitRate);
        }

        // Tiered calculation
        var orderedTiers = tariff.Tiers.OrderBy(t => t.TierOrder).ToList();
        if (orderedTiers.Count == 0)
            throw new InvalidOperationException("Tiered tariff must define at least one tier.");

        decimal remainingAmount = netAmount;
        decimal totalUnits = 0;

        foreach (var tier in orderedTiers)
        {
            if (remainingAmount <= 0)
                break;

            if (tier.RatePerUnit <= 0)
                throw new InvalidOperationException($"Tier {tier.TierOrder} has an invalid rate per unit.");

            decimal tierCapacityUnits = tier.ToUnits.HasValue
                ? tier.ToUnits.Value - tier.FromUnits
                : decimal.MaxValue;

            decimal tierCostIfFull = tierCapacityUnits == decimal.MaxValue
                ? decimal.MaxValue
                : tierCapacityUnits * tier.RatePerUnit;

            if (remainingAmount >= tierCostIfFull)
            {
                totalUnits += tierCapacityUnits;
                remainingAmount -= tierCostIfFull;
            }
            else
            {
                decimal unitsInTier = remainingAmount / tier.RatePerUnit;
                totalUnits += unitsInTier;
                remainingAmount = 0;
            }
        }

        var roundedUnits = Math.Round(totalUnits, 4);
        var effectiveRate = roundedUnits > 0 ? Math.Round(netAmount / roundedUnits, 2) : 0;

        return new TariffCalculationResult(netAmount, baseCharge, roundedUnits, effectiveRate);
    }
}
