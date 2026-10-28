using FluentAssertions;
using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Features.Dashboard;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MajiLedger.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MajiLedger.Tests.Integration;

public class DashboardWorkflowTests
{
    private MajiLedgerDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<MajiLedgerDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new MajiLedgerDbContext(options);
    }

    [Fact]
    public async Task AdminDashboard_ReturnsAggregates_And_CountsOnlyConfirmedPaymentsAsCollections()
    {
        var dbName = Guid.NewGuid().ToString();

        Guid propId, bldId, aptId, meterId, qrId, configId;

        using (var db = CreateDbContext(dbName))
        {
            var prop = Property.Create("Sunrise Towers", PropertyType.Residential, "Kileleshwa", "Nairobi", createdBy: "admin");
            db.Properties.Add(prop);
            await db.SaveChangesAsync();
            propId = prop.Id;

            var bld = Building.Create(propId, "Tower A", totalFloors: 5, createdBy: "admin");
            db.Buildings.Add(bld);
            await db.SaveChangesAsync();
            bldId = bld.Id;

            var apt = Apartment.Create(bldId, "A-101", floor: "1", createdBy: "admin");
            db.Apartments.Add(apt);
            await db.SaveChangesAsync();
            aptId = apt.Id;

            var meter = Meter.Create("WM-SUNRISE-101", MeterType.Prepaid, currentApartmentId: aptId, createdBy: "admin");
            db.Meters.Add(meter);
            await db.SaveChangesAsync();
            meterId = meter.Id;

            var config = PaymentProviderConfig.Create(
                PaymentProviderType.MpesaPaybill,
                "Sunrise Paybill",
                "654321",
                "consumerKey",
                "consumerSecret",
                "passkey",
                EnvironmentType.Sandbox,
                isApproved: true,
                approvedBy: "admin");
            db.PaymentProviderConfigs.Add(config);
            await db.SaveChangesAsync();
            configId = config.Id;

            var qr = QrCodeRegistration.Create(
                meterId,
                configId,
                "sunrise_qr_token",
                "data:image/png;base64,mock",
                "http://localhost:3000/pay/sunrise_qr_token",
                createdBy: "admin");
            db.QrCodeRegistrations.Add(qr);
            await db.SaveChangesAsync();
            qrId = qr.Id;

            // 1. Confirmed ScanToPay payment of 1,500 KES
            var attempt1 = PaymentAttempt.Initiate(meterId, configId, PaymentChannel.ScanToPay, "254711000111", 1500m, qrId);
            attempt1.MarkConfirmed("WS12345678");
            db.PaymentAttempts.Add(attempt1);
            await db.SaveChangesAsync();

            var payment1 = Payment.Confirm(attempt1.Id, "WS12345678", 1500m, DateTime.UtcNow);
            db.Payments.Add(payment1);
            await db.SaveChangesAsync();

            var purchase1 = WaterPurchase.Create(payment1.Id, meterId, 1500m, unitsCalculated: 15.5m, tariffSnapshotJson: "{}");
            purchase1.MarkTokenIssued();
            db.WaterPurchases.Add(purchase1);
            await db.SaveChangesAsync();

            var token1 = WaterToken.Create(purchase1.Id, "1234-5678-9012-3456", 15.5m);
            db.WaterTokens.Add(token1);
            await db.SaveChangesAsync();

            var sms1 = SmsDeliveryRecord.Create(token1.Id, "254711000111", "Token: 1234-5678-9012-3456");
            sms1.MarkDelivered("EXT-SMS-001");
            db.SmsDeliveryRecords.Add(sms1);
            await db.SaveChangesAsync();

            // 2. Confirmed MpesaPaybill payment of 2,000 KES
            var attempt2 = PaymentAttempt.Initiate(meterId, configId, PaymentChannel.MpesaPaybill, "254722000222", 2000m);
            attempt2.MarkConfirmed("WS87654321");
            db.PaymentAttempts.Add(attempt2);
            await db.SaveChangesAsync();

            var payment2 = Payment.Confirm(attempt2.Id, "WS87654321", 2000m, DateTime.UtcNow);
            db.Payments.Add(payment2);
            await db.SaveChangesAsync();

            var purchase2 = WaterPurchase.Create(payment2.Id, meterId, 2000m, unitsCalculated: 20.0m, tariffSnapshotJson: "{}");
            purchase2.MarkTokenIssued();
            db.WaterPurchases.Add(purchase2);
            await db.SaveChangesAsync();

            // 3. Failed payment attempt of 5,000 KES (MUST NOT be counted in revenue!)
            var attempt3 = PaymentAttempt.Initiate(meterId, configId, PaymentChannel.ScanToPay, "254733000333", 5000m, qrId);
            attempt3.MarkFailed("Insufficient balance");
            db.PaymentAttempts.Add(attempt3);

            // 4. Initiated (pending) payment attempt of 3,000 KES (MUST NOT be counted in revenue!)
            var attempt4 = PaymentAttempt.Initiate(meterId, configId, PaymentChannel.ScanToPay, "254744000444", 3000m, qrId);
            db.PaymentAttempts.Add(attempt4);

            await db.SaveChangesAsync();
        }

        using (var db = CreateDbContext(dbName))
        {
            var handler = new GetAdminDashboardHandler(db);
            var result = await handler.Handle(new GetAdminDashboardQuery(), CancellationToken.None);

            result.TotalProperties.Should().Be(1);
            result.TotalBuildings.Should().Be(1);
            result.TotalApartments.Should().Be(1);
            result.TotalMeters.Should().Be(1);
            result.ActiveQrRegistrations.Should().Be(1);

            // Financial correctness: 1,500 + 2,000 = 3,500 (5,000 and 3,000 NOT included)
            result.Financials.GrossConfirmedCollections.Should().Be(3500m);
            result.Financials.TotalUnitsPurchased.Should().Be(35.5m);
            result.Financials.ConfirmedPaymentCount.Should().Be(2);
            result.Financials.PendingAttemptCount.Should().Be(1);
            result.Financials.FailedAttemptCount.Should().Be(1);
            result.Financials.TokenIssuedCount.Should().Be(2);
            result.Financials.SmsDeliveredCount.Should().Be(1);

            // Channel breakdown
            result.ChannelBreakdown.ScanToPayAmount.Should().Be(1500m);
            result.ChannelBreakdown.ScanToPayCount.Should().Be(1);
            result.ChannelBreakdown.PaybillAmount.Should().Be(2000m);
            result.ChannelBreakdown.PaybillCount.Should().Be(1);

            // Property summaries
            result.PropertySummaries.Should().HaveCount(1);
            result.PropertySummaries[0].PropertyName.Should().Be("Sunrise Towers");
            result.PropertySummaries[0].ConfirmedCollections.Should().Be(3500m);
            result.PropertySummaries[0].ConfirmedPaymentCount.Should().Be(2);
        }
    }

    [Fact]
    public async Task OwnerDashboard_StrictlyIsolates_CrossOwnerData()
    {
        var dbName = Guid.NewGuid().ToString();

        Guid ownerAId, ownerBId;
        Guid propAId, propBId;

        using (var db = CreateDbContext(dbName))
        {
            // Owner A
            var ownerA = Owner.Create("Alice Muthoni", "0711111111", "alice@example.com", "ID111", "KRA111", "admin");
            db.Owners.Add(ownerA);
            // Owner B
            var ownerB = Owner.Create("Bob Otieno", "0722222222", "bob@example.com", "ID222", "KRA222", "admin");
            db.Owners.Add(ownerB);
            await db.SaveChangesAsync();
            ownerAId = ownerA.Id;
            ownerBId = ownerB.Id;

            // Property A
            var propA = Property.Create("Alice Court", PropertyType.Residential, "Westlands", "Nairobi", createdBy: "admin");
            db.Properties.Add(propA);
            // Property B
            var propB = Property.Create("Bob Plaza", PropertyType.Commercial, "Upperhill", "Nairobi", createdBy: "admin");
            db.Properties.Add(propB);
            await db.SaveChangesAsync();
            propAId = propA.Id;
            propBId = propB.Id;

            // Link ownerships
            var poA = PropertyOwnership.Assign(ownerAId, propAId, OwnershipRole.PrimaryOwner, "admin");
            var poB = PropertyOwnership.Assign(ownerBId, propBId, OwnershipRole.PrimaryOwner, "admin");
            db.PropertyOwnerships.AddRange(poA, poB);

            // Building and meter for Property A
            var bldA = Building.Create(propAId, "Block A", createdBy: "admin");
            db.Buildings.Add(bldA);
            await db.SaveChangesAsync();

            var aptA = Apartment.Create(bldA.Id, "101", createdBy: "admin");
            db.Apartments.Add(aptA);
            await db.SaveChangesAsync();

            var meterA = Meter.Create("MTR-A", currentApartmentId: aptA.Id, createdBy: "admin");
            db.Meters.Add(meterA);

            // Building and meter for Property B
            var bldB = Building.Create(propBId, "Block B", createdBy: "admin");
            db.Buildings.Add(bldB);
            await db.SaveChangesAsync();

            var aptB = Apartment.Create(bldB.Id, "201", createdBy: "admin");
            db.Apartments.Add(aptB);
            await db.SaveChangesAsync();

            var meterB = Meter.Create("MTR-B", currentApartmentId: aptB.Id, createdBy: "admin");
            db.Meters.Add(meterB);
            await db.SaveChangesAsync();

            var config = PaymentProviderConfig.Create(
                PaymentProviderType.MpesaPaybill,
                "Shared Paybill",
                "888888",
                "key", "secret", "passkey",
                EnvironmentType.Sandbox,
                isApproved: true,
                approvedBy: "admin");
            db.PaymentProviderConfigs.Add(config);
            await db.SaveChangesAsync();

            // Payments for Owner A's meter: 1,000 KES
            var attemptA = PaymentAttempt.Initiate(meterA.Id, config.Id, PaymentChannel.ScanToPay, "254711000000", 1000m);
            attemptA.MarkConfirmed("TXA111");
            db.PaymentAttempts.Add(attemptA);
            await db.SaveChangesAsync();

            var payA = Payment.Confirm(attemptA.Id, "TXA111", 1000m, DateTime.UtcNow);
            db.Payments.Add(payA);
            await db.SaveChangesAsync();

            var purchaseA = WaterPurchase.Create(payA.Id, meterA.Id, 1000m, unitsCalculated: 10m, "{}");
            purchaseA.MarkTokenIssued();
            db.WaterPurchases.Add(purchaseA);

            // Payments for Owner B's meter: 50,000 KES
            var attemptB = PaymentAttempt.Initiate(meterB.Id, config.Id, PaymentChannel.ScanToPay, "254722000000", 50000m);
            attemptB.MarkConfirmed("TXB222");
            db.PaymentAttempts.Add(attemptB);
            await db.SaveChangesAsync();

            var payB = Payment.Confirm(attemptB.Id, "TXB222", 50000m, DateTime.UtcNow);
            db.Payments.Add(payB);
            await db.SaveChangesAsync();

            var purchaseB = WaterPurchase.Create(payB.Id, meterB.Id, 50000m, unitsCalculated: 500m, "{}");
            purchaseB.MarkTokenIssued();
            db.WaterPurchases.Add(purchaseB);

            await db.SaveChangesAsync();
        }

        using (var db = CreateDbContext(dbName))
        {
            var handler = new GetOwnerDashboardHandler(db);

            // Owner A queries dashboard
            var ownerAResult = await handler.Handle(new GetOwnerDashboardQuery(ownerAId), CancellationToken.None);

            ownerAResult.OwnerName.Should().Be("Alice Muthoni");
            ownerAResult.AuthorizedPropertyCount.Should().Be(1);
            ownerAResult.Financials.GrossConfirmedCollections.Should().Be(1000m);
            ownerAResult.Financials.TotalUnitsPurchased.Should().Be(10m);
            ownerAResult.PropertySummaries.Should().HaveCount(1);
            ownerAResult.PropertySummaries[0].PropertyName.Should().Be("Alice Court");

            // Owner B queries dashboard
            var ownerBResult = await handler.Handle(new GetOwnerDashboardQuery(ownerBId), CancellationToken.None);

            ownerBResult.OwnerName.Should().Be("Bob Otieno");
            ownerBResult.AuthorizedPropertyCount.Should().Be(1);
            ownerBResult.Financials.GrossConfirmedCollections.Should().Be(50000m);
            ownerBResult.Financials.TotalUnitsPurchased.Should().Be(500m);
            ownerBResult.PropertySummaries.Should().HaveCount(1);
            ownerBResult.PropertySummaries[0].PropertyName.Should().Be("Bob Plaza");

            // Verify owner A cannot query owner B's QR analytics
            var qrHandler = new GetOwnerQrAnalyticsHandler(db);
            var act = async () => await qrHandler.Handle(
                new GetOwnerQrAnalyticsQuery(OwnerId: ownerAId, PropertyId: propBId),
                CancellationToken.None);

            await act.Should().ThrowAsync<ForbiddenException>();
        }
    }

    [Fact]
    public async Task QrAnalytics_ReturnsCompleteTraceabilityChain()
    {
        var dbName = Guid.NewGuid().ToString();

        Guid qrRegId;

        using (var db = CreateDbContext(dbName))
        {
            var prop = Property.Create("Green Ridge", PropertyType.Residential, "Nakuru", "Nakuru", createdBy: "admin");
            db.Properties.Add(prop);
            await db.SaveChangesAsync();

            var bld = Building.Create(prop.Id, "Block C", createdBy: "admin");
            db.Buildings.Add(bld);
            await db.SaveChangesAsync();

            var apt = Apartment.Create(bld.Id, "C-04", floor: "G", createdBy: "admin");
            db.Apartments.Add(apt);
            await db.SaveChangesAsync();

            var meter = Meter.Create("MTR-GR-C04-9876", currentApartmentId: apt.Id, createdBy: "admin");
            db.Meters.Add(meter);
            await db.SaveChangesAsync();

            var config = PaymentProviderConfig.Create(
                PaymentProviderType.MpesaPaybill,
                "GreenRidge Paybill",
                "123987",
                "key", "secret", "pass",
                EnvironmentType.Sandbox,
                isApproved: true,
                approvedBy: "admin");
            db.PaymentProviderConfigs.Add(config);
            await db.SaveChangesAsync();

            var qr = QrCodeRegistration.Create(
                meter.Id,
                config.Id,
                "trace_qr_public_token",
                "mock_qr_image",
                "http://localhost:3000/pay/trace_qr_public_token",
                createdBy: "admin");
            db.QrCodeRegistrations.Add(qr);
            await db.SaveChangesAsync();
            qrRegId = qr.Id;

            // Attempt 1: Confirmed
            var att1 = PaymentAttempt.Initiate(meter.Id, config.Id, PaymentChannel.ScanToPay, "254700000001", 1200m, qr.Id);
            att1.MarkConfirmed("MPE111");
            db.PaymentAttempts.Add(att1);
            await db.SaveChangesAsync();

            var pay1 = Payment.Confirm(att1.Id, "MPE111", 1200m, DateTime.UtcNow);
            db.Payments.Add(pay1);
            await db.SaveChangesAsync();

            var pur1 = WaterPurchase.Create(pay1.Id, meter.Id, 1200m, 12m, "{}");
            pur1.MarkTokenIssued();
            db.WaterPurchases.Add(pur1);
            await db.SaveChangesAsync();

            var tok1 = WaterToken.Create(pur1.Id, "9999-8888-7777-6666", 12m);
            db.WaterTokens.Add(tok1);
            await db.SaveChangesAsync();

            var sms1 = SmsDeliveryRecord.Create(tok1.Id, "254700000001", "SMS 1");
            sms1.MarkDelivered("SMS-OK-1");
            db.SmsDeliveryRecords.Add(sms1);

            // Attempt 2: Failed
            var att2 = PaymentAttempt.Initiate(meter.Id, config.Id, PaymentChannel.ScanToPay, "254700000002", 2000m, qr.Id);
            att2.MarkFailed("User cancelled");
            db.PaymentAttempts.Add(att2);

            await db.SaveChangesAsync();
        }

        using (var db = CreateDbContext(dbName))
        {
            var handler = new GetQrAnalyticsHandler(db);
            var result = await handler.Handle(new GetQrAnalyticsQuery(QrRegistrationId: qrRegId), CancellationToken.None);

            result.TotalRegistrations.Should().Be(1);
            result.ActiveRegistrations.Should().Be(1);
            result.TotalConfirmedRevenue.Should().Be(1200m);
            result.TotalUnitsPurchased.Should().Be(12m);
            result.TotalPaymentAttempts.Should().Be(2);
            result.ConfirmedPayments.Should().Be(1);

            var reg = result.Registrations.Should().ContainSingle().Subject;
            reg.MeterNumber.Should().Be("MTR-GR-C04-9876");
            reg.MaskedMeterIdentifier.Should().Be("****9876");
            reg.UnitNumber.Should().Be("C-04");
            reg.BuildingName.Should().Be("Block C");
            reg.PropertyName.Should().Be("Green Ridge");
            reg.BusinessShortCode.Should().Be("123987");
            reg.TotalPaymentAttempts.Should().Be(2);
            reg.ConfirmedPayments.Should().Be(1);
            reg.TotalConfirmedAmount.Should().Be(1200m);
            reg.TotalUnitsPurchased.Should().Be(12m);
            reg.TokenIssuedCount.Should().Be(1);
            reg.TokenFailedCount.Should().Be(0);
            reg.SmsDeliveredCount.Should().Be(1);
            reg.SmsFailedCount.Should().Be(0);
        }
    }
}
