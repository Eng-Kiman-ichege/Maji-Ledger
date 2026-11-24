using FluentAssertions;
using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.RentLedger;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MajiLedger.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MajiLedger.Tests.RentLedger;

// ── Test helpers ──────────────────────────────────────────────────────────────

file class AdminCurrentUser : ICurrentUserService
{
    public string? UserId => "admin-001";
    public string? Email  => "admin@majiledger.com";
    public string? Role   => "Admin";
    public bool IsAuthenticated => true;
    public Guid? OwnerId => null;
    public Guid? TenantId => null;
    public IReadOnlyList<Guid>   AuthorizedPropertyIds => _propertyIds;
    public IReadOnlyList<string> Permissions  => [];
    public IReadOnlyList<string> Modules      => [AppModules.PropertyManagement];

    private readonly List<Guid> _propertyIds = [];

    public bool IsInRole(string role)              => Role == role || role == "Admin";
    public bool HasPermission(string permission)   => true;
    public bool HasModuleAccess(string module)     => Modules.Contains(module);
    public bool HasPropertyAccess(Guid propertyId) => true; // Admin sees all

    public void AddPropertyAccess(Guid propertyId) => _propertyIds.Add(propertyId);
}

// ── Test class ────────────────────────────────────────────────────────────────

public class RentLedgerWorkflowTests
{
    private MajiLedgerDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<MajiLedgerDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new MajiLedgerDbContext(options);
    }

    private static async Task<(Guid PropertyId, Guid ApartmentId, Guid TenancyId, Guid TenantId)>
        SeedActiveTenancy(MajiLedgerDbContext db, decimal monthlyRent = 20_000m)
    {
        // Property
        var property = Property.Create("Test Towers", PropertyType.Residential,
            "1 Test Rd", "Nairobi", "Westlands", null, null, "admin");
        await db.Set<Property>().AddAsync(property);

        // Building
        var building = Building.Create(property.Id, "Block A", null, null, "admin");
        await db.Set<Building>().AddAsync(building);

        // UnitType
        var unitType = UnitType.Create("1BR", "One Bedroom");
        await db.Set<UnitType>().AddAsync(unitType);

        // Apartment
        var apartment = Apartment.Create(
            buildingId: building.Id,
            unitNumber: "A01",
            createdBy: "admin",
            unitTypeId: unitType.Id,
            monthlyRent: monthlyRent);
        await db.Set<Apartment>().AddAsync(apartment);

        // Tenant
        var tenant = Tenant.Create("John", "Kamau", "0722000001",
            middleName: null, email: "john@test.com",
            nationalId: "12345678", alternativePhoneNumber: null,
            address: null, createdBy: "admin");
        await db.Set<Tenant>().AddAsync(tenant);

        // Tenancy
        var tenancy = Tenancy.Create(
            apartmentId: apartment.Id,
            primaryTenantId: tenant.Id,
            monthlyRent: monthlyRent,
            securityDeposit: 20_000m,
            startDate: new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc),
            tenancyReference: "TEN-001",
            rentPaymentDueDay: 5);

        await db.Set<Tenancy>().AddAsync(tenancy);
        await db.SaveChangesAsync();

        // Mark apartment as belonging to property (via building chain)
        return (property.Id, apartment.Id, tenancy.Id, tenant.Id);
    }

    // ── Test: RentCharge domain entity ──────────────────────────────────────

    [Fact]
    public void RentCharge_Create_ValidParameters_CreatesWithPendingStatus()
    {
        var charge = RentCharge.Create(
            chargeReference: "CHG-202611-001",
            tenancyId: Guid.NewGuid(),
            tenantId: Guid.NewGuid(),
            propertyId: Guid.NewGuid(),
            apartmentId: Guid.NewGuid(),
            billingPeriod: "2026-11",
            billingDate: new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc),
            dueDate: new DateTime(2026, 11, 5, 0, 0, 0, DateTimeKind.Utc),
            amount: 20_000m);

        charge.Status.Should().Be(RentChargeStatus.Pending);
        charge.OutstandingAmount.Should().Be(20_000m);
        charge.AmountPaid.Should().Be(0m);
    }

    [Fact]
    public void RentCharge_Create_NegativeAmount_Throws()
    {
        var act = () => RentCharge.Create(
            "CHG-001", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "2026-11",
            DateTime.UtcNow, DateTime.UtcNow.AddDays(5), amount: -100m);

        act.Should().Throw<ArgumentException>().WithMessage("*amount*");
    }

    [Fact]
    public void RentCharge_ApplyFullPayment_SetsStatusPaid()
    {
        var charge = RentCharge.Create("CHG-001", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "2026-11", DateTime.UtcNow, DateTime.UtcNow.AddDays(5), 20_000m);

        charge.ApplyPayment(20_000m);

        charge.Status.Should().Be(RentChargeStatus.Paid);
        charge.OutstandingAmount.Should().Be(0m);
        charge.AmountPaid.Should().Be(20_000m);
    }

    [Fact]
    public void RentCharge_ApplyPartialPayment_SetsStatusPartiallyPaid()
    {
        var charge = RentCharge.Create("CHG-001", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "2026-11", DateTime.UtcNow, DateTime.UtcNow.AddDays(5), 20_000m);

        charge.ApplyPayment(10_000m);

        charge.Status.Should().Be(RentChargeStatus.PartiallyPaid);
        charge.OutstandingAmount.Should().Be(10_000m);
    }

    [Fact]
    public void RentCharge_ApplyOverpayment_Throws()
    {
        var charge = RentCharge.Create("CHG-001", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "2026-11", DateTime.UtcNow, DateTime.UtcNow.AddDays(5), 20_000m);

        var act = () => charge.ApplyPayment(25_000m);
        act.Should().Throw<InvalidOperationException>().WithMessage("*outstanding*");
    }

    [Fact]
    public void RentCharge_Cancel_WithNoPayments_Succeeds()
    {
        var charge = RentCharge.Create("CHG-001", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "2026-11", DateTime.UtcNow, DateTime.UtcNow.AddDays(5), 20_000m);

        charge.Cancel("Error in charge");

        charge.Status.Should().Be(RentChargeStatus.Cancelled);
        charge.CancellationReason.Should().Be("Error in charge");
    }

    [Fact]
    public void RentCharge_Cancel_WithPaymentsApplied_Throws()
    {
        var charge = RentCharge.Create("CHG-001", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "2026-11", DateTime.UtcNow, DateTime.UtcNow.AddDays(5), 20_000m);
        charge.ApplyPayment(5_000m);

        var act = () => charge.Cancel("Mistake");
        act.Should().Throw<InvalidOperationException>().WithMessage("*payments applied*");
    }

    // ── Test: RentPayment domain entity ─────────────────────────────────────

    [Fact]
    public void RentPayment_Create_ValidParameters_CreatesConfirmed()
    {
        var payment = RentPayment.Create(
            paymentReference: "PAY-001",
            tenancyId: Guid.NewGuid(),
            tenantId: Guid.NewGuid(),
            propertyId: Guid.NewGuid(),
            apartmentId: Guid.NewGuid(),
            amount: 20_000m,
            paymentMethod: RentPaymentMethod.Mpesa,
            paymentDate: DateTime.UtcNow,
            receiptNumber: "RCP-001",
            transactionReference: "QKV3LHYU7P");

        payment.PaymentStatus.Should().Be(RentPaymentStatus.Confirmed);
        payment.UnallocatedAmount.Should().Be(20_000m);
        payment.AmountAllocated.Should().Be(0m);
        payment.TransactionReference.Should().Be("QKV3LHYU7P");
    }

    [Fact]
    public void RentPayment_Reverse_SetsReversedStatus()
    {
        var payment = RentPayment.Create(
            "PAY-001", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            20_000m, RentPaymentMethod.Cash, DateTime.UtcNow, "RCP-001");

        payment.Reverse("Wrong tenant");

        payment.PaymentStatus.Should().Be(RentPaymentStatus.Reversed);
        payment.ReversalReason.Should().Be("Wrong tenant");
    }

    // ── Test: TenantCredit domain entity ────────────────────────────────────

    [Fact]
    public void TenantCredit_Utilize_FullAmount_SetsFullyUtilized()
    {
        var credit = TenantCredit.Create(
            "CRD-001", Guid.NewGuid(), Guid.NewGuid(),
            5_000m, "Overpayment");

        credit.Utilize(5_000m);

        credit.Status.Should().Be(TenantCreditStatus.FullyUtilized);
        credit.RemainingCredit.Should().Be(0m);
    }

    [Fact]
    public void TenantCredit_Utilize_ExceedingCredit_Throws()
    {
        var credit = TenantCredit.Create(
            "CRD-001", Guid.NewGuid(), Guid.NewGuid(),
            5_000m, "Overpayment");

        var act = () => credit.Utilize(6_000m);
        act.Should().Throw<InvalidOperationException>().WithMessage("*remaining credit*");
    }

    // ── Test: RecordRentPaymentCommand — full allocation ────────────────────

    [Fact]
    public async Task RecordPayment_ExactAmount_AllocatesFullyToOpenCharge()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new AdminCurrentUser();
        var (propertyId, apartmentId, tenancyId, tenantId) = await SeedActiveTenancy(db, 20_000m);

        // Create an open charge
        var charge = RentCharge.Create(
            "CHG-202611-001", tenancyId, tenantId, propertyId, apartmentId,
            "2026-11",
            new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 11, 5, 0, 0, 0, DateTimeKind.Utc),
            20_000m);

        db.RentCharges.Add(charge);
        await db.SaveChangesAsync();

        var handler = new RecordRentPaymentCommandHandler(db, user);
        var result = await handler.Handle(new RecordRentPaymentCommand(
            TenancyId: tenancyId,
            Amount: 20_000m,
            PaymentMethod: RentPaymentMethod.Cash,
            PaymentDate: new DateTime(2026, 11, 3, 0, 0, 0, DateTimeKind.Utc),
            TransactionReference: null,
            PayerName: "John Kamau"), CancellationToken.None);

        result.TotalAllocated.Should().Be(20_000m);
        result.UnallocatedCredit.Should().Be(0m);
        result.Allocations.Should().HaveCount(1);
        result.Allocations[0].AllocatedAmount.Should().Be(20_000m);
        result.Allocations[0].ChargeStatus.Should().Be(RentChargeStatus.Paid);

        var updatedCharge = await db.RentCharges.FindAsync(charge.Id);
        updatedCharge!.Status.Should().Be(RentChargeStatus.Paid);
        updatedCharge.AmountPaid.Should().Be(20_000m);
    }

    [Fact]
    public async Task RecordPayment_PartialPayment_ChargeBecomesPartiallyPaid()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new AdminCurrentUser();
        var (propertyId, apartmentId, tenancyId, tenantId) = await SeedActiveTenancy(db, 20_000m);

        var charge = RentCharge.Create(
            "CHG-202611-001", tenancyId, tenantId, propertyId, apartmentId,
            "2026-11",
            new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 11, 5, 0, 0, 0, DateTimeKind.Utc),
            20_000m);
        db.RentCharges.Add(charge);
        await db.SaveChangesAsync();

        var handler = new RecordRentPaymentCommandHandler(db, user);
        var result = await handler.Handle(new RecordRentPaymentCommand(
            tenancyId, 10_000m, RentPaymentMethod.BankTransfer,
            new DateTime(2026, 11, 2, 0, 0, 0, DateTimeKind.Utc)), CancellationToken.None);

        result.TotalAllocated.Should().Be(10_000m);
        result.UnallocatedCredit.Should().Be(0m);
        result.Allocations[0].ChargeStatus.Should().Be(RentChargeStatus.PartiallyPaid);

        var updatedCharge = await db.RentCharges.FindAsync(charge.Id);
        updatedCharge!.OutstandingAmount.Should().Be(10_000m);
    }

    [Fact]
    public async Task RecordPayment_OldestChargeFirst_AllocatesCorrectly()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new AdminCurrentUser();
        var (propertyId, apartmentId, tenancyId, tenantId) = await SeedActiveTenancy(db, 20_000m);

        // Two open charges — October then November
        var octCharge = RentCharge.Create(
            "CHG-202610-001", tenancyId, tenantId, propertyId, apartmentId,
            "2026-10",
            new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 10, 5, 0, 0, 0, DateTimeKind.Utc),
            20_000m);

        var novCharge = RentCharge.Create(
            "CHG-202611-001", tenancyId, tenantId, propertyId, apartmentId,
            "2026-11",
            new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 11, 5, 0, 0, 0, DateTimeKind.Utc),
            20_000m);

        db.RentCharges.Add(octCharge);
        db.RentCharges.Add(novCharge);
        await db.SaveChangesAsync();

        // Pay 25,000 — should fully clear Oct (20k) and partial Nov (5k)
        var handler = new RecordRentPaymentCommandHandler(db, user);
        var result = await handler.Handle(new RecordRentPaymentCommand(
            tenancyId, 25_000m, RentPaymentMethod.Mpesa,
            new DateTime(2026, 11, 20, 0, 0, 0, DateTimeKind.Utc)), CancellationToken.None);

        result.TotalAllocated.Should().Be(25_000m);
        result.UnallocatedCredit.Should().Be(0m);
        result.Allocations.Should().HaveCount(2);

        var oct = await db.RentCharges.FindAsync(octCharge.Id);
        oct!.Status.Should().Be(RentChargeStatus.Paid);
        oct.AmountPaid.Should().Be(20_000m);

        var nov = await db.RentCharges.FindAsync(novCharge.Id);
        nov!.Status.Should().Be(RentChargeStatus.PartiallyPaid);
        nov.AmountPaid.Should().Be(5_000m);
        nov.OutstandingAmount.Should().Be(15_000m);
    }

    [Fact]
    public async Task RecordPayment_Overpayment_CreatesTenantCredit()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new AdminCurrentUser();
        var (propertyId, apartmentId, tenancyId, tenantId) = await SeedActiveTenancy(db, 20_000m);

        var charge = RentCharge.Create(
            "CHG-202611-001", tenancyId, tenantId, propertyId, apartmentId,
            "2026-11",
            new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 11, 5, 0, 0, 0, DateTimeKind.Utc),
            20_000m);
        db.RentCharges.Add(charge);
        await db.SaveChangesAsync();

        var handler = new RecordRentPaymentCommandHandler(db, user);
        var result = await handler.Handle(new RecordRentPaymentCommand(
            tenancyId, 25_000m, RentPaymentMethod.Mpesa,
            new DateTime(2026, 11, 20, 0, 0, 0, DateTimeKind.Utc)), CancellationToken.None);

        result.UnallocatedCredit.Should().Be(5_000m);

        var credit = await db.TenantCredits.FirstOrDefaultAsync(c => c.TenancyId == tenancyId);
        credit.Should().NotBeNull();
        credit!.OriginalAmount.Should().Be(5_000m);
        credit.RemainingCredit.Should().Be(5_000m);
        credit.Status.Should().Be(TenantCreditStatus.Active);
    }

    [Fact]
    public async Task RecordPayment_DuplicateMpesaTransactionRef_ThrowsValidationException()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new AdminCurrentUser();
        var (_, _, tenancyId, _) = await SeedActiveTenancy(db, 20_000m);

        var handler = new RecordRentPaymentCommandHandler(db, user);

        // First payment — succeeds
        await handler.Handle(new RecordRentPaymentCommand(
            tenancyId, 5_000m, RentPaymentMethod.Mpesa,
            new DateTime(2026, 11, 2, 0, 0, 0, DateTimeKind.Utc),
            TransactionReference: "QKV3LHYU7P"), CancellationToken.None);

        // Second with same transaction reference — must reject
        var act = async () => await handler.Handle(new RecordRentPaymentCommand(
            tenancyId, 5_000m, RentPaymentMethod.Mpesa,
            new DateTime(2026, 11, 3, 0, 0, 0, DateTimeKind.Utc),
            TransactionReference: "QKV3LHYU7P"), CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();

        // Also verify only one confirmed payment with this reference exists in the DB
        var count = await db.RentPayments.CountAsync(p =>
            p.TransactionReference == "QKV3LHYU7P" &&
            p.PaymentStatus == RentPaymentStatus.Confirmed);
        count.Should().Be(1);
    }

    [Fact]
    public async Task ReversePayment_ReversesAllocationsAndResetsChargeBalance()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new AdminCurrentUser();
        var (propertyId, apartmentId, tenancyId, tenantId) = await SeedActiveTenancy(db, 20_000m);

        var charge = RentCharge.Create(
            "CHG-202611-001", tenancyId, tenantId, propertyId, apartmentId,
            "2026-11",
            new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 11, 5, 0, 0, 0, DateTimeKind.Utc),
            20_000m);
        db.RentCharges.Add(charge);
        await db.SaveChangesAsync();

        // Record payment
        var recordHandler = new RecordRentPaymentCommandHandler(db, user);
        var payment = await recordHandler.Handle(new RecordRentPaymentCommand(
            tenancyId, 20_000m, RentPaymentMethod.Cash,
            new DateTime(2026, 11, 3, 0, 0, 0, DateTimeKind.Utc)), CancellationToken.None);

        // Confirm charge is paid
        var chargeAfterPay = await db.RentCharges.FindAsync(charge.Id);
        chargeAfterPay!.Status.Should().Be(RentChargeStatus.Paid);

        // Now reverse
        var reverseHandler = new ReverseRentPaymentCommandHandler(db, user);
        await reverseHandler.Handle(
            new ReverseRentPaymentCommand(payment.PaymentId, "Payment from wrong tenant"),
            CancellationToken.None);

        // Charge should be back to Pending (outstanding again)
        var chargeAfterReverse = await db.RentCharges.FindAsync(charge.Id);
        chargeAfterReverse!.AmountPaid.Should().Be(0m);
        chargeAfterReverse.OutstandingAmount.Should().Be(20_000m);

        var pmt = await db.RentPayments.FindAsync(payment.PaymentId);
        pmt!.PaymentStatus.Should().Be(RentPaymentStatus.Reversed);
    }

    // ── Test: Arrears report ─────────────────────────────────────────────────

    [Fact]
    public async Task GetArrearsReport_OverdueCharges_ClassifiedCorrectly()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new AdminCurrentUser();
        var (propertyId, apartmentId, tenancyId, tenantId) = await SeedActiveTenancy(db, 20_000m);

        var oldCharge = RentCharge.Create(
            "CHG-202609-001", tenancyId, tenantId, propertyId, apartmentId,
            "2026-09",
            new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 9, 5, 0, 0, 0, DateTimeKind.Utc),   // 79 days before 23 Nov
            20_000m);

        db.RentCharges.Add(oldCharge);
        await db.SaveChangesAsync();

        var handler = new GetArrearsReportQueryHandler(db, user);
        var report = await handler.Handle(
            new GetArrearsReportQuery(AsOf: new DateTime(2026, 11, 23, 0, 0, 0, DateTimeKind.Utc)),
            CancellationToken.None);

        report.TenantCount.Should().Be(1);
        report.TotalOutstanding.Should().Be(20_000m);
        report.Tenants[0].Days61to90.Should().Be(20_000m);
    }

    // ── Test: Charge generation deduplication ─────────────────────────────

    [Fact]
    public async Task GenerateMonthlyCharges_RunTwiceForSamePeriod_SecondRunSkipsAll()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var user = new AdminCurrentUser();
        await SeedActiveTenancy(db, 15_000m);

        var handler = new GenerateMonthlyRentChargesCommandHandler(db, user);

        // First run
        var r1 = await handler.Handle(
            new GenerateMonthlyRentChargesCommand("2026-11"), CancellationToken.None);

        // Second run — same period
        var r2 = await handler.Handle(
            new GenerateMonthlyRentChargesCommand("2026-11"), CancellationToken.None);

        r1.GeneratedCount.Should().Be(1);
        r2.GeneratedCount.Should().Be(0);
        r2.SkippedCount.Should().Be(1);
    }
}
