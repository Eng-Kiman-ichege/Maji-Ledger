using FluentAssertions;
using MajiLedger.Application.Common.Validators;
using MajiLedger.Application.Features.Meters;
using MajiLedger.Application.Features.Payments;
using MajiLedger.Application.Features.Properties;
using MajiLedger.Domain.Enums;
using Xunit;

namespace MajiLedger.Tests.Validation;

public class FeatureValidatorsTests
{
    private readonly CreatePropertyCommandValidator _propertyValidator = new();
    private readonly CreateMeterCommandValidator _meterValidator = new();
    private readonly InitiateQrPaymentCommandValidator _paymentValidator = new();

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void CreateProperty_EmptyName_ShouldHaveValidationError(string? name)
    {
        var cmd = new CreatePropertyCommand(name!);
        var result = _propertyValidator.Validate(cmd);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreatePropertyCommand.Name));
    }

    [Fact]
    public void CreateMeter_EmptyMeterNumber_ShouldHaveValidationError()
    {
        var cmd = new CreateMeterCommand("", MeterType.Prepaid);
        var result = _meterValidator.Validate(cmd);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateMeterCommand.MeterNumber));
    }

    [Theory]
    [InlineData("0712345678", true)]
    [InlineData("+254712345678", true)]
    [InlineData("0112345678", true)]
    [InlineData("12345", false)]
    [InlineData("abcdefghij", false)]
    [InlineData("0201234567", false)] // Landline, not mobile
    public void InitiateQrPayment_PhoneFormat_ValidatesKenyanMobileNumber(string phone, bool expectedValid)
    {
        var cmd = new InitiateQrPaymentCommand("token_123", phone, 100m);
        var result = _paymentValidator.Validate(cmd);

        if (expectedValid)
            result.Errors.Should().NotContain(e => e.PropertyName == nameof(InitiateQrPaymentCommand.CustomerPhone));
        else
            result.Errors.Should().Contain(e => e.PropertyName == nameof(InitiateQrPaymentCommand.CustomerPhone));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-10)]
    public void InitiateQrPayment_NonPositiveAmount_ShouldFail(decimal amount)
    {
        var cmd = new InitiateQrPaymentCommand("token_123", "0712345678", amount);
        var result = _paymentValidator.Validate(cmd);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(InitiateQrPaymentCommand.Amount));
    }
}
