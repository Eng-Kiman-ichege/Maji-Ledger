using FluentAssertions;
using FluentValidation;
using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Application.Common.Validators;
using MajiLedger.Application.Features.Payments;
using MajiLedger.Application.Services;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MajiLedger.Infrastructure.Persistence;
using MajiLedger.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MajiLedger.Tests.Integration;

public class PaymentWorkflowTests
{
    private MajiLedgerDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<MajiLedgerDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new MajiLedgerDbContext(options);
    }

    private class MockPaymentGateway : IPaymentGatewayService
    {
        public string LastCheckoutId { get; private set; } = "ws_CO_TEST_1234567890";
        public Task<string> InitiatePushAsync(PaymentChannel channel, string customerPhone, decimal amount, string accountReference, CancellationToken cancellationToken = default)
        {
            LastCheckoutId = $"ws_CO_{Guid.NewGuid():N}"[..25];
            return Task.FromResult(LastCheckoutId);
        }
    }

    private class MockStsService : IStsTokenService
    {
        public bool ShouldThrow { get; set; }
        public Task<string> GenerateTokenAsync(string meterNumber, decimal units, CancellationToken cancellationToken = default)
        {
            if (ShouldThrow)
                throw new TimeoutException("STS Key Management Server timed out after 30000ms.");

            return Task.FromResult("4829-1029-3819-2049-5512");
        }
    }

    private class MockSmsService : ISmsGatewayService
    {
        public bool ShouldThrow { get; set; }
        public Task<string> SendSmsAsync(string recipientPhone, string message, CancellationToken cancellationToken = default)
        {
            if (ShouldThrow)
                throw new HttpRequestException("SMS Provider Gateway network error.");

            return Task.FromResult("SMS-REF-998877");
        }
    }

    private async Task<(Guid PropertyId, Guid BuildingId, Guid ApartmentId, Guid MeterId, Guid ConfigId, Guid QrId, string PublicToken)>
        SeedHierarchyAsync(MajiLedgerDbContext db, decimal unitRate = 120m, decimal baseCharge = 50m)
    {
        var property = Property.Create("Emerald Crest", PropertyType.Residential, "Ngong Road", "Nairobi", createdBy: "admin");
        db.Properties.Add(property);

        var config = PaymentProviderConfig.Create(
            PaymentProviderType.MpesaPaybill, "600100", "Emerald Crest Water", EnvironmentType.Production, property.Id, "admin");
        db.PaymentProviderConfigs.Add(config);

        var tariff = WaterTariff.CreateFlat("Residential Standard", unitRate, baseCharge, BillingCycle.PerUnit, property.Id, createdBy: "admin");
        db.WaterTariffs.Add(tariff);

        var building = Building.Create(property.Id, "Tower 1", 5, createdBy: "admin");
        db.Buildings.Add(building);

        var apartment = Apartment.Create(building.Id, "Unit 3B", createdBy: "admin");
        db.Apartments.Add(apartment);

        var meter = Meter.Create("MTR-5544-3322", MeterType.Prepaid, currentApartmentId: apartment.Id, createdBy: "admin");
        db.Meters.Add(meter);

        await db.SaveChangesAsync();

        var qr = QrCodeRegistration.Create(meter.Id, config.Id, "admin");
        db.QrCodeRegistrations.Add(qr);

        await db.SaveChangesAsync();

        return (property.Id, building.Id, apartment.Id, meter.Id, config.Id, qr.Id, qr.PublicToken);
    }

    // ── 1. Valid QR scan and correct destination display ─────────────────────────
    [Fact]
    public async Task Scenario1_ValidQrScan_And_CorrectDestinationDisplay()
    {
        var dbName = Guid.NewGuid().ToString();
        string publicToken;

        using (var db = CreateDbContext(dbName))
        {
            var seed = await SeedHierarchyAsync(db);
            publicToken = seed.PublicToken;
        }

        using (var db = CreateDbContext(dbName))
        {
            var handler = new GetScanToPayLandingHandler(db);
            var result = await handler.Handle(new GetScanToPayLandingQuery(publicToken), CancellationToken.None);

            result.Should().NotBeNull();
            result.PropertyName.Should().Be("Emerald Crest");
            result.BuildingName.Should().Be("Tower 1");
            result.UnitNumber.Should().Be("Unit 3B");
            result.MaskedMeterIdentifier.Should().Be("****3322");
            result.BusinessShortCode.Should().Be("600100");
            result.PaymentProviderDisplayName.Should().Be("Emerald Crest Water");
            result.BaseCharge.Should().Be(50m);
            result.UnitRate.Should().Be(120m);
        }
    }

    // ── 2. Unknown, revoked, and disabled QR codes ────────────────────────────────
    [Fact]
    public async Task Scenario2_Unknown_Revoked_And_Disabled_QrCodes()
    {
        var dbName = Guid.NewGuid().ToString();
        string activeToken;
        Guid qrId;

        using (var db = CreateDbContext(dbName))
        {
            var seed = await SeedHierarchyAsync(db);
            activeToken = seed.PublicToken;
            qrId = seed.QrId;
        }

        // A. Unknown QR code
        using (var db = CreateDbContext(dbName))
        {
            var handler = new GetScanToPayLandingHandler(db);
            var act = () => handler.Handle(new GetScanToPayLandingQuery("NON_EXISTENT_QR"), CancellationToken.None);
            await act.Should().ThrowAsync<NotFoundException>();
        }

        // B. Disabled QR code
        using (var db = CreateDbContext(dbName))
        {
            var qr = await db.QrCodeRegistrations.FindAsync(qrId);
            qr!.Disable("admin");
            await db.SaveChangesAsync();

            var handler = new GetScanToPayLandingHandler(db);
            var actLanding = () => handler.Handle(new GetScanToPayLandingQuery(activeToken), CancellationToken.None);
            await actLanding.Should().ThrowAsync<ConflictException>().WithMessage("*temporarily disabled*");

            var payHandler = new InitiateQrPaymentHandler(db);
            var actPay = () => payHandler.Handle(new InitiateQrPaymentCommand(activeToken, "0712345678", 500m), CancellationToken.None);
            await actPay.Should().ThrowAsync<ConflictException>().WithMessage("*temporarily disabled*");
        }

        // C. Revoked QR code
        using (var db = CreateDbContext(dbName))
        {
            var qr = await db.QrCodeRegistrations.FindAsync(qrId);
            qr!.Revoke("Damaged QR sticker", "admin");
            await db.SaveChangesAsync();

            var handler = new GetScanToPayLandingHandler(db);
            var actLanding = () => handler.Handle(new GetScanToPayLandingQuery(activeToken), CancellationToken.None);
            await actLanding.Should().ThrowAsync<ConflictException>().WithMessage("*permanently revoked*");

            var payHandler = new InitiateQrPaymentHandler(db);
            var actPay = () => payHandler.Handle(new InitiateQrPaymentCommand(activeToken, "0712345678", 500m), CancellationToken.None);
            await actPay.Should().ThrowAsync<ConflictException>().WithMessage("*permanently revoked*");
        }
    }

    // ── 3. Incorrect or changed property mappings ─────────────────────────────────
    [Fact]
    public async Task Scenario3_Incorrect_Or_Changed_Property_Mappings()
    {
        var dbName = Guid.NewGuid().ToString();
        string publicToken;

        using (var db = CreateDbContext(dbName))
        {
            var seed = await SeedHierarchyAsync(db);

            // Create a second property with its own payment config
            var otherProperty = Property.Create("Sunset Villas", PropertyType.Residential, createdBy: "admin");
            db.Properties.Add(otherProperty);
            var foreignConfig = PaymentProviderConfig.Create(
                PaymentProviderType.MpesaPaybill, "700200", "Sunset Villas Water", EnvironmentType.Production, otherProperty.Id, "admin");
            db.PaymentProviderConfigs.Add(foreignConfig);

            // Intentionally create an inconsistent QR code pointing to foreign property config
            var wrongQr = QrCodeRegistration.Create(seed.MeterId, foreignConfig.Id, "admin");
            db.QrCodeRegistrations.Add(wrongQr);
            await db.SaveChangesAsync();

            publicToken = wrongQr.PublicToken;
        }

        using (var db = CreateDbContext(dbName))
        {
            var landingHandler = new GetScanToPayLandingHandler(db);
            var actLanding = () => landingHandler.Handle(new GetScanToPayLandingQuery(publicToken), CancellationToken.None);
            await actLanding.Should().ThrowAsync<ConflictException>()
                .WithMessage("*payment configuration does not match the property*");

            var payHandler = new InitiateQrPaymentHandler(db);
            var actPay = () => payHandler.Handle(new InitiateQrPaymentCommand(publicToken, "0712345678", 500m), CancellationToken.None);
            await actPay.Should().ThrowAsync<ConflictException>()
                .WithMessage("*payment configuration does not match the property*");
        }
    }

    // ── 4. Invalid amount and phone number ────────────────────────────────────────
    [Fact]
    public async Task Scenario4_Invalid_Amount_And_Phone_Number()
    {
        var dbName = Guid.NewGuid().ToString();
        string publicToken;

        using (var db = CreateDbContext(dbName))
        {
            var seed = await SeedHierarchyAsync(db, unitRate: 100m, baseCharge: 50m);
            publicToken = seed.PublicToken;
        }

        // A. FluentValidation on phone number and <= 0 amount
        var validator = new InitiateQrPaymentCommandValidator();

        var invalidPhoneResult = validator.Validate(new InitiateQrPaymentCommand(publicToken, "12345", 500m));
        invalidPhoneResult.IsValid.Should().BeFalse();
        invalidPhoneResult.Errors.Should().Contain(e => e.PropertyName == "CustomerPhone");

        var zeroAmountResult = validator.Validate(new InitiateQrPaymentCommand(publicToken, "0712345678", 0m));
        zeroAmountResult.IsValid.Should().BeFalse();
        zeroAmountResult.Errors.Should().Contain(e => e.PropertyName == "Amount");

        // B. Amount less than base charge
        using (var db = CreateDbContext(dbName))
        {
            var payHandler = new InitiateQrPaymentHandler(db);
            var act = () => payHandler.Handle(new InitiateQrPaymentCommand(publicToken, "0712345678", 30m), CancellationToken.None);
            await act.Should().ThrowAsync<MajiLedger.Application.Common.Exceptions.ValidationException>()
                .WithMessage("*insufficient to cover base standing charge*");
        }
    }

    // ── 5. Payment initiation and cancellation ────────────────────────────────────
    [Fact]
    public async Task Scenario5_Payment_Initiation_And_Cancellation()
    {
        var dbName = Guid.NewGuid().ToString();
        string publicToken;
        var mockGateway = new MockPaymentGateway();

        using (var db = CreateDbContext(dbName))
        {
            var seed = await SeedHierarchyAsync(db);
            publicToken = seed.PublicToken;
        }

        PaymentInitiationDto initResult;
        using (var db = CreateDbContext(dbName))
        {
            var payHandler = new InitiateQrPaymentHandler(db, mockGateway);
            initResult = await payHandler.Handle(new InitiateQrPaymentCommand(publicToken, "0712345678", 500m), CancellationToken.None);

            initResult.Should().NotBeNull();
            initResult.Status.Should().Be(PaymentAttemptStatus.Initiated);
            initResult.ProviderCheckoutId.Should().NotBeNullOrEmpty();
        }

        // Customer cancels or provider declines
        using (var db = CreateDbContext(dbName))
        {
            var fulfillment = new PaymentFulfillmentService(db, new TariffCalculatorService(), new MockStsService(), new MockSmsService());
            var confirmHandler = new ConfirmPaymentHandler(db, fulfillment);
            await confirmHandler.Handle(new ConfirmPaymentCommand(
                initResult.ProviderCheckoutId!,
                "REF_CANCELLED",
                500m,
                DateTime.UtcNow,
                Succeeded: false,
                FailureReason: "User cancelled STK push prompt."), CancellationToken.None);

            var attempt = await db.PaymentAttempts.FindAsync(initResult.AttemptId);
            attempt!.Status.Should().Be(PaymentAttemptStatus.Failed);
            attempt.FailureReason.Should().Be("User cancelled STK push prompt.");

            // Verify no payment or water purchase was created
            var paymentsCount = await db.Payments.CountAsync();
            paymentsCount.Should().Be(0);
        }
    }

    // ── 6. Successful payment callback ───────────────────────────────────────────
    [Fact]
    public async Task Scenario6_Successful_Payment_Callback()
    {
        var dbName = Guid.NewGuid().ToString();
        string publicToken;
        var mockGateway = new MockPaymentGateway();
        var mockSts = new MockStsService();
        var mockSms = new MockSmsService();

        using (var db = CreateDbContext(dbName))
        {
            var seed = await SeedHierarchyAsync(db, unitRate: 100m, baseCharge: 50m);
            publicToken = seed.PublicToken;
        }

        PaymentInitiationDto initResult;
        using (var db = CreateDbContext(dbName))
        {
            var payHandler = new InitiateQrPaymentHandler(db, mockGateway);
            initResult = await payHandler.Handle(new InitiateQrPaymentCommand(publicToken, "0712345678", 550m), CancellationToken.None);
        }

        using (var db = CreateDbContext(dbName))
        {
            var fulfillment = new PaymentFulfillmentService(db, new TariffCalculatorService(), mockSts, mockSms);
            var confirmHandler = new ConfirmPaymentHandler(db, fulfillment);

            await confirmHandler.Handle(new ConfirmPaymentCommand(
                initResult.ProviderCheckoutId!,
                "MPESA_REC_1001",
                550m,
                DateTime.UtcNow,
                Succeeded: true,
                FailureReason: null), CancellationToken.None);

            var attempt = await db.PaymentAttempts
                .Include(a => a.Payment).ThenInclude(p => p!.WaterPurchase).ThenInclude(wp => wp!.WaterToken)
                .FirstAsync(a => a.Id == initResult.AttemptId);

            attempt.Status.Should().Be(PaymentAttemptStatus.Confirmed);
            attempt.Payment.Should().NotBeNull();
            attempt.Payment!.ProviderRef.Should().Be("MPESA_REC_1001");

            var purchase = attempt.Payment.WaterPurchase;
            purchase.Should().NotBeNull();
            purchase!.Status.Should().Be(WaterPurchaseStatus.TokenIssued);
            purchase.AmountApplied.Should().Be(500m); // 550 - 50 base charge = 500
            purchase.UnitsCalculated.Should().Be(5.0m); // 500 / 100 = 5 units

            purchase.WaterToken.Should().NotBeNull();
            purchase.WaterToken!.StsToken.Should().Be("4829-1029-3819-2049-5512");
            purchase.WaterToken.Status.Should().Be(WaterTokenStatus.Delivered);

            var sms = await db.SmsDeliveryRecords.FirstOrDefaultAsync(s => s.WaterTokenId == purchase.WaterToken.Id);
            sms.Should().NotBeNull();
            sms!.Status.Should().Be(SmsDeliveryStatus.Delivered);
            sms.GatewayRef.Should().Be("SMS-REF-998877");
        }
    }

    // ── 7. Duplicate callbacks ───────────────────────────────────────────────────
    [Fact]
    public async Task Scenario7_Duplicate_Callbacks_Are_Idempotent()
    {
        var dbName = Guid.NewGuid().ToString();
        string publicToken;
        var mockGateway = new MockPaymentGateway();
        var mockSts = new MockStsService();
        var mockSms = new MockSmsService();

        using (var db = CreateDbContext(dbName))
        {
            var seed = await SeedHierarchyAsync(db, unitRate: 100m, baseCharge: 0m);
            publicToken = seed.PublicToken;
        }

        PaymentInitiationDto initResult;
        using (var db = CreateDbContext(dbName))
        {
            var payHandler = new InitiateQrPaymentHandler(db, mockGateway);
            initResult = await payHandler.Handle(new InitiateQrPaymentCommand(publicToken, "0712345678", 500m), CancellationToken.None);
        }

        // First callback
        using (var db = CreateDbContext(dbName))
        {
            var fulfillment = new PaymentFulfillmentService(db, new TariffCalculatorService(), mockSts, mockSms);
            var confirmHandler = new ConfirmPaymentHandler(db, fulfillment);

            await confirmHandler.Handle(new ConfirmPaymentCommand(
                initResult.ProviderCheckoutId!,
                "MPESA_REC_DUP_1",
                500m,
                DateTime.UtcNow,
                Succeeded: true,
                FailureReason: null), CancellationToken.None);
        }

        // Duplicate callback (identical checkout ID and provider ref)
        using (var db = CreateDbContext(dbName))
        {
            var fulfillment = new PaymentFulfillmentService(db, new TariffCalculatorService(), mockSts, mockSms);
            var confirmHandler = new ConfirmPaymentHandler(db, fulfillment);

            var actDuplicate = () => confirmHandler.Handle(new ConfirmPaymentCommand(
                initResult.ProviderCheckoutId!,
                "MPESA_REC_DUP_1",
                500m,
                DateTime.UtcNow,
                Succeeded: true,
                FailureReason: null), CancellationToken.None);

            await actDuplicate.Should().NotThrowAsync();

            // Total payments and tokens must remain exactly 1
            var paymentCount = await db.Payments.CountAsync();
            paymentCount.Should().Be(1);

            var tokenCount = await db.WaterTokens.CountAsync();
            tokenCount.Should().Be(1);
        }
    }

    // ── 8. Wrong payment destination ─────────────────────────────────────────────
    [Fact]
    public async Task Scenario8_Wrong_Payment_Destination_Rejection()
    {
        var dbName = Guid.NewGuid().ToString();

        using (var db = CreateDbContext(dbName))
        {
            await SeedHierarchyAsync(db);

            // Another property with its own Paybill
            var propB = Property.Create("Property B", PropertyType.Residential, createdBy: "admin");
            db.Properties.Add(propB);
            var configB = PaymentProviderConfig.Create(
                PaymentProviderType.MpesaPaybill, "888999", "Property B Water", EnvironmentType.Production, propB.Id, "admin");
            db.PaymentProviderConfigs.Add(configB);
            await db.SaveChangesAsync();
        }

        using (var db = CreateDbContext(dbName))
        {
            var fulfillment = new PaymentFulfillmentService(db, new TariffCalculatorService(), new MockStsService(), new MockSmsService());
            var handler = new ProcessPaybillPaymentHandler(db, fulfillment);
            // Attempt paying into Property B's Paybill (888999) for Property A's meter (MTR-5544-3322)
            var act = () => handler.Handle(new ProcessPaybillPaymentCommand(
                "888999", "MTR-5544-3322", "TXN_CROSS_PROP", 1000m, "0712345678", DateTime.UtcNow), CancellationToken.None);

            await act.Should().ThrowAsync<ConflictException>()
                .WithMessage("*not authorized for the property*");
        }
    }

    // ── 9. Confirmed payment followed by STS failure ──────────────────────────────
    [Fact]
    public async Task Scenario9_Confirmed_Payment_Followed_By_Sts_Failure()
    {
        var dbName = Guid.NewGuid().ToString();
        string publicToken;
        var mockGateway = new MockPaymentGateway();
        var failingSts = new MockStsService { ShouldThrow = true };
        var mockSms = new MockSmsService();

        using (var db = CreateDbContext(dbName))
        {
            var seed = await SeedHierarchyAsync(db);
            publicToken = seed.PublicToken;
        }

        PaymentInitiationDto initResult;
        using (var db = CreateDbContext(dbName))
        {
            var payHandler = new InitiateQrPaymentHandler(db, mockGateway);
            initResult = await payHandler.Handle(new InitiateQrPaymentCommand(publicToken, "0712345678", 500m), CancellationToken.None);
        }

        using (var db = CreateDbContext(dbName))
        {
            var fulfillment = new PaymentFulfillmentService(db, new TariffCalculatorService(), failingSts, mockSms);
            var confirmHandler = new ConfirmPaymentHandler(db, fulfillment);

            // Should not throw: payment confirmation is captured safely even if STS token dispenser times out
            await confirmHandler.Handle(new ConfirmPaymentCommand(
                initResult.ProviderCheckoutId!,
                "REC_STS_FAIL_01",
                500m,
                DateTime.UtcNow,
                Succeeded: true,
                FailureReason: null), CancellationToken.None);

            // Assert payment was securely retained
            var payment = await db.Payments.FirstOrDefaultAsync(p => p.ProviderRef == "REC_STS_FAIL_01");
            payment.Should().NotBeNull();
            payment!.AmountConfirmed.Should().Be(500m);

            // Assert purchase is in recoverable TokenFailed state
            var purchase = await db.WaterPurchases
                .Include(wp => wp.TokenGenerationAttempts)
                .FirstOrDefaultAsync(wp => wp.PaymentId == payment.Id);

            purchase.Should().NotBeNull();
            purchase!.Status.Should().Be(WaterPurchaseStatus.TokenFailed);

            // Assert audit attempt was recorded with failure reason
            purchase.TokenGenerationAttempts.Should().HaveCount(1);
            var attempt = purchase.TokenGenerationAttempts.First();
            attempt.Succeeded.Should().BeFalse();
            attempt.FailureReason.Should().Contain("timed out");
        }
    }

    // ── 10. Successful token generation ──────────────────────────────────────────
    [Fact]
    public async Task Scenario10_Successful_Token_Generation_Auditing()
    {
        var dbName = Guid.NewGuid().ToString();
        var mockSts = new MockStsService();
        var mockSms = new MockSmsService();
        Guid meterId;
        Guid configId;

        using (var db = CreateDbContext(dbName))
        {
            var seed = await SeedHierarchyAsync(db, unitRate: 100m, baseCharge: 0m);
            meterId = seed.MeterId;
            configId = seed.ConfigId;
        }

        using (var db = CreateDbContext(dbName))
        {
            var attempt = PaymentAttempt.Initiate(meterId, configId, PaymentChannel.MpesaPaybill, "0712345678", 800m);
            db.PaymentAttempts.Add(attempt);
            await db.SaveChangesAsync();

            var fulfillment = new PaymentFulfillmentService(db, new TariffCalculatorService(), mockSts, mockSms);
            var purchase = await fulfillment.ProcessConfirmedPaymentAsync(attempt, "REC_TOKEN_SUCCESS_10", 800m, DateTime.UtcNow);

            purchase.Status.Should().Be(WaterPurchaseStatus.TokenIssued);
            purchase.UnitsCalculated.Should().Be(8.0m);

            var token = await db.WaterTokens.FirstOrDefaultAsync(t => t.WaterPurchaseId == purchase.Id);
            token.Should().NotBeNull();
            token!.StsToken.Should().Be("4829-1029-3819-2049-5512");
            token.Status.Should().Be(WaterTokenStatus.Delivered);

            var genAttempt = await db.TokenGenerationAttempts.FirstOrDefaultAsync(t => t.WaterPurchaseId == purchase.Id);
            genAttempt.Should().NotBeNull();
            genAttempt!.Succeeded.Should().BeTrue();
            genAttempt.StsRequestPayload.Should().Contain("MTR-5544-3322");
            genAttempt.StsResponsePayload.Should().Contain("4829-1029-3819-2049-5512");
        }
    }

    // ── 11. SMS delivery failure ─────────────────────────────────────────────────
    [Fact]
    public async Task Scenario11_Sms_Delivery_Failure_Does_Not_Compromise_Token()
    {
        var dbName = Guid.NewGuid().ToString();
        var mockSts = new MockStsService();
        var failingSms = new MockSmsService { ShouldThrow = true };
        Guid meterId;
        Guid configId;

        using (var db = CreateDbContext(dbName))
        {
            var seed = await SeedHierarchyAsync(db);
            meterId = seed.MeterId;
            configId = seed.ConfigId;
        }

        using (var db = CreateDbContext(dbName))
        {
            var attempt = PaymentAttempt.Initiate(meterId, configId, PaymentChannel.ScanToPay, "0712345678", 500m);
            db.PaymentAttempts.Add(attempt);
            await db.SaveChangesAsync();

            var fulfillment = new PaymentFulfillmentService(db, new TariffCalculatorService(), mockSts, failingSms);
            var purchase = await fulfillment.ProcessConfirmedPaymentAsync(attempt, "REC_SMS_FAIL_11", 500m, DateTime.UtcNow);

            // Purchase and token are still successfully issued
            purchase.Status.Should().Be(WaterPurchaseStatus.TokenIssued);

            var token = await db.WaterTokens.FirstOrDefaultAsync(t => t.WaterPurchaseId == purchase.Id);
            token.Should().NotBeNull();
            token!.Status.Should().Be(WaterTokenStatus.DeliveryFailed);
            token.StsToken.Should().Be("4829-1029-3819-2049-5512");

            var smsRecord = await db.SmsDeliveryRecords.FirstOrDefaultAsync(s => s.WaterTokenId == token.Id);
            smsRecord.Should().NotBeNull();
            smsRecord!.Status.Should().Be(SmsDeliveryStatus.Failed);
        }
    }

    // ── 12. Paybill and USSD reconciliation ──────────────────────────────────────
    [Fact]
    public async Task Scenario12_Paybill_And_Ussd_Reconciliation()
    {
        var dbName = Guid.NewGuid().ToString();

        using (var db = CreateDbContext(dbName))
        {
            await SeedHierarchyAsync(db, unitRate: 150m, baseCharge: 50m);
        }

        using (var db = CreateDbContext(dbName))
        {
            var mockSts = new MockStsService();
            var mockSms = new MockSmsService();
            var fulfillment = new PaymentFulfillmentService(db, new TariffCalculatorService(), mockSts, mockSms);
            var handler = new ProcessPaybillPaymentHandler(db, fulfillment);

            // Customer pays via Paybill: Shortcode 600100, Meter MTR-5544-3322, Amount 500
            var result = await handler.Handle(new ProcessPaybillPaymentCommand(
                "600100",
                "MTR-5544-3322",
                "MPESA_PAYBILL_REC_12",
                500m,
                "0722000111",
                DateTime.UtcNow,
                PaymentChannel.MpesaPaybill), CancellationToken.None);

            result.Should().NotBeNull();
            result.Status.Should().Be(PaymentAttemptStatus.Confirmed);
            result.MeterNumber.Should().Be("MTR-5544-3322");
            result.WaterToken.Should().Be("4829-1029-3819-2049-5512");
            result.UnitsIssued.Should().Be(3.0m); // (500 - 50 base charge) / 150 unit rate = 3 units

            // Verify in DB
            var attempt = await db.PaymentAttempts
                .Include(a => a.Payment)
                .FirstOrDefaultAsync(a => a.ProviderCheckoutId == "MPESA_PAYBILL_REC_12");

            attempt.Should().NotBeNull();
            attempt!.Channel.Should().Be(PaymentChannel.MpesaPaybill);
            attempt.Payment.Should().NotBeNull();
            attempt.Payment!.ProviderRef.Should().Be("MPESA_PAYBILL_REC_12");
        }
    }
}
