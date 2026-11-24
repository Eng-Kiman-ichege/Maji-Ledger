using FluentAssertions;
using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.PropertyManagement;
using MajiLedger.Application.Features.Tenancies;
using MajiLedger.Application.Features.Tenants;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MajiLedger.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MajiLedger.Tests.PropertyManagement;

public class TenantWorkflowTests
{
    private MajiLedgerDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<MajiLedgerDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new MajiLedgerDbContext(options);
    }

    [Fact]
    public async Task RegisterTenant_IndependentOfApartment_PersistsSuccessfully()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var handler = new CreateTenantHandler(db);
        var tenantId = await handler.Handle(new CreateTenantCommand(
            "Alice",
            "Wanjiku",
            "0712344556",
            MiddleName: "Njeri",
            Email: "alice@example.com",
            NationalId: "33445566",
            AlternativePhoneNumber: "0799887766",
            Address: "P.O. Box 543, Nairobi",
            CreatedBy: "admin@majiledger.com"), CancellationToken.None);

        tenantId.Should().NotBeEmpty();

        var tenant = await db.Tenants.FindAsync(tenantId);
        tenant.Should().NotBeNull();
        tenant!.FirstName.Should().Be("Alice");
        tenant.MiddleName.Should().Be("Njeri");
        tenant.LastName.Should().Be("Wanjiku");
        tenant.FullName.Should().Be("Alice Njeri Wanjiku");
        tenant.PhoneNumber.Should().Be("0712344556");
        tenant.AlternativePhoneNumber.Should().Be("0799887766");
        tenant.Address.Should().Be("P.O. Box 543, Nairobi");
        tenant.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task RegisterTenant_DuplicateActivePhoneNumber_ThrowsConflictException()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var handler = new CreateTenantHandler(db);
        await handler.Handle(new CreateTenantCommand("Bob", "Otieno", "0722334455"), CancellationToken.None);

        var act = async () => await handler.Handle(
            new CreateTenantCommand("Robert", "Otieno", "0722334455"), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already exists*");
    }

    [Fact]
    public async Task UpdateTenantProfile_UpdatesFieldsSuccessfully()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var createHandler = new CreateTenantHandler(db);
        var tenantId = await createHandler.Handle(new CreateTenantCommand("Charlie", "Kip", "0733112233"), CancellationToken.None);

        var updateHandler = new UpdateTenantHandler(db);
        await updateHandler.Handle(new UpdateTenantCommand(
            tenantId,
            "Charles",
            "Kiprop",
            "0733112233",
            MiddleName: "Kemei",
            Email: "charles.kip@example.com",
            NationalId: "11223344",
            AlternativePhoneNumber: "0711002233",
            Address: "Eldoret Town",
            UpdatedBy: "admin@majiledger.com"), CancellationToken.None);

        var updated = await db.Tenants.FindAsync(tenantId);
        updated!.FirstName.Should().Be("Charles");
        updated.LastName.Should().Be("Kiprop");
        updated.MiddleName.Should().Be("Kemei");
        updated.FullName.Should().Be("Charles Kemei Kiprop");
        updated.Email.Should().Be("charles.kip@example.com");
        updated.Address.Should().Be("Eldoret Town");
    }

    [Fact]
    public async Task CreateTenancy_ValidData_CreatesAgreementAndMarksApartmentOccupied()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var prop = Property.Create("Parkview", PropertyType.Residential);
        var bld = Building.Create(prop.Id, "Block 1");
        var unit = Apartment.Create(bld.Id, "B1-01", monthlyRent: 25000m);
        var tenant = Tenant.Create("Grace", "Mutua", "0700112233");

        db.Properties.Add(prop);
        db.Buildings.Add(bld);
        db.Apartments.Add(unit);
        db.Tenants.Add(tenant);
        await db.SaveChangesAsync();

        var adminUser = new TestCurrentUserService { Role = "Admin" };
        var tenancyHandler = new CreateTenancyHandler(db, adminUser);

        var tenancyId = await tenancyHandler.Handle(new CreateTenancyCommand(
            unit.Id,
            tenant.Id,
            MonthlyRent: 24000m,
            SecurityDeposit: 24000m,
            StartDate: DateTime.UtcNow,
            TenancyReference: "TEN-B1-01-2026",
            ExpectedEndDate: DateTime.UtcNow.AddYears(1),
            RentPaymentDueDay: 5,
            BillingFrequency: BillingFrequency.Monthly,
            AgreementNotes: "1-year residential lease agreement"), CancellationToken.None);

        tenancyId.Should().NotBeEmpty();

        var tenancy = await db.Tenancies
            .Include(t => t.Tenants)
            .FirstOrDefaultAsync(t => t.Id == tenancyId);

        tenancy.Should().NotBeNull();
        tenancy!.MonthlyRent.Should().Be(24000m);
        tenancy.SecurityDeposit.Should().Be(24000m);
        tenancy.RentPaymentDueDay.Should().Be(5);
        tenancy.TenancyReference.Should().Be("TEN-B1-01-2026");
        tenancy.Status.Should().Be(TenancyStatus.Active);
        tenancy.Tenants.Should().HaveCount(1);
        tenancy.Tenants.First().TenantId.Should().Be(tenant.Id);
        tenancy.Tenants.First().IsPrimaryTenant.Should().BeTrue();

        // Apartment must be marked occupied
        var updatedUnit = await db.Apartments.FindAsync(unit.Id);
        updatedUnit!.IsOccupied.Should().BeTrue();
    }

    [Fact]
    public async Task CreateTenancy_OverlappingActiveTenancy_ThrowsConflictException()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var prop = Property.Create("Parkview", PropertyType.Residential);
        var bld = Building.Create(prop.Id, "Block 1");
        var unit = Apartment.Create(bld.Id, "B1-02", monthlyRent: 20000m);
        var t1 = Tenant.Create("Tenant", "One", "0711111111");
        var t2 = Tenant.Create("Tenant", "Two", "0722222222");

        db.Properties.Add(prop);
        db.Buildings.Add(bld);
        db.Apartments.Add(unit);
        db.Tenants.AddRange(t1, t2);
        await db.SaveChangesAsync();

        var adminUser = new TestCurrentUserService { Role = "Admin" };
        var tenancyHandler = new CreateTenancyHandler(db, adminUser);

        await tenancyHandler.Handle(new CreateTenancyCommand(
            unit.Id, t1.Id, 20000m, 20000m, DateTime.UtcNow), CancellationToken.None);

        // Attempting to create another active tenancy for unit B1-02 must be rejected
        var act = async () => await tenancyHandler.Handle(new CreateTenancyCommand(
            unit.Id, t2.Id, 20000m, 20000m, DateTime.UtcNow), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already has an active tenancy*");
    }

    [Fact]
    public async Task MultipleTenants_AddRoommateAndChangePrimary_Succeeds()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var prop = Property.Create("Garden Court", PropertyType.Residential);
        var bld = Building.Create(prop.Id, "Apt Block");
        var unit = Apartment.Create(bld.Id, "Unit 10");
        var primary = Tenant.Create("Primary", "Tenant", "0710001000");
        var roommate = Tenant.Create("Roommate", "Occupant", "0720002000");

        db.Properties.Add(prop);
        db.Buildings.Add(bld);
        db.Apartments.Add(unit);
        db.Tenants.AddRange(primary, roommate);
        await db.SaveChangesAsync();

        var adminUser = new TestCurrentUserService { Role = "Admin" };
        var createHandler = new CreateTenancyHandler(db, adminUser);
        var tenancyId = await createHandler.Handle(new CreateTenancyCommand(
            unit.Id, primary.Id, 30000m, 30000m, DateTime.UtcNow), CancellationToken.None);

        // Add roommate
        var addTenantHandler = new AddTenantToTenancyHandler(db);
        var assignmentId = await addTenantHandler.Handle(new AddTenantToTenancyCommand(
            tenancyId, roommate.Id, IsPrimaryTenant: false), CancellationToken.None);

        assignmentId.Should().NotBeEmpty();

        var tenancy = await db.Tenancies
            .Include(t => t.Tenants)
            .FirstOrDefaultAsync(t => t.Id == tenancyId);

        tenancy!.Tenants.Should().HaveCount(2);

        // Duplicate roommate assignment check
        var actDuplicate = async () => await addTenantHandler.Handle(new AddTenantToTenancyCommand(
            tenancyId, roommate.Id), CancellationToken.None);
        await actDuplicate.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already an active occupant*");

        // Swap primary tenant to roommate
        var changePrimaryHandler = new ChangePrimaryTenantHandler(db);
        await changePrimaryHandler.Handle(new ChangePrimaryTenantCommand(tenancyId, roommate.Id), CancellationToken.None);

        var updatedTenancy = await db.Tenancies
            .Include(t => t.Tenants)
            .FirstOrDefaultAsync(t => t.Id == tenancyId);

        updatedTenancy!.TenantId.Should().Be(roommate.Id);
        updatedTenancy.Tenants.First(t => t.TenantId == roommate.Id).IsPrimaryTenant.Should().BeTrue();
        updatedTenancy.Tenants.First(t => t.TenantId == primary.Id).IsPrimaryTenant.Should().BeFalse();
    }

    [Fact]
    public async Task MoveOutAndTermination_FreesApartmentForNewTenancy()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var prop = Property.Create("Sunrise Court", PropertyType.Residential);
        var bld = Building.Create(prop.Id, "Block C");
        var unit = Apartment.Create(bld.Id, "C-05", monthlyRent: 18000m);
        var t1 = Tenant.Create("Departing", "Tenant", "0790111222");
        var t2 = Tenant.Create("Incoming", "Tenant", "0790333444");

        db.Properties.Add(prop);
        db.Buildings.Add(bld);
        db.Apartments.Add(unit);
        db.Tenants.AddRange(t1, t2);
        await db.SaveChangesAsync();

        var adminUser = new TestCurrentUserService { Role = "Admin" };
        var createTenancyHandler = new CreateTenancyHandler(db, adminUser);

        var t1TenancyId = await createTenancyHandler.Handle(new CreateTenancyCommand(
            unit.Id, t1.Id, 18000m, 18000m, DateTime.UtcNow.AddMonths(-6)), CancellationToken.None);

        (await db.Apartments.FindAsync(unit.Id))!.IsOccupied.Should().BeTrue();

        // Tenant moves out and terminates tenancy
        var terminateHandler = new TerminateTenancyHandler(db);
        await terminateHandler.Handle(new TerminateTenancyCommand(
            t1TenancyId, DateTime.UtcNow, "Tenant relocated for work"), CancellationToken.None);

        var terminatedTenancy = await db.Tenancies.FindAsync(t1TenancyId);
        terminatedTenancy!.Status.Should().Be(TenancyStatus.Terminated);
        terminatedTenancy.ActualEndDate.Should().NotBeNull();

        // Unit should now be marked vacant
        var vacantUnit = await db.Apartments.FindAsync(unit.Id);
        vacantUnit!.IsOccupied.Should().BeFalse();

        // Now a new tenancy can be created for the incoming tenant on the same unit
        var t2TenancyId = await createTenancyHandler.Handle(new CreateTenancyCommand(
            unit.Id, t2.Id, 20000m, 20000m, DateTime.UtcNow), CancellationToken.None);

        t2TenancyId.Should().NotBeEmpty();
        (await db.Apartments.FindAsync(unit.Id))!.IsOccupied.Should().BeTrue();

        // Verify full occupancy history for unit C-05 contains both records
        var historyHandler = new GetApartmentOccupancyHistoryHandler(db, adminUser);
        var history = await historyHandler.Handle(new GetApartmentOccupancyHistoryQuery(unit.Id), CancellationToken.None);
        history.Should().HaveCount(2);
        history.Should().Contain(h => h.TenancyId == t1TenancyId && h.Status == TenancyStatus.Terminated);
        history.Should().Contain(h => h.TenancyId == t2TenancyId && h.Status == TenancyStatus.Active);
    }

    [Fact]
    public async Task RenewTenancy_ExtendsExpectedEndDateAndUpdatesRent()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var prop = Property.Create("Sunrise Court", PropertyType.Residential);
        var bld = Building.Create(prop.Id, "Block C");
        var unit = Apartment.Create(bld.Id, "C-06", monthlyRent: 15000m);
        var tenant = Tenant.Create("Longterm", "Tenant", "0790555666");

        db.Properties.Add(prop);
        db.Buildings.Add(bld);
        db.Apartments.Add(unit);
        db.Tenants.Add(tenant);
        await db.SaveChangesAsync();

        var adminUser = new TestCurrentUserService { Role = "Admin" };
        var createHandler = new CreateTenancyHandler(db, adminUser);
        var tenancyId = await createHandler.Handle(new CreateTenancyCommand(
            unit.Id, tenant.Id, 15000m, 15000m, DateTime.UtcNow, ExpectedEndDate: DateTime.UtcNow.AddMonths(6)), CancellationToken.None);

        var renewHandler = new RenewTenancyHandler(db);
        var newEnd = DateTime.UtcNow.AddYears(1);
        await renewHandler.Handle(new RenewTenancyCommand(
            tenancyId, newEnd, NewRent: 16500m, Notes: "Annual 10% rent escalation applied"), CancellationToken.None);

        var renewed = await db.Tenancies.FindAsync(tenancyId);
        renewed!.ExpectedEndDate.Should().Be(newEnd);
        renewed.MonthlyRent.Should().Be(16500m);
        renewed.AgreementNotes.Should().Contain("10% rent escalation");
    }

    [Fact]
    public async Task LandlordScoping_OwnerCanOnlyViewTenantsAndTenanciesOnTheirProperties()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var landlord1 = Owner.Create("Landlord One", "0711000001");
        var landlord2 = Owner.Create("Landlord Two", "0722000002");
        var prop1 = Property.Create("Estate One", PropertyType.Residential);
        var prop2 = Property.Create("Estate Two", PropertyType.Residential);
        var bld1 = Building.Create(prop1.Id, "Bld 1");
        var bld2 = Building.Create(prop2.Id, "Bld 2");
        var unit1 = Apartment.Create(bld1.Id, "U-1", propertyId: prop1.Id);
        var unit2 = Apartment.Create(bld2.Id, "U-2", propertyId: prop2.Id);

        var t1 = Tenant.Create("Tenant", "One", "0711111111");
        var t2 = Tenant.Create("Tenant", "Two", "0722222222");

        db.Owners.AddRange(landlord1, landlord2);
        db.Properties.AddRange(prop1, prop2);
        db.Buildings.AddRange(bld1, bld2);
        db.Apartments.AddRange(unit1, unit2);
        db.Tenants.AddRange(t1, t2);
        await db.SaveChangesAsync();

        var assignOwnerHandler = new AssignLandlordToPropertyHandler(db);
        await assignOwnerHandler.Handle(new AssignLandlordToPropertyCommand(landlord1.Id, prop1.Id), CancellationToken.None);
        await assignOwnerHandler.Handle(new AssignLandlordToPropertyCommand(landlord2.Id, prop2.Id), CancellationToken.None);

        var adminUser = new TestCurrentUserService { Role = "Admin" };
        var createTenancyHandler = new CreateTenancyHandler(db, adminUser);
        var tenancy1Id = await createTenancyHandler.Handle(new CreateTenancyCommand(unit1.Id, t1.Id, 10000m, 10000m, DateTime.UtcNow), CancellationToken.None);
        var tenancy2Id = await createTenancyHandler.Handle(new CreateTenancyCommand(unit2.Id, t2.Id, 12000m, 12000m, DateTime.UtcNow), CancellationToken.None);

        // Caller is Landlord 1
        var landlord1User = new TestCurrentUserService
        {
            Role = "Owner",
            OwnerId = landlord1.Id
        };

        // Query tenants: landlord 1 should only see Tenant 1
        var tenantsHandler = new GetTenantsHandler(db, landlord1User);
        var tenants = await tenantsHandler.Handle(new GetTenantsQuery(), CancellationToken.None);
        tenants.Should().HaveCount(1);
        tenants[0].Id.Should().Be(t1.Id);

        // Query tenancies: landlord 1 should only see Tenancy 1
        var tenanciesHandler = new GetTenanciesHandler(db, landlord1User);
        var tenancies = await tenanciesHandler.Handle(new GetTenanciesQuery(), CancellationToken.None);
        tenancies.Should().HaveCount(1);
        tenancies[0].Id.Should().Be(tenancy1Id);

        // Attempting to view Tenancy 2 details should throw ForbiddenException
        var getTenancyHandler = new GetTenancyByIdHandler(db, landlord1User);
        var actForbidden = async () => await getTenancyHandler.Handle(new GetTenancyByIdQuery(tenancy2Id), CancellationToken.None);
        await actForbidden.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("*not authorized to view this tenancy*");
    }

    [Fact]
    public async Task MoveOut_DatePrecedingMoveIn_ThrowsValidationException()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var prop = Property.Create("Parkview", PropertyType.Residential);
        var bld = Building.Create(prop.Id, "Block 1");
        var unit = Apartment.Create(bld.Id, "B1-03", monthlyRent: 20000m);
        var tenant = Tenant.Create("David", "Ouma", "0744556677");

        db.Properties.Add(prop);
        db.Buildings.Add(bld);
        db.Apartments.Add(unit);
        db.Tenants.Add(tenant);
        await db.SaveChangesAsync();

        var adminUser = new TestCurrentUserService { Role = "Admin" };
        var createHandler = new CreateTenancyHandler(db, adminUser);
        var tenancyId = await createHandler.Handle(new CreateTenancyCommand(
            unit.Id, tenant.Id, 20000m, 20000m, DateTime.UtcNow), CancellationToken.None);

        var terminateHandler = new TerminateTenancyHandler(db);
        var act = async () => await terminateHandler.Handle(new TerminateTenancyCommand(
            tenancyId, ActualEndDate: DateTime.UtcNow.AddDays(-10)), CancellationToken.None);

        var ex = await act.Should().ThrowAsync<ValidationException>();
        ex.Which.Errors.Should().ContainKey("ActualEndDate");
        ex.Which.Errors["ActualEndDate"].Should().Contain("Move-out date cannot precede tenancy start date.");
    }
}
