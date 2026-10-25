using MajiLedger.Domain.Entities;

namespace MajiLedger.Application.Common.Interfaces;

public record TariffCalculationResult(
    decimal NetAmountApplied,
    decimal BaseChargeDeducted,
    decimal UnitsCalculated,
    decimal EffectiveRatePerUnit);

public interface ITariffCalculatorService
{
    TariffCalculationResult CalculateUnits(WaterTariff tariff, decimal totalAmount);
}
