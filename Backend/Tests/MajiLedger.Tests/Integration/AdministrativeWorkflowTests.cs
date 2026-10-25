using FluentAssertions;
using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Features.Meters;
using MajiLedger.Application.Features.Owners;
using MajiLedger.Application.Features.Payments;
using MajiLedger.Application.Features.Properties;
using MajiLedger.Application.Features.QrCodes;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MajiLedger.Infrastructure.Persistence;
using MajiLedger.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MajiLedger.Tests.Integration;

public class AdministrativeWorkflowTests
{
    private MajiLedgerDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<MajiLedgerDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new MajiLedgerDbContext(options);
    }

    [Fact]
    public async Task FullAdministrativeWorkflow_PropertyHierarchy_QrRegistration_Lifecycle_And_DestinationValidation()
    {
        var dbName = Guid.NewGuid().ToString();
        var qrGenerator = new QrCodeGeneratorService();
        var adminUser = "admin@majiledger.com";

        // ══════════════════════════════════════════════════════════════════════════
        // 1. Property Management Hierarchy Setup
        // ══════════════════════════════════════════════════════════════════════════
        using (var db = CreateDbContext(dbName))
        {
            // Create Owner
            var ownerHandler = new CreateOwnerHandler(db);
            var ownerId = await ownerHandler.Handle(
                new CreateOwnerCommand("John Kamau", "0722111222", "john@example.com", "ID12345678", "A001234567Z", adminUser),
                CancellationToken.None);

            // Create Property
            var propertyHandler = new CreatePropertyHandler(db);
            var propertyId = await propertyHandler.Handle(
                new CreatePropertyCommand("Oakwood Heights", PropertyType.Residential, "Ngong Road", "Nairobi", "Kilimani", "00100", "Luxury apartments", adminUser),
                CancellationToken.None);

            // Assign Owner to Property
            var assignOwnershipHandler = new AssignPropertyOwnershipHandler(db);
            var ownershipId = await assignOwnershipHandler.Handle(
                new AssignPropertyOwnershipCommand(ownerId, propertyId, OwnershipRole.PrimaryOwner, adminUser),
                CancellationToken.None);

            ownershipId.Should().NotBeEmpty();

            // Create Building
            var buildingHandler = new CreateBuildingHandler(db);
            var buildingId = await buildingHandler.Handle(
                new CreateBuildingCommand(propertyId, "Block A - Acacia", 4, "Acacia Wing", adminUser),
                CancellationToken.None);

            // Create Apartment
            var apartmentHandler = new CreateApartmentHandler(db);
            var apartmentId = await apartmentHandler.Handle(
                new CreateApartmentCommand(buildingId, "A-204", "2nd Floor", "2 Bedroom Unit", adminUser),
                CancellationToken.None);

            // Create Meter
            var meterHandler = new CreateMeterHandler(db);
            var meterId = await meterHandler.Handle(
                new CreateMeterCommand("MTR-9941-8802", MeterType.Prepaid, "SN-4410-09", apartmentId, adminUser),
                CancellationToken.None);

            // Assign Meter to Apartment
            var assignMeterHandler = new AssignMeterToApartmentHandler(db);
            await assignMeterHandler.Handle(
                new AssignMeterToApartmentCommand(meterId, apartmentId, adminUser),
                CancellationToken.None);

            // Create Payment Provider Config for Oakwood Heights
            var config = PaymentProviderConfig.Create(
                PaymentProviderType.MpesaPaybill, "400200", "Oakwood Heights Water", EnvironmentType.Production, propertyId, adminUser);
            db.PaymentProviderConfigs.Add(config);

            // Create another property and config to test cross-property destination mismatch
            var otherProperty = Property.Create("Sunrise Ridge", PropertyType.Residential, "Thika Road", createdBy: adminUser);
            db.Properties.Add(otherProperty);
            var otherConfig = PaymentProviderConfig.Create(
                PaymentProviderType.MpesaPaybill, "500300", "Sunrise Ridge Water", EnvironmentType.Production, otherProperty.Id, adminUser);
            db.PaymentProviderConfigs.Add(otherConfig);

            await db.SaveChangesAsync();
        }

        // ══════════════════════════════════════════════════════════════════════════
        // 2. Cross-Property Destination Mismatch Rejection
        // ══════════════════════════════════════════════════════════════════════════
        using (var db = CreateDbContext(dbName))
        {
            var meter = await db.Meters.FirstAsync(m => m.MeterNumber == "MTR-9941-8802");
            var otherConfig = await db.PaymentProviderConfigs.FirstAsync(c => c.BusinessShortCode == "500300");

            var previewHandler = new PreviewQrRegistrationHandler(db);
            var previewResult = await previewHandler.Handle(
                new PreviewQrRegistrationQuery(meter.Id, otherConfig.Id), CancellationToken.None);

            previewResult.IsValid.Should().BeFalse();
            previewResult.ValidationMessage.Should().Contain("restricted to another property");

            var registerHandler = new RegisterQrCodeFeatureHandler(db);
            var act = () => registerHandler.Handle(
                new RegisterQrCodeCommand(meter.Id, otherConfig.Id, adminUser), CancellationToken.None);

            await act.Should().ThrowAsync<ConflictException>()
                .WithMessage("*cannot be used for property*");
        }

        // ══════════════════════════════════════════════════════════════════════════
        // 3. Pre-Registration Destination Preview (Valid Matching Config)
        // ══════════════════════════════════════════════════════════════════════════
        using (var db = CreateDbContext(dbName))
        {
            var meter = await db.Meters.FirstAsync(m => m.MeterNumber == "MTR-9941-8802");
            var validConfig = await db.PaymentProviderConfigs.FirstAsync(c => c.BusinessShortCode == "400200");

            var previewHandler = new PreviewQrRegistrationHandler(db);
            var preview = await previewHandler.Handle(
                new PreviewQrRegistrationQuery(meter.Id, validConfig.Id), CancellationToken.None);

            preview.IsValid.Should().BeTrue();
            preview.PropertyName.Should().Be("Oakwood Heights");
            preview.BuildingName.Should().Be("Block A - Acacia");
            preview.UnitNumber.Should().Be("A-204");
            preview.BusinessShortCode.Should().Be("400200");
            preview.MaskedIdentifier.Should().Be("****8802");
        }

        // ══════════════════════════════════════════════════════════════════════════
        // 4. Register QR Code & Generate Printable Sticker
        // ══════════════════════════════════════════════════════════════════════════
        string publicToken;
        Guid registrationId;

        using (var db = CreateDbContext(dbName))
        {
            var meter = await db.Meters.FirstAsync(m => m.MeterNumber == "MTR-9941-8802");
            var validConfig = await db.PaymentProviderConfigs.FirstAsync(c => c.BusinessShortCode == "400200");

            var registerHandler = new RegisterQrCodeFeatureHandler(db);
            var reg = await registerHandler.Handle(
                new RegisterQrCodeCommand(meter.Id, validConfig.Id, adminUser), CancellationToken.None);

            reg.Should().NotBeNull();
            reg.PublicToken.Should().NotBeNullOrWhiteSpace();
            reg.Status.Should().Be(QrCodeStatus.Active);
            reg.UnitNumber.Should().Be("A-204");
            reg.PropertyName.Should().Be("Oakwood Heights");

            publicToken = reg.PublicToken;
            registrationId = reg.Id;

            // Verify Audit Log recorded
            var auditLog = await db.QrCodeAuditLogs.FirstOrDefaultAsync(l => l.QrCodeRegistrationId == reg.Id);
            auditLog.Should().NotBeNull();
            auditLog!.EventType.Should().Be(QrCodeAuditEvent.Created);
            auditLog.PerformedBy.Should().Be(adminUser);

            // Verify Sticker generation
            var stickerHandler = new GetMeterStickerHandler(db, qrGenerator);
            var sticker = await stickerHandler.Handle(new GetMeterStickerQuery(reg.Id), CancellationToken.None);

            sticker.Should().NotBeNull();
            sticker.PaymentUrl.Should().Be($"https://pay.majiledger.com/p/{publicToken}");
            sticker.QrCodeSvg.Should().Contain("<svg");
            sticker.QrCodeDataUri.Should().StartWith("data:image/svg+xml;base64,");
            sticker.UnitNumber.Should().Be("A-204");
            sticker.PropertyName.Should().Be("Oakwood Heights");
        }

        // ══════════════════════════════════════════════════════════════════════════
        // 5. Customer Scan-to-Pay Lookup
        // ══════════════════════════════════════════════════════════════════════════
        using (var db = CreateDbContext(dbName))
        {
            var landingHandler = new GetScanToPayLandingHandler(db);
            var landing = await landingHandler.Handle(new GetScanToPayLandingQuery(publicToken), CancellationToken.None);

            landing.Should().NotBeNull();
            landing.PropertyName.Should().Be("Oakwood Heights");
            landing.BuildingName.Should().Be("Block A - Acacia");
            landing.UnitNumber.Should().Be("A-204");
            landing.BusinessShortCode.Should().Be("400200");
            landing.MaskedMeterIdentifier.Should().Be("****8802");
        }

        // ══════════════════════════════════════════════════════════════════════════
        // 6. Disable QR Code -> Verify Access is Blocked
        // ══════════════════════════════════════════════════════════════════════════
        using (var db = CreateDbContext(dbName))
        {
            var disableHandler = new DisableQrCodeHandler(db);
            await disableHandler.Handle(new DisableQrCodeCommand(registrationId, adminUser), CancellationToken.None);

            // Audit log check
            var audit = await db.QrCodeAuditLogs.OrderByDescending(a => a.OccurredAt).FirstAsync();
            audit.EventType.Should().Be(QrCodeAuditEvent.Disabled);

            // Customer lookup must throw ConflictException
            var landingHandler = new GetScanToPayLandingHandler(db);
            var actLanding = () => landingHandler.Handle(new GetScanToPayLandingQuery(publicToken), CancellationToken.None);
            await actLanding.Should().ThrowAsync<ConflictException>()
                .WithMessage("*temporarily disabled*");

            // Customer payment attempt initiation must throw ConflictException
            var paymentHandler = new InitiateQrPaymentHandler(db);
            var actPay = () => paymentHandler.Handle(
                new InitiateQrPaymentCommand(publicToken, "0712345678", 500m), CancellationToken.None);
            await actPay.Should().ThrowAsync<ConflictException>()
                .WithMessage("*temporarily disabled*");
        }

        // ══════════════════════════════════════════════════════════════════════════
        // 7. Enable QR Code -> Verify Access is Restored
        // ══════════════════════════════════════════════════════════════════════════
        using (var db = CreateDbContext(dbName))
        {
            var enableHandler = new EnableQrCodeHandler(db);
            await enableHandler.Handle(new EnableQrCodeCommand(registrationId, adminUser), CancellationToken.None);

            var landingHandler = new GetScanToPayLandingHandler(db);
            var landing = await landingHandler.Handle(new GetScanToPayLandingQuery(publicToken), CancellationToken.None);
            landing.Should().NotBeNull();
            landing.PropertyName.Should().Be("Oakwood Heights");
        }

        // ══════════════════════════════════════════════════════════════════════════
        // 8. Replace QR Code -> Verify Old is Revoked & New is Active
        // ══════════════════════════════════════════════════════════════════════════
        string newToken;
        using (var db = CreateDbContext(dbName))
        {
            var meter = await db.Meters.FirstAsync(m => m.MeterNumber == "MTR-9941-8802");
            var validConfig = await db.PaymentProviderConfigs.FirstAsync(c => c.BusinessShortCode == "400200");

            var replaceHandler = new ReplaceQrCodeFeatureHandler(db);
            var replacement = await replaceHandler.Handle(
                new ReplaceQrCodeCommand(meter.Id, validConfig.Id, "Sticker damaged during painting", adminUser),
                CancellationToken.None);

            replacement.Should().NotBeNull();
            replacement.PublicToken.Should().NotBe(publicToken);
            replacement.Status.Should().Be(QrCodeStatus.Active);
            newToken = replacement.PublicToken;

            // Old QR code must be permanently revoked
            var oldReg = await db.QrCodeRegistrations.FindAsync(registrationId);
            oldReg!.Status.Should().Be(QrCodeStatus.Revoked);
            oldReg.RevokedReason.Should().Be("Sticker damaged during painting");

            // Customer lookup on old token must throw ConflictException
            var landingHandler = new GetScanToPayLandingHandler(db);
            var actOld = () => landingHandler.Handle(new GetScanToPayLandingQuery(publicToken), CancellationToken.None);
            await actOld.Should().ThrowAsync<ConflictException>()
                .WithMessage("*permanently revoked*");

            // Customer lookup on new token must succeed
            var landingNew = await landingHandler.Handle(new GetScanToPayLandingQuery(newToken), CancellationToken.None);
            landingNew.Should().NotBeNull();
            landingNew.UnitNumber.Should().Be("A-204");
        }

        // ══════════════════════════════════════════════════════════════════════════
        // 9. Shared Meter Billing Point Configuration & Validation
        // ══════════════════════════════════════════════════════════════════════════
        using (var db = CreateDbContext(dbName))
        {
            var building = await db.Buildings.FirstAsync();
            var aptB = Apartment.Create(building.Id, "A-205", "2nd Floor", createdBy: adminUser);
            var aptC = Apartment.Create(building.Id, "A-206", "2nd Floor", createdBy: adminUser);
            db.Apartments.AddRange(aptB, aptC);

            var sharedMeter = Meter.Create("MTR-SHARED-01", MeterType.Prepaid, createdBy: adminUser);
            db.Meters.Add(sharedMeter);
            await db.SaveChangesAsync();

            var sharedHandler = new ConfigureSharedMeterBillingPointsHandler(db);

            // Invalid sum (!= 1.0) must throw ValidationException
            var invalidAllocations = new List<SharedBillingAllocationInput>
            {
                new(aptB.Id, 0.4m),
                new(aptC.Id, 0.4m) // Sum = 0.8 != 1.0
            };
            var actInvalid = () => sharedHandler.Handle(
                new ConfigureSharedMeterBillingPointsCommand(sharedMeter.Id, invalidAllocations, adminUser),
                CancellationToken.None);

            await actInvalid.Should().ThrowAsync<ValidationException>()
                .WithMessage("*Sum of allocation fractions must equal 1.0*");

            // Valid sum (0.6 + 0.4 = 1.0) must succeed
            var validAllocations = new List<SharedBillingAllocationInput>
            {
                new(aptB.Id, 0.6m, "60% for 3 bedroom"),
                new(aptC.Id, 0.4m, "40% for 2 bedroom")
            };
            await sharedHandler.Handle(
                new ConfigureSharedMeterBillingPointsCommand(sharedMeter.Id, validAllocations, adminUser),
                CancellationToken.None);

            var queryHandler = new GetMeterSharedBillingPointsHandler(db);
            var points = await queryHandler.Handle(new GetMeterSharedBillingPointsQuery(sharedMeter.Id), CancellationToken.None);

            points.Should().HaveCount(2);
            points.Sum(p => p.AllocationFraction).Should().Be(1.0m);
            points.All(p => p.IsActive).Should().BeTrue();
        }
    }
}
