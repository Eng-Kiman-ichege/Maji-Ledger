using FluentAssertions;
using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Application.Features.Dashboard;
using MajiLedger.Application.Features.Meters;
using MajiLedger.Application.Features.Owners;
using MajiLedger.Application.Features.Payments;
using MajiLedger.Application.Features.Properties;
using MajiLedger.Application.Features.QrCodes;
using MajiLedger.Application.Services;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MajiLedger.Infrastructure.Persistence;
using MajiLedger.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MajiLedger.Tests.Integration;

public class EndToEndProductionReadinessTests
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
        public Task<string> InitiatePushAsync(PaymentChannel channel, string customerPhone, decimal amount, string accountReference, CancellationToken cancellationToken = default)
        {
            return Task.FromResult($"ws_CO_PROD_READY_{Guid.NewGuid():N}"[..28]);
        }
    }

    private class MockStsService : IStsTokenService
    {
        public bool ShouldFail { get; set; }
        public Task<string> GenerateTokenAsync(string meterNumber, decimal units, CancellationToken cancellationToken = default)
        {
            if (ShouldFail)
                throw new TimeoutException("STS Key Management Server timed out after 30000ms.");

            return Task.FromResult("6152-7718-9901-2345-8812");
        }
    }

    private class MockSmsService : ISmsGatewayService
    {
        public bool ShouldFail { get; set; }
        public Task<string> SendSmsAsync(string recipientPhone, string message, CancellationToken cancellationToken = default)
        {
            if (ShouldFail)
                throw new HttpRequestException("SMS Provider Gateway network error.");

            return Task.FromResult("SMS-GATEWAY-REF-776655");
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 1. Complete End-to-End Customer Journey
    // ══════════════════════════════════════════════════════════════════════════
    [Fact]
    public async Task CompleteCustomerJourney_FromOwnerRegistration_ToTokenDelivery_AndReports()
    {
        var dbName = Guid.NewGuid().ToString();
        var adminUser = "admin@majiledger.com";
        var mockGateway = new MockPaymentGateway();
        var mockSts = new MockStsService();
        var mockSms = new MockSmsService();

        Guid ownerId, propertyId, buildingId, apartmentId, meterId, configId, qrId;
        string publicToken;

        // Step 1: Register Property Owner
        using (var db = CreateDbContext(dbName))
        {
            var ownerHandler = new CreateOwnerHandler(db);
            ownerId = await ownerHandler.Handle(
                new CreateOwnerCommand("Grace Nyambura", "254711223344", "grace@example.com", "ID44556677", "A99887766Z", adminUser),
                CancellationToken.None);
            ownerId.Should().NotBeEmpty();
        }

        // Step 2: Create Property Hierarchy (Property, Building, Apartment, Water Meter)
        using (var db = CreateDbContext(dbName))
        {
            var propHandler = new CreatePropertyHandler(db);
            propertyId = await propHandler.Handle(
                new CreatePropertyCommand("Savannah Palms Estate", PropertyType.Residential, "Kilifi Creek Road", "Kilifi", "Kilifi", "80108", "Oceanfront residential community", adminUser),
                CancellationToken.None);

            var assignHandler = new AssignPropertyOwnershipHandler(db);
            await assignHandler.Handle(
                new AssignPropertyOwnershipCommand(ownerId, propertyId, OwnershipRole.PrimaryOwner, adminUser),
                CancellationToken.None);

            var bldHandler = new CreateBuildingHandler(db);
            buildingId = await bldHandler.Handle(
                new CreateBuildingCommand(propertyId, "Palm Block 1", 4, "4-storey block", adminUser),
                CancellationToken.None);

            var aptHandler = new CreateApartmentHandler(db);
            apartmentId = await aptHandler.Handle(
                new CreateApartmentCommand(buildingId, "Unit 2A", "2nd Floor", "2-Bedroom Ocean Suite", adminUser),
                CancellationToken.None);

            var meterHandler = new CreateMeterHandler(db);
            meterId = await meterHandler.Handle(
                new CreateMeterCommand("MTR-SAV-2A-1099", MeterType.Prepaid, "SN-SAV-99", apartmentId, adminUser),
                CancellationToken.None);
        }

        // Step 3: Configure Approved Payment Destination & Tariff
        using (var db = CreateDbContext(dbName))
        {
            var config = PaymentProviderConfig.Create(
                PaymentProviderType.MpesaPaybill,
                "522522",
                "Savannah Palms Water",
                EnvironmentType.Production,
                propertyId,
                adminUser);
            db.PaymentProviderConfigs.Add(config);

            var tariff = WaterTariff.CreateFlat(
                "Kilifi Standard Water Tariff",
                unitRate: 150m,
                baseCharge: 50m,
                BillingCycle.PerUnit,
                propertyId,
                createdBy: adminUser);
            db.WaterTariffs.Add(tariff);

            await db.SaveChangesAsync();
            configId = config.Id;
        }

        // Step 4: Generate and Activate QR Registration
        using (var db = CreateDbContext(dbName))
        {
            var qrHandler = new RegisterQrCodeFeatureHandler(db);
            var qrResult = await qrHandler.Handle(
                new RegisterQrCodeCommand(meterId, configId, adminUser),
                CancellationToken.None);

            qrId = qrResult.Id;
            publicToken = qrResult.PublicToken;
            publicToken.Should().NotBeNullOrEmpty();
        }

        // Step 5 & 6: Customer opens QR payment URL & verifies property, building, house #, masked meter
        using (var db = CreateDbContext(dbName))
        {
            var landingHandler = new GetScanToPayLandingHandler(db);
            var landing = await landingHandler.Handle(new GetScanToPayLandingQuery(publicToken), CancellationToken.None);

            landing.PropertyName.Should().Be("Savannah Palms Estate");
            landing.BuildingName.Should().Be("Palm Block 1");
            landing.UnitNumber.Should().Be("Unit 2A");
            landing.MaskedMeterIdentifier.Should().Be("****1099");
            landing.BusinessShortCode.Should().Be("522522");
            landing.PaymentProviderDisplayName.Should().Be("Savannah Palms Water");
            landing.BaseCharge.Should().Be(50m);
            landing.UnitRate.Should().Be(150m);
        }

        // Step 7 & 8: Customer enters Amount (800 KES) and phone number -> Initiate payment
        PaymentInitiationDto initResult;
        using (var db = CreateDbContext(dbName))
        {
            var payHandler = new InitiateQrPaymentHandler(db, mockGateway);
            initResult = await payHandler.Handle(
                new InitiateQrPaymentCommand(publicToken, "254711998877", 800m),
                CancellationToken.None);

            initResult.Should().NotBeNull();
            initResult.Status.Should().Be(PaymentAttemptStatus.Initiated);
            initResult.ProviderCheckoutId.Should().NotBeNullOrEmpty();
        }

        // Step 9 & 10: Provider callback confirms payment -> Calculate applicable units
        using (var db = CreateDbContext(dbName))
        {
            var fulfillment = new PaymentFulfillmentService(db, new TariffCalculatorService(), mockSts, mockSms);
            var confirmHandler = new ConfirmPaymentHandler(db, fulfillment);

            await confirmHandler.Handle(new ConfirmPaymentCommand(
                initResult.ProviderCheckoutId!,
                "MPESA_REC_SAVANNAH_800",
                800m,
                DateTime.UtcNow,
                Succeeded: true,
                FailureReason: null), CancellationToken.None);
        }

        // Step 11 & 12: Verify payment record, calculated units, STS token, SMS delivery record
        using (var db = CreateDbContext(dbName))
        {
            var attempt = await db.PaymentAttempts
                .Include(a => a.Payment)
                    .ThenInclude(p => p!.WaterPurchase)
                    .ThenInclude(wp => wp!.WaterToken)
                    .ThenInclude(t => t!.SmsDeliveries)
                .FirstAsync(a => a.Id == initResult.AttemptId);

            attempt.Status.Should().Be(PaymentAttemptStatus.Confirmed);
            attempt.Payment.Should().NotBeNull();
            attempt.Payment!.AmountConfirmed.Should().Be(800m);
            attempt.Payment.ProviderRef.Should().Be("MPESA_REC_SAVANNAH_800");

            var purchase = attempt.Payment.WaterPurchase;
            purchase.Should().NotBeNull();
            purchase!.Status.Should().Be(WaterPurchaseStatus.TokenIssued);
            purchase.AmountApplied.Should().Be(750m); // 800 - 50 base charge = 750
            purchase.UnitsCalculated.Should().Be(5.0m); // 750 / 150 = 5.0 m³

            var token = purchase.WaterToken;
            token.Should().NotBeNull();
            token!.StsToken.Should().Be("6152-7718-9901-2345-8812");
            token.Status.Should().Be(WaterTokenStatus.Delivered);

            var sms = token.SmsDeliveries.Should().ContainSingle().Subject;
            sms.Status.Should().Be(SmsDeliveryStatus.Delivered);
            sms.RecipientPhone.Should().Be("254711998877");
            sms.GatewayRef.Should().Be("SMS-GATEWAY-REF-776655");
        }

        // Step 13: Confirm transaction appears under the correct property, apartment, and meter
        using (var db = CreateDbContext(dbName))
        {
            var meter = await db.Meters
                .Include(m => m.CurrentApartment)
                    .ThenInclude(a => a!.Building)
                .Include(m => m.PaymentAttempts)
                    .ThenInclude(pa => pa.Payment)
                .FirstAsync(m => m.Id == meterId);

            meter.CurrentApartmentId.Should().Be(apartmentId);
            meter.CurrentApartment!.Building.PropertyId.Should().Be(propertyId);
            meter.PaymentAttempts.Should().ContainSingle(pa => pa.Id == initResult.AttemptId);
        }

        // Step 14: Verify Administrator and Owner reports reflect the confirmed transaction
        using (var db = CreateDbContext(dbName))
        {
            // Administrator report
            var adminHandler = new GetAdminDashboardHandler(db);
            var adminReport = await adminHandler.Handle(new GetAdminDashboardQuery(), CancellationToken.None);

            adminReport.TotalProperties.Should().Be(1);
            adminReport.TotalMeters.Should().Be(1);
            adminReport.ActiveQrRegistrations.Should().Be(1);
            adminReport.Financials.GrossConfirmedCollections.Should().Be(800m);
            adminReport.Financials.TotalUnitsPurchased.Should().Be(5.0m);
            adminReport.Financials.ConfirmedPaymentCount.Should().Be(1);
            adminReport.Financials.TokenIssuedCount.Should().Be(1);
            adminReport.Financials.SmsDeliveredCount.Should().Be(1);
            adminReport.ChannelBreakdown.ScanToPayAmount.Should().Be(800m);
            adminReport.ChannelBreakdown.ScanToPayCount.Should().Be(1);

            // Owner report (Grace Nyambura)
            var ownerHandler = new GetOwnerDashboardHandler(db);
            var ownerReport = await ownerHandler.Handle(new GetOwnerDashboardQuery(ownerId), CancellationToken.None);

            ownerReport.OwnerName.Should().Be("Grace Nyambura");
            ownerReport.AuthorizedPropertyCount.Should().Be(1);
            ownerReport.Financials.GrossConfirmedCollections.Should().Be(800m);
            ownerReport.Financials.TotalUnitsPurchased.Should().Be(5.0m);
            ownerReport.PropertySummaries.Should().ContainSingle();
            ownerReport.PropertySummaries[0].PropertyName.Should().Be("Savannah Palms Estate");
            ownerReport.PropertySummaries[0].ConfirmedCollections.Should().Be(800m);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 2. Invalid & Untrusted QR / Client Tampering Scenarios
    // ══════════════════════════════════════════════════════════════════════════
    [Fact]
    public async Task SecurityAndTampering_BackendDoesNotTrustClientSuppliedDestination()
    {
        var dbName = Guid.NewGuid().ToString();
        var adminUser = "admin@majiledger.com";

        Guid propAId, propBId, meterAId, meterBId, configAId, configBId, qrAId;
        string tokenA;

        using (var db = CreateDbContext(dbName))
        {
            // Property A
            var propA = Property.Create("Plaza North", PropertyType.Commercial, createdBy: adminUser);
            db.Properties.Add(propA);
            var bldA = Building.Create(propA.Id, "Block 1", floorCount: 2, createdBy: adminUser);
            db.Buildings.Add(bldA);
            var aptA = Apartment.Create(bldA.Id, "Office 10", createdBy: adminUser);
            db.Apartments.Add(aptA);
            var meterA = Meter.Create("MTR-NORTH-10", currentApartmentId: aptA.Id, createdBy: adminUser);
            db.Meters.Add(meterA);

            var configA = PaymentProviderConfig.Create(PaymentProviderType.MpesaPaybill, "111000", "Plaza North Water", EnvironmentType.Production, propA.Id, adminUser);
            db.PaymentProviderConfigs.Add(configA);

            var qrA = QrCodeRegistration.Create(meterA.Id, configA.Id, adminUser);
            db.QrCodeRegistrations.Add(qrA);

            // Property B
            var propB = Property.Create("Plaza South", PropertyType.Commercial, createdBy: adminUser);
            db.Properties.Add(propB);
            var bldB = Building.Create(propB.Id, "Block 2", floorCount: 2, createdBy: adminUser);
            db.Buildings.Add(bldB);
            var aptB = Apartment.Create(bldB.Id, "Office 20", createdBy: adminUser);
            db.Apartments.Add(aptB);
            var meterB = Meter.Create("MTR-SOUTH-20", currentApartmentId: aptB.Id, createdBy: adminUser);
            db.Meters.Add(meterB);

            var configB = PaymentProviderConfig.Create(PaymentProviderType.MpesaPaybill, "222000", "Plaza South Water", EnvironmentType.Production, propB.Id, adminUser);
            db.PaymentProviderConfigs.Add(configB);

            await db.SaveChangesAsync();

            propAId = propA.Id;
            propBId = propB.Id;
            meterAId = meterA.Id;
            meterBId = meterB.Id;
            configAId = configA.Id;
            configBId = configB.Id;
            qrAId = qrA.Id;
            tokenA = qrA.PublicToken;
        }

        // A. Inactive meter rejection
        using (var db = CreateDbContext(dbName))
        {
            var meter = await db.Meters.FindAsync(meterAId);
            meter!.UpdateStatus(MeterStatus.Suspended, adminUser);
            await db.SaveChangesAsync();

            var landingHandler = new GetScanToPayLandingHandler(db);
            var actLanding = () => landingHandler.Handle(new GetScanToPayLandingQuery(tokenA), CancellationToken.None);
            await actLanding.Should().ThrowAsync<ConflictException>().WithMessage("*not active*");

            var payHandler = new InitiateQrPaymentHandler(db);
            var actPay = () => payHandler.Handle(new InitiateQrPaymentCommand(tokenA, "0711000000", 500m), CancellationToken.None);
            await actPay.Should().ThrowAsync<ConflictException>().WithMessage("*not active*");

            // Restore meter to active
            meter.UpdateStatus(MeterStatus.Active, adminUser);
            await db.SaveChangesAsync();
        }

        // B. Unknown QR code
        using (var db = CreateDbContext(dbName))
        {
            var landingHandler = new GetScanToPayLandingHandler(db);
            var actUnknown = () => landingHandler.Handle(new GetScanToPayLandingQuery("FAKE_PUBLIC_TOKEN_1234"), CancellationToken.None);
            await actUnknown.Should().ThrowAsync<NotFoundException>();
        }

        // C. Customer attempting to alter payment destination / cross-property routing
        // InitiateQrPayment only accepts the public token — the server resolves the provider config from DB.
        // If an operator accidentally or maliciously mapped QR to a foreign property's Paybill config,
        // the server detects this mismatch and halts execution:
        using (var db = CreateDbContext(dbName))
        {
            var inconsistentQr = QrCodeRegistration.Create(meterAId, configBId, adminUser);
            db.QrCodeRegistrations.Add(inconsistentQr);
            await db.SaveChangesAsync();

            var landingHandler = new GetScanToPayLandingHandler(db);
            var actMismatched = () => landingHandler.Handle(new GetScanToPayLandingQuery(inconsistentQr.PublicToken), CancellationToken.None);
            await actMismatched.Should().ThrowAsync<ConflictException>()
                .WithMessage("*payment configuration does not match the property*");
        }

        // D. Deactivated payment provider config
        using (var db = CreateDbContext(dbName))
        {
            var config = await db.PaymentProviderConfigs.FindAsync(configAId);
            config!.Deactivate(adminUser);
            await db.SaveChangesAsync();

            var landingHandler = new GetScanToPayLandingHandler(db);
            var actDeactivated = () => landingHandler.Handle(new GetScanToPayLandingQuery(tokenA), CancellationToken.None);
            await actDeactivated.Should().ThrowAsync<ConflictException>().WithMessage("*deactivated*");
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 3. Payment & Token Failure, Idempotency, and Delayed Callback Recovery
    // ══════════════════════════════════════════════════════════════════════════
    [Fact]
    public async Task FailureAndRecovery_IdempotencyAndDelayedCallback()
    {
        var dbName = Guid.NewGuid().ToString();
        var adminUser = "admin@majiledger.com";
        var mockGateway = new MockPaymentGateway();
        var failingSts = new MockStsService { ShouldFail = true };
        var mockSms = new MockSmsService();

        Guid meterId, configId, qrId;
        string publicToken;

        using (var db = CreateDbContext(dbName))
        {
            var prop = Property.Create("Highland View", PropertyType.Residential, createdBy: adminUser);
            db.Properties.Add(prop);
            var bld = Building.Create(prop.Id, "Wing A", floorCount: 2, createdBy: adminUser);
            db.Buildings.Add(bld);
            var apt = Apartment.Create(bld.Id, "10", createdBy: adminUser);
            db.Apartments.Add(apt);
            var meter = Meter.Create("MTR-HV-10", currentApartmentId: apt.Id, createdBy: adminUser);
            db.Meters.Add(meter);

            var config = PaymentProviderConfig.Create(PaymentProviderType.MpesaPaybill, "333444", "Highland Water", EnvironmentType.Production, prop.Id, adminUser);
            db.PaymentProviderConfigs.Add(config);

            var qr = QrCodeRegistration.Create(meter.Id, config.Id, adminUser);
            db.QrCodeRegistrations.Add(qr);

            await db.SaveChangesAsync();
            meterId = meter.Id;
            configId = config.Id;
            qrId = qr.Id;
            publicToken = qr.PublicToken;
        }

        // Step A: Payment Initiation
        PaymentInitiationDto initResult;
        using (var db = CreateDbContext(dbName))
        {
            var payHandler = new InitiateQrPaymentHandler(db, mockGateway);
            initResult = await payHandler.Handle(new InitiateQrPaymentCommand(publicToken, "0711223344", 600m), CancellationToken.None);
        }

        // Step B: Payment Confirmed by provider, but STS dispenser times out
        using (var db = CreateDbContext(dbName))
        {
            var fulfillment = new PaymentFulfillmentService(db, new TariffCalculatorService(), failingSts, mockSms);
            var confirmHandler = new ConfirmPaymentHandler(db, fulfillment);

            // Does NOT crash; catches exception, retains confirmed payment and marks purchase TokenFailed
            await confirmHandler.Handle(new ConfirmPaymentCommand(
                initResult.ProviderCheckoutId!,
                "MPESA_REC_DELAYED_1",
                600m,
                DateTime.UtcNow,
                Succeeded: true,
                FailureReason: null), CancellationToken.None);

            var payment = await db.Payments.FirstOrDefaultAsync(p => p.ProviderRef == "MPESA_REC_DELAYED_1");
            payment.Should().NotBeNull();
            payment!.AmountConfirmed.Should().Be(600m);

            var purchase = await db.WaterPurchases
                .Include(wp => wp.TokenGenerationAttempts)
                .FirstOrDefaultAsync(wp => wp.PaymentId == payment.Id);
            purchase.Should().NotBeNull();
            purchase!.Status.Should().Be(WaterPurchaseStatus.TokenFailed);
            purchase.TokenGenerationAttempts.Should().HaveCount(1);
            purchase.TokenGenerationAttempts.First().Succeeded.Should().BeFalse();
        }

        // Step C: Duplicate Callback arrived from provider — must be completely idempotent
        using (var db = CreateDbContext(dbName))
        {
            var fulfillment = new PaymentFulfillmentService(db, new TariffCalculatorService(), failingSts, mockSms);
            var confirmHandler = new ConfirmPaymentHandler(db, fulfillment);

            var actDuplicate = () => confirmHandler.Handle(new ConfirmPaymentCommand(
                initResult.ProviderCheckoutId!,
                "MPESA_REC_DELAYED_1",
                600m,
                DateTime.UtcNow,
                Succeeded: true,
                FailureReason: null), CancellationToken.None);

            await actDuplicate.Should().NotThrowAsync();

            var paymentCount = await db.Payments.CountAsync();
            paymentCount.Should().Be(1);
        }

        // Step D: Background Reconciliation / STS recovery retry
        using (var db = CreateDbContext(dbName))
        {
            var recoveredSts = new MockStsService { ShouldFail = false };
            var fulfillment = new PaymentFulfillmentService(db, new TariffCalculatorService(), recoveredSts, mockSms);

            var attempt = await db.PaymentAttempts
                .Include(a => a.Payment)
                .FirstAsync(a => a.Id == initResult.AttemptId);

            // Re-run fulfillment for existing payment
            var purchase = await fulfillment.ProcessConfirmedPaymentAsync(attempt, "MPESA_REC_DELAYED_1", 600m, DateTime.UtcNow);

            purchase.Status.Should().Be(WaterPurchaseStatus.TokenIssued);

            var token = await db.WaterTokens.FirstOrDefaultAsync(t => t.WaterPurchaseId == purchase.Id);
            token.Should().NotBeNull();
            token!.StsToken.Should().Be("6152-7718-9901-2345-8812");
            token.Status.Should().Be(WaterTokenStatus.Delivered);

            // Total payments in system is still strictly 1
            (await db.Payments.CountAsync()).Should().Be(1);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 4. Tenancy & Meter Reassignment Traceability
    // ══════════════════════════════════════════════════════════════════════════
    [Fact]
    public async Task TenancyChange_And_MeterReassignment_MaintainsImmutableAudit()
    {
        var dbName = Guid.NewGuid().ToString();
        var adminUser = "admin@majiledger.com";

        Guid meterId, apt1Id, apt2Id;

        using (var db = CreateDbContext(dbName))
        {
            var prop = Property.Create("Acacia Park", PropertyType.Residential, createdBy: adminUser);
            db.Properties.Add(prop);
            var bld = Building.Create(prop.Id, "Block A", floorCount: 2, createdBy: adminUser);
            db.Buildings.Add(bld);
            var apt1 = Apartment.Create(bld.Id, "Apt 1", createdBy: adminUser);
            var apt2 = Apartment.Create(bld.Id, "Apt 2", createdBy: adminUser);
            db.Apartments.AddRange(apt1, apt2);

            var meter = Meter.Create("MTR-ACACIA-1", currentApartmentId: apt1.Id, createdBy: adminUser);
            db.Meters.Add(meter);
            await db.SaveChangesAsync();

            meterId = meter.Id;
            apt1Id = apt1.Id;
            apt2Id = apt2.Id;

            // Historical payment under Apt 1
            var config = PaymentProviderConfig.Create(PaymentProviderType.MpesaPaybill, "555111", "Acacia Water", EnvironmentType.Production, prop.Id, adminUser);
            db.PaymentProviderConfigs.Add(config);
            await db.SaveChangesAsync();

            var att = PaymentAttempt.Initiate(meter.Id, config.Id, PaymentChannel.ScanToPay, "0700000001", 1000m);
            att.Confirm();
            db.PaymentAttempts.Add(att);
            await db.SaveChangesAsync();

            var pay = Payment.Confirm(att.Id, "HIST_PAY_APT1", 1000m, DateTime.UtcNow.AddMonths(-1));
            db.Payments.Add(pay);
            await db.SaveChangesAsync();

            var pur = WaterPurchase.Create(pay.Id, meter.Id, 1000m, 10m);
            pur.MarkTokenIssued();
            db.WaterPurchases.Add(pur);
            await db.SaveChangesAsync();
        }

        // Tenant moves out, meter reassigned to Apt 2
        using (var db = CreateDbContext(dbName))
        {
            var meter = await db.Meters.FindAsync(meterId);
            meter!.AssignToApartment(apt2Id, adminUser);
            await db.SaveChangesAsync();
        }

        // Verify historical payment and water purchase remained immutably linked
        using (var db = CreateDbContext(dbName))
        {
            var historicalPurchase = await db.WaterPurchases
                .Include(wp => wp.Payment)
                    .ThenInclude(p => p.PaymentAttempt)
                .FirstAsync(wp => wp.Payment.ProviderRef == "HIST_PAY_APT1");

            historicalPurchase.Should().NotBeNull();
            historicalPurchase.AmountApplied.Should().Be(1000m);
            historicalPurchase.UnitsCalculated.Should().Be(10m);
            historicalPurchase.Payment.PaymentAttempt.MeterId.Should().Be(meterId);

            // Meter's current assignment is now Apt 2
            var meter = await db.Meters.FindAsync(meterId);
            meter!.CurrentApartmentId.Should().Be(apt2Id);
        }
    }
}
