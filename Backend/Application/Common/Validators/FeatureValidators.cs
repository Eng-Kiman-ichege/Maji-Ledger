using FluentValidation;
using MajiLedger.Application.Features.Meters;
using MajiLedger.Application.Features.Payments;
using MajiLedger.Application.Features.Properties;
using MajiLedger.Application.Features.QrCodes;

namespace MajiLedger.Application.Common.Validators;

public class CreatePropertyCommandValidator : AbstractValidator<CreatePropertyCommand>
{
    public CreatePropertyCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Property name is required.")
            .MaximumLength(200).WithMessage("Property name cannot exceed 200 characters.");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Invalid property type.");

        RuleFor(x => x.County)
            .MaximumLength(100).When(x => !string.IsNullOrEmpty(x.County));

        RuleFor(x => x.Town)
            .MaximumLength(100).When(x => !string.IsNullOrEmpty(x.Town));
    }
}

public class CreateBuildingCommandValidator : AbstractValidator<CreateBuildingCommand>
{
    public CreateBuildingCommandValidator()
    {
        RuleFor(x => x.PropertyId)
            .NotEmpty().WithMessage("Property ID is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Building name is required.")
            .MaximumLength(100);

        RuleFor(x => x.FloorCount)
            .GreaterThanOrEqualTo(0).When(x => x.FloorCount.HasValue)
            .WithMessage("Floor count cannot be negative.");
    }
}

public class CreateApartmentCommandValidator : AbstractValidator<CreateApartmentCommand>
{
    public CreateApartmentCommandValidator()
    {
        RuleFor(x => x.BuildingId)
            .NotEmpty().WithMessage("Building ID is required.");

        RuleFor(x => x.UnitNumber)
            .NotEmpty().WithMessage("Unit number is required.")
            .MaximumLength(50);
    }
}

public class CreateMeterCommandValidator : AbstractValidator<CreateMeterCommand>
{
    public CreateMeterCommandValidator()
    {
        RuleFor(x => x.MeterNumber)
            .NotEmpty().WithMessage("Meter number is required.")
            .MaximumLength(50);

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Invalid meter type.");
    }
}

public class AssignMeterToApartmentCommandValidator : AbstractValidator<AssignMeterToApartmentCommand>
{
    public AssignMeterToApartmentCommandValidator()
    {
        RuleFor(x => x.MeterId)
            .NotEmpty().WithMessage("Meter ID is required.");

        RuleFor(x => x.ApartmentId)
            .NotEmpty().WithMessage("Apartment ID is required.");
    }
}

public class RegisterQrCodeCommandValidator : AbstractValidator<RegisterQrCodeCommand>
{
    public RegisterQrCodeCommandValidator()
    {
        RuleFor(x => x.MeterId)
            .NotEmpty().WithMessage("Meter ID is required.");

        RuleFor(x => x.PaymentProviderConfigId)
            .NotEmpty().WithMessage("Payment provider config ID is required.");
    }
}

public class InitiateQrPaymentCommandValidator : AbstractValidator<InitiateQrPaymentCommand>
{
    public InitiateQrPaymentCommandValidator()
    {
        RuleFor(x => x.PublicToken)
            .NotEmpty().WithMessage("Public QR token is required.");

        RuleFor(x => x.CustomerPhone)
            .NotEmpty().WithMessage("Customer phone number is required.")
            .Matches(@"^(?:\+254|0)[17]\d{8}$")
            .WithMessage("Customer phone number must be a valid Kenyan mobile number (e.g. 0712345678 or +254712345678).");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Payment amount must be greater than zero.");
    }
}

public class InitiateDirectPaymentCommandValidator : AbstractValidator<InitiateDirectPaymentCommand>
{
    public InitiateDirectPaymentCommandValidator()
    {
        RuleFor(x => x.MeterId)
            .NotEmpty().WithMessage("Meter ID is required.");

        RuleFor(x => x.PaymentProviderConfigId)
            .NotEmpty().WithMessage("Payment provider config ID is required.");

        RuleFor(x => x.CustomerPhone)
            .NotEmpty().WithMessage("Customer phone number is required.")
            .Matches(@"^(?:\+254|0)[17]\d{8}$")
            .WithMessage("Customer phone number must be a valid Kenyan mobile number (e.g. 0712345678 or +254712345678).");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Payment amount must be greater than zero.");
    }
}

public class ProcessPaybillPaymentCommandValidator : AbstractValidator<ProcessPaybillPaymentCommand>
{
    public ProcessPaybillPaymentCommandValidator()
    {
        RuleFor(x => x.BusinessShortCode)
            .NotEmpty().WithMessage("Business shortcode is required.");

        RuleFor(x => x.MeterNumber)
            .NotEmpty().WithMessage("Meter number is required.");

        RuleFor(x => x.ProviderRef)
            .NotEmpty().WithMessage("Provider reference is required.");

        RuleFor(x => x.CustomerPhone)
            .NotEmpty().WithMessage("Customer phone number is required.")
            .Matches(@"^(?:\+254|0)[17]\d{8}$")
            .WithMessage("Customer phone number must be a valid Kenyan mobile number (e.g. 0712345678 or +254712345678).");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Payment amount must be greater than zero.");
    }
}
