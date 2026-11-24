using FluentAssertions;
using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.Payments;
using MajiLedger.Application.Features.QrCodes;
using MajiLedger.Application.Features.WaterLedger;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MajiLedger.Infrastructure.Persistence;
using MajiLedger.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MajiLedger.Tests.WaterLedger;

file class TestWaterCurrentUser : ICurrentUserService
{
    public string? UserId => "admin-water";
    public string? Email => "admin@majiledger.com";
    public string? Role => "Admin";
    public bool IsAuthenticated => true;
    public Guid? OwnerId => null;
    public Guid? TenantId => null;
    public IReadOnlyList<Guid> AuthorizedPropertyIds => [];
    public IReadOnlyList<string> Permissions => [];
    public IReadOnlyList<string> Modules => [AppModules.WaterLedger, AppModules.PropertyManagement];

    public bool IsInRole(string role) => Role == role || role == "Admin";
    public bool HasPermission(string permission) => true;
    public bool HasModuleAccess(string module) => true;
    public bool HasPropertyAccess(Guid propertyId) => true;
}

public class WaterLedgerWorkflowTests
{
    private MajiLedgerDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<MajiLedgerDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new MajiLedgerDbContext(options);
    }

    private static async Task<(Guid PropertyId, Guid BuildingId, Guid ApartmentId, Guid MeterId)> SeedPropertyAndApartment(
        MajiLedgerDbContext db,
        string meterNumber = "WM-10001")
    {
        var property = Property.Create("Cascade Estate", PropertyType.Residential, "Kiambu Rd", "Nairobi", "Runda", "00100");
        await db.Set<Property>().AddAsync(property);

        var building = Building.Create(property.Id, "Block B");
        await db.Set<Building>().AddAsync(building);

        var unitType = UnitType.Create("2BR", "Two Bedroom");
        await db.Set<UnitType>().AddAsync(unitType);

        var apartment = Apartment.Create(building.Id, "B02", unitTypeId: unitType.Id, monthlyRent: 35000m);
        await db.Set<Apartment>().AddAsync(apartment);

        var meter = Meter.Create(
            meterNumber: meterNumber,
            type: MeterType.Prepaid,
            serialNumber: "SN-98765",
            currentApartmentId: apartment.Id,
            manufacturer: "Chint",
            model: "DTSY666",
            integrationType: MeterIntegrationType.ApiIntegrated,
            installationDate: DateTime.UtcNow.AddMonths(-2));

        await db.Set<Meter>().AddAsync(meter);

        var assignment = MeterAssignment.Create(meter.Id, apartment.Id, "admin");
        await db.Set<MeterAssignment>().AddAsync(assignment);

        await db.SaveChangesAsync();
        return (property.Id, building.Id, apartment.Id, meter.Id);
    }

    // ── 1. Water Meter Management ─────────────────────────────────────────────

    [Fact]
    public async Task RegisterWaterMeter_ValidData_PersistsSuccessfully()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new TestWaterCurrentUser();

        var (propertyId, buildingId, apartmentId, _) = await SeedPropertyAndApartment(db, "WM-EXISTING");

        // Create a new apartment in same building
        var apt2 = Apartment.Create(buildingId, "B03");
        await db.Set<Apartment>().AddAsync(apt2);
        await db.SaveChangesAsync();

        var handler = new RegisterWaterMeterCommandHandler(db, user);
        var meterId = await handler.Handle(new RegisterWaterMeterCommand(
            MeterNumber: "WM-20002",
            SerialNumber: "SN-55555",
            Manufacturer: "Apator",
            Model: "JS90",
            Type: MeterType.Prepaid,
            IntegrationType: MeterIntegrationType.ApiIntegrated,
            ApartmentId: apt2.Id,
            Notes: "Initial installation"), CancellationToken.None);

        meterId.Should().NotBeEmpty();

        var meter = await db.Meters.FindAsync(meterId);
        meter.Should().NotBeNull();
        meter!.MeterNumber.Should().Be("WM-20002");
        meter.Manufacturer.Should().Be("Apator");
        meter.Model.Should().Be("JS90");
        meter.CurrentApartmentId.Should().Be(apt2.Id);
        meter.Status.Should().Be(MeterStatus.Active);
    }

    [Fact]
    public async Task RegisterWaterMeter_DuplicateMeterNumber_ThrowsConflict()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new TestWaterCurrentUser();
        await SeedPropertyAndApartment(db, "WM-DUPLICATE");

        var handler = new RegisterWaterMeterCommandHandler(db, user);
        var act = async () => await handler.Handle(new RegisterWaterMeterCommand(
            MeterNumber: "WM-DUPLICATE",
            SerialNumber: "SN-9999",
            Manufacturer: "Test",
            Model: "M1",
            Type: MeterType.Prepaid,
            IntegrationType: MeterIntegrationType.ApiIntegrated), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*already exists*");
    }

    [Fact]
    public async Task TransferWaterMeter_ReassignsApartmentAndClosesOldAssignment()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new TestWaterCurrentUser();
        var (propertyId, buildingId, apartmentId, meterId) = await SeedPropertyAndApartment(db, "WM-TRANSFER");

        // Second apartment in same building
        var apt2 = Apartment.Create(buildingId, "B04");
        await db.Set<Apartment>().AddAsync(apt2);
        await db.SaveChangesAsync();

        var handler = new TransferWaterMeterCommandHandler(db, user);
        await handler.Handle(new TransferWaterMeterCommand(meterId, apt2.Id, "Relocation"), CancellationToken.None);

        var updatedMeter = await db.Meters.Include(m => m.Assignments).FirstOrDefaultAsync(m => m.Id == meterId);
        updatedMeter.Should().NotBeNull();
        updatedMeter!.CurrentApartmentId.Should().Be(apt2.Id);

        // Previous assignment closed, new active assignment exists
        var assignments = updatedMeter.Assignments.ToList();
        assignments.Should().HaveCount(2);
        assignments.Count(a => a.IsActive).Should().Be(1);
        assignments.First(a => a.IsActive).ApartmentId.Should().Be(apt2.Id);
    }

    // ── 2. Water Reading & Consumption Tracking ───────────────────────────────

    [Fact]
    public async Task RecordWaterReading_ValidReading_CalculatesConsumptionCorrectly()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new TestWaterCurrentUser();
        var (_, _, _, meterId) = await SeedPropertyAndApartment(db, "WM-READING");

        var handler = new RecordWaterReadingCommandHandler(db, user);

        // First reading: 12.5 m³
        var r1 = await handler.Handle(new RecordWaterReadingCommand(
            meterId, 12.5m, MeterReadingSource.Manual), CancellationToken.None);
        r1.Consumption.Should().Be(12.5m);

        // Second reading: 18.0 m³
        var r2 = await handler.Handle(new RecordWaterReadingCommand(
            meterId, 18.0m, MeterReadingSource.Manual), CancellationToken.None);
        r2.PreviousReading.Should().Be(12.5m);
        r2.CurrentReading.Should().Be(18.0m);
        r2.Consumption.Should().Be(5.5m);

        var meter = await db.Meters.FindAsync(meterId);
        meter!.LastReading.Should().Be(18.0m);
    }

    [Fact]
    public async Task RecordWaterReading_NegativeConsumption_ThrowsException()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new TestWaterCurrentUser();
        var (_, _, _, meterId) = await SeedPropertyAndApartment(db, "WM-NEG-READING");

        var handler = new RecordWaterReadingCommandHandler(db, user);
        await handler.Handle(new RecordWaterReadingCommand(meterId, 50m), CancellationToken.None);

        // Lower reading without correction flag must throw
        var act = async () => await handler.Handle(new RecordWaterReadingCommand(meterId, 45m, IsCorrection: false), CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*cannot be less*");
    }

    // ── 3. Manual Water Token Entry ───────────────────────────────────────────

    [Fact]
    public async Task EnterManualToken_ConfirmedTransaction_GeneratesTokenSuccessfully()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new TestWaterCurrentUser();
        var (propertyId, _, apartmentId, meterId) = await SeedPropertyAndApartment(db, "WM-MANUAL-TOKEN");

        // Record a confirmed water transaction
        var tx = WaterTransaction.Create(
            transactionReference: "WTX-202611-00999",
            propertyId: propertyId,
            unitId: apartmentId,
            waterMeterId: meterId,
            amount: 1000m,
            unitsPurchased: 10m,
            unitPrice: 100m,
            paymentMethod: WaterPaymentMethod.Mpesa,
            phoneNumber: "0722112233",
            transactionDate: DateTime.UtcNow,
            paymentStatus: WaterTransactionPaymentStatus.Confirmed,
            tokenStatus: WaterTransactionTokenStatus.Pending);

        db.WaterTransactions.Add(tx);
        await db.SaveChangesAsync();

        var handler = new EnterManualTokenCommandHandler(db, user);
        var result = await handler.Handle(new EnterManualTokenCommand(
            TransactionId: tx.Id,
            TokenValue: "1234-5678-9012-3456-7890",
            ProviderReference: "MAN-REF-001",
            Notes: "Token generated by vendor portal"), CancellationToken.None);

        result.TokenStatus.Should().Be(WaterTransactionTokenStatus.Generated);
        result.TokenValue.Should().Be("1234-5678-9012-3456-7890");

        var updated = await db.WaterTransactions.FindAsync(tx.Id);
        updated!.TokenStatus.Should().Be(WaterTransactionTokenStatus.Generated);
        updated.TokenValue.Should().Be("1234-5678-9012-3456-7890");
    }

    [Fact]
    public async Task EnterManualToken_UnconfirmedPayment_ThrowsConflict()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new TestWaterCurrentUser();
        var (propertyId, _, apartmentId, meterId) = await SeedPropertyAndApartment(db, "WM-UNCONFIRMED");

        var tx = WaterTransaction.Create(
            "WTX-PENDING", propertyId, apartmentId, meterId,
            500m, 5m, 100m, WaterPaymentMethod.Mpesa, "0722000000", DateTime.UtcNow,
            paymentStatus: WaterTransactionPaymentStatus.Pending);

        db.WaterTransactions.Add(tx);
        await db.SaveChangesAsync();

        var handler = new EnterManualTokenCommandHandler(db, user);
        var act = async () => await handler.Handle(
            new EnterManualTokenCommand(tx.Id, "1111-2222-3333-4444"), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*unconfirmed*");
    }

    // ── 4. Water Dashboard & Reconciliation ───────────────────────────────────

    [Fact]
    public async Task WaterDashboard_AggregatesRevenueUnitsAndConsumption()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new TestWaterCurrentUser();
        var (propertyId, _, apartmentId, meterId) = await SeedPropertyAndApartment(db, "WM-DASH");

        // Record confirmed transaction
        var tx = WaterTransaction.Create(
            "WTX-DASH-1", propertyId, apartmentId, meterId,
            2500m, 25m, 100m, WaterPaymentMethod.Mpesa, "0722123456", DateTime.UtcNow,
            paymentStatus: WaterTransactionPaymentStatus.Confirmed,
            tokenStatus: WaterTransactionTokenStatus.Delivered);

        db.WaterTransactions.Add(tx);

        // Record water reading
        var reading = WaterReading.Create(meterId, 0m, 15m, MeterReadingSource.Manual);
        db.WaterReadings.Add(reading);

        await db.SaveChangesAsync();

        var handler = new GetWaterDashboardQueryHandler(db, user);
        var dash = await handler.Handle(new GetWaterDashboardQuery(propertyId), CancellationToken.None);

        dash.TotalRevenue.Should().Be(2500m);
        dash.TotalUnitsSold.Should().Be(25m);
        dash.TotalConsumption.Should().Be(15m);
        dash.ActiveMeters.Should().Be(1);
        dash.RecentPurchases.Should().HaveCount(1);
    }

    [Fact]
    public async Task WaterReconciliation_LookupByProviderReference_ReturnsTransaction()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new TestWaterCurrentUser();
        var (propertyId, _, apartmentId, meterId) = await SeedPropertyAndApartment(db, "WM-RECON");

        var tx = WaterTransaction.Create(
            "WTX-RECON-1", propertyId, apartmentId, meterId,
            1500m, 15m, 100m, WaterPaymentMethod.Mpesa, "0711223344", DateTime.UtcNow,
            externalTransactionReference: "QMP7890XYZ",
            paymentStatus: WaterTransactionPaymentStatus.Confirmed);

        db.WaterTransactions.Add(tx);
        await db.SaveChangesAsync();

        var handler = new LookupProviderReferenceQueryHandler(db, user);
        var result = await handler.Handle(new LookupProviderReferenceQuery("QMP7890XYZ"), CancellationToken.None);

        result.Found.Should().BeTrue();
        result.Transaction.Should().NotBeNull();
        result.Transaction!.Amount.Should().Be(1500m);
        result.Transaction.ExternalTransactionReference.Should().Be("QMP7890XYZ");
    }
}
