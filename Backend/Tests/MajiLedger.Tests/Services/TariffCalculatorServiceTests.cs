using FluentAssertions;
using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Services;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using Xunit;

namespace MajiLedger.Tests.Services;

public class TariffCalculatorServiceTests
{
    private readonly TariffCalculatorService _calculator = new();

    [Fact]
    public void CalculateUnits_FlatTariffNoBaseCharge_CalculatesExactUnits()
    {
        // Arrange: KES 50 per m3, KES 1000 payment -> 20 m3
        var tariff = WaterTariff.CreateFlat("Standard Flat", unitRate: 50m, baseCharge: 0m);

        // Act
        var result = _calculator.CalculateUnits(tariff, 1000m);

        // Assert
        result.NetAmountApplied.Should().Be(1000m);
        result.BaseChargeDeducted.Should().Be(0m);
        result.UnitsCalculated.Should().Be(20m);
        result.EffectiveRatePerUnit.Should().Be(50m);
    }

    [Fact]
    public void CalculateUnits_FlatTariffWithBaseCharge_DeductsBaseChargeBeforeComputingUnits()
    {
        // Arrange: Base charge KES 100, Unit rate KES 50/m3, Payment KES 1100 -> net KES 1000 -> 20 m3
        var tariff = WaterTariff.CreateFlat("Flat with Standing Fee", unitRate: 50m, baseCharge: 100m);

        // Act
        var result = _calculator.CalculateUnits(tariff, 1100m);

        // Assert
        result.NetAmountApplied.Should().Be(1000m);
        result.BaseChargeDeducted.Should().Be(100m);
        result.UnitsCalculated.Should().Be(20m);
    }

    [Fact]
    public void CalculateUnits_InsufficientAmountForBaseCharge_ThrowsValidationException()
    {
        // Arrange: Base charge KES 200, Payment KES 150
        var tariff = WaterTariff.CreateFlat("Flat Fee", unitRate: 50m, baseCharge: 200m);

        // Act
        var act = () => _calculator.CalculateUnits(tariff, 150m);

        // Assert
        act.Should().Throw<ValidationException>()
            .WithMessage("*insufficient to cover base standing charge*");
    }

    [Fact]
    public void CalculateUnits_ZeroOrNegativeAmount_ThrowsValidationException()
    {
        // Arrange
        var tariff = WaterTariff.CreateFlat("Standard Flat", unitRate: 50m);

        // Act & Assert
        var actZero = () => _calculator.CalculateUnits(tariff, 0m);
        actZero.Should().Throw<ValidationException>();

        var actNegative = () => _calculator.CalculateUnits(tariff, -50m);
        actNegative.Should().Throw<ValidationException>();
    }

    [Fact]
    public void CalculateUnits_TieredTariff_ComputesUnitsAcrossTiersAccurately()
    {
        // Arrange:
        // Tier 1: 0 - 10 m³ @ KES 50/m³  (capacity 10 m³ = KES 500)
        // Tier 2: 10 - 25 m³ @ KES 80/m³ (capacity 15 m³ = KES 1200)
        // Tier 3: > 25 m³ @ KES 120/m³
        //
        // Payment: KES 1100
        // - First 10 m³ takes KES 500, leaving KES 600
        // - In Tier 2, KES 600 / KES 80 = 7.5 m³
        // Total units: 10 + 7.5 = 17.5 m³
        var tariff = WaterTariff.CreateTiered("Progressive Tiered", baseCharge: 0m);
        tariff.Tiers.Add(TariffTier.Create(tariff.Id, 1, fromUnits: 0m, ratePerUnit: 50m, toUnits: 10m));
        tariff.Tiers.Add(TariffTier.Create(tariff.Id, 2, fromUnits: 10m, ratePerUnit: 80m, toUnits: 25m));
        tariff.Tiers.Add(TariffTier.Create(tariff.Id, 3, fromUnits: 25m, ratePerUnit: 120m, toUnits: null));

        // Act
        var result = _calculator.CalculateUnits(tariff, 1100m);

        // Assert
        result.NetAmountApplied.Should().Be(1100m);
        result.UnitsCalculated.Should().Be(17.5m);
    }
}
