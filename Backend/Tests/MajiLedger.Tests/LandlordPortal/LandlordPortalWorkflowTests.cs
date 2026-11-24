using FluentAssertions;
using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Application.Features.LandlordPortal;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MajiLedger.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MajiLedger.Tests.LandlordPortal;

public class TestCurrentUserService : ICurrentUserService
{
    public string? UserId { get; set; } = Guid.NewGuid().ToString();
    public string? Email { get; set; } = "landlord@example.com";
    public string? Role { get; set; } = "Owner";
    public bool IsAuthenticated { get; set; } = true;
    public Guid? OwnerId { get; set; }
    public Guid? TenantId { get; set; }
    public List<Guid> PropertyIds { get; set; } = new();
    public IReadOnlyList<Guid> AuthorizedPropertyIds => PropertyIds;
    public IReadOnlyList<string> Permissions => new List<string>();
    public IReadOnlyList<string> Modules => new List<string> { "PropertyManagement", "WaterLedger" };

    public bool IsInRole(string role) => Role?.Equals(role, StringComparison.OrdinalIgnoreCase) == true;
    public bool HasPermission(string permission) => true;
    public bool HasModuleAccess(string module) => true;
    public bool HasPropertyAccess(Guid propertyId) => IsInRole("Admin") || PropertyIds.Contains(propertyId);
}

public class LandlordPortalWorkflowTests
{
    private MajiLedgerDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<MajiLedgerDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new MajiLedgerDbContext(options);
    }

    [Fact]
    public async Task MaintenanceRequest_Lifecycle_ShouldProgressCorrectly()
    {
        var dbName = Guid.NewGuid().ToString();
        var landlordUser = new TestCurrentUserService();

        using var db = CreateDbContext(dbName);
        var property = Property.Create("Sunset Villas", PropertyType.Residential, "admin", "123 Main St", "Westlands", "Nairobi");
        db.Properties.Add(property);
        await db.SaveChangesAsync();

        landlordUser.PropertyIds.Add(property.Id);

        // 1. Create Maintenance Request
        var createHandler = new CreateMaintenanceRequestHandler(db, landlordUser);
        var requestId = await createHandler.Handle(new CreateMaintenanceRequestCommand(
            property.Id, null, null, null, null,
            MaintenanceCategory.Plumbing,
            MaintenancePriority.High,
            "Leaking Pipe in Kitchen",
            "Water pipe under sink is leaking severely.",
            EstimatedCost: 5000m
        ), CancellationToken.None);

        requestId.Should().NotBeEmpty();

        // 2. Verify Created State
        var getByIdHandler = new GetMaintenanceRequestByIdHandler(db, landlordUser);
        var reqDto = await getByIdHandler.Handle(new GetMaintenanceRequestByIdQuery(requestId), CancellationToken.None);
        reqDto.Status.Should().Be(MaintenanceStatus.Submitted);
        reqDto.Priority.Should().Be(MaintenancePriority.High);
        reqDto.Category.Should().Be(MaintenanceCategory.Plumbing);
        reqDto.EstimatedCost.Should().Be(5000m);

        // 3. Acknowledge
        var ackHandler = new AcknowledgeMaintenanceHandler(db, landlordUser);
        await ackHandler.Handle(new AcknowledgeMaintenanceCommand(requestId, "John Plumber"), CancellationToken.None);

        var ackDto = await getByIdHandler.Handle(new GetMaintenanceRequestByIdQuery(requestId), CancellationToken.None);
        ackDto.Status.Should().Be(MaintenanceStatus.Acknowledged);
        ackDto.AssignedTo.Should().Be("John Plumber");

        // 4. In Progress
        var updateStatusHandler = new UpdateMaintenanceStatusHandler(db, landlordUser);
        await updateStatusHandler.Handle(new UpdateMaintenanceStatusCommand(
            requestId, MaintenanceStatus.InProgress, "Parts ordered, work started", null, null), CancellationToken.None);

        var inProgressDto = await getByIdHandler.Handle(new GetMaintenanceRequestByIdQuery(requestId), CancellationToken.None);
        inProgressDto.Status.Should().Be(MaintenanceStatus.InProgress);

        // 5. Complete with Actual Cost
        await updateStatusHandler.Handle(new UpdateMaintenanceStatusCommand(
            requestId, MaintenanceStatus.Completed, "Pipe replaced successfully", ActualCost: 4500m, null), CancellationToken.None);

        var completedDto = await getByIdHandler.Handle(new GetMaintenanceRequestByIdQuery(requestId), CancellationToken.None);
        completedDto.Status.Should().Be(MaintenanceStatus.Completed);
        completedDto.ActualCost.Should().Be(4500m);
        completedDto.CompletionNotes.Should().Be("Pipe replaced successfully");
    }

    [Fact]
    public async Task MaintenanceRequest_AccessControl_PreventsCrossLandlordAccess()
    {
        var dbName = Guid.NewGuid().ToString();

        using var db = CreateDbContext(dbName);
        var propA = Property.Create("Property A", PropertyType.Residential, "admin");
        var propB = Property.Create("Property B", PropertyType.Residential, "admin");
        db.Properties.AddRange(propA, propB);
        await db.SaveChangesAsync();

        var landlordA = new TestCurrentUserService { PropertyIds = new List<Guid> { propA.Id } };
        var landlordB = new TestCurrentUserService { PropertyIds = new List<Guid> { propB.Id } };

        // Landlord A creates request on Property A
        var createHandler = new CreateMaintenanceRequestHandler(db, landlordA);
        var reqAId = await createHandler.Handle(new CreateMaintenanceRequestCommand(
            propA.Id, null, null, null, null,
            MaintenanceCategory.Electrical,
            MaintenancePriority.Medium,
            "Faulty Socket",
            "Socket in living room is sparking",
            null
        ), CancellationToken.None);

        // Landlord B tries to read Landlord A's maintenance request -> ForbiddenException
        var getByIdHandlerB = new GetMaintenanceRequestByIdHandler(db, landlordB);
        var actRead = () => getByIdHandlerB.Handle(new GetMaintenanceRequestByIdQuery(reqAId), CancellationToken.None);
        await actRead.Should().ThrowAsync<ForbiddenException>();

        // Landlord B tries to create maintenance request on Property A -> ForbiddenException
        var createHandlerB = new CreateMaintenanceRequestHandler(db, landlordB);
        var actCreate = () => createHandlerB.Handle(new CreateMaintenanceRequestCommand(
            propA.Id, null, null, null, null,
            MaintenanceCategory.Painting,
            MaintenancePriority.Low,
            "Wall crack",
            "Description",
            null
        ), CancellationToken.None);
        await actCreate.Should().ThrowAsync<ForbiddenException>();

        // Landlord B lists maintenance requests -> should not contain Landlord A's request
        var listHandlerB = new GetMaintenanceRequestsHandler(db, landlordB);
        var listB = await listHandlerB.Handle(new GetMaintenanceRequestsQuery(null, null, null, null, null), CancellationToken.None);
        listB.Should().BeEmpty();
    }

    [Fact]
    public async Task LandlordPortalDashboard_ReturnsAccurateKPIs_ScopedToOwner()
    {
        var dbName = Guid.NewGuid().ToString();
        var landlord = new TestCurrentUserService();

        using var db = CreateDbContext(dbName);

        // Setup Owner & Property
        var owner = Owner.Create("Alice Landlord", "0711000111", "alice@test.com", "admin");
        db.Owners.Add(owner);
        await db.SaveChangesAsync();

        landlord.OwnerId = owner.Id;

        var prop = Property.Create("Apex Towers", PropertyType.Residential, "admin");
        db.Properties.Add(prop);
        await db.SaveChangesAsync();

        landlord.PropertyIds.Add(prop.Id);

        var building = Building.Create(prop.Id, "Block Alpha", 5, "Alpha", "admin");
        db.Buildings.Add(building);
        await db.SaveChangesAsync();

        var apt1 = Apartment.Create(building.Id, "101", floor: "1", description: "Unit 101", createdBy: "admin", monthlyRent: 25000m);
        var apt2 = Apartment.Create(building.Id, "102", floor: "1", description: "Unit 102", createdBy: "admin", monthlyRent: 30000m);
        db.Apartments.AddRange(apt1, apt2);
        await db.SaveChangesAsync();

        // Add Active Tenancy on apt1
        var tenant = Tenant.Create("John", "Doe", "0722000111", "john@test.com");
        db.Tenants.Add(tenant);
        await db.SaveChangesAsync();

        var tenancy = Tenancy.Create(apt1.Id, tenant.Id, 25000m, 25000m, DateTime.UtcNow.AddMonths(-3), tenancyReference: "TEN-001", createdBy: "admin");
        db.Tenancies.Add(tenancy);
        await db.SaveChangesAsync();

        // Add Rent Charge
        var currentPeriod = DateTime.UtcNow.ToString("yyyy-MM");
        var charge = RentCharge.Create(
            "CHG-001", tenancy.Id, tenant.Id, prop.Id, apt1.Id,
            currentPeriod, DateTime.UtcNow.Date, DateTime.UtcNow.Date.AddDays(5),
            25000m, "Monthly rent", "admin"
        );
        charge.ApplyPayment(15000m); // partially paid, 10000 outstanding
        db.RentCharges.Add(charge);

        // Add Water Transaction
        var waterTx = WaterTransaction.Create(
            "WTX-001", prop.Id, apt1.Id, Guid.NewGuid(),
            2000m, 20m, 100m,
            WaterPaymentMethod.Mpesa, "0722000111",
            DateTime.UtcNow, tenantId: tenant.Id
        );
        db.WaterTransactions.Add(waterTx);

        // Add Maintenance Request
        var maint = MaintenanceRequest.Create(
            prop.Id, MaintenanceCategory.Electrical, MaintenancePriority.High,
            "Broken Switch", "Switch in hallway", "admin"
        );
        db.MaintenanceRequests.Add(maint);
        await db.SaveChangesAsync();

        // Execute Dashboard Query
        var dashboardHandler = new GetLandlordPortalDashboardHandler(db, landlord);
        var dashboard = await dashboardHandler.Handle(new GetLandlordPortalDashboardQuery(), CancellationToken.None);

        dashboard.Should().NotBeNull();
        dashboard.OwnerName.Should().Be("Alice Landlord");

        // Property KPIs
        dashboard.PropertyStats.TotalProperties.Should().Be(1);
        dashboard.PropertyStats.TotalBuildings.Should().Be(1);
        dashboard.PropertyStats.TotalApartments.Should().Be(2);
        dashboard.PropertyStats.OccupiedApartments.Should().Be(1);
        dashboard.PropertyStats.VacantApartments.Should().Be(1);
        dashboard.PropertyStats.OccupancyRate.Should().Be(50.0m);

        // Rent KPIs
        dashboard.RentStats.MonthlyExpectedRent.Should().Be(25000m);
        dashboard.RentStats.MonthlyCollected.Should().Be(15000m);
        dashboard.RentStats.MonthlyOutstanding.Should().Be(10000m);
        dashboard.RentStats.ActiveTenancies.Should().Be(1);

        // Water KPIs
        dashboard.WaterStats.WaterRevenue.Should().Be(2000m);
        dashboard.WaterStats.UnitsPurchased.Should().Be(20m);

        // Maintenance KPIs
        dashboard.MaintenanceStats.OpenRequests.Should().Be(1);
    }

    [Fact]
    public async Task Notifications_Workflow_MarkRead_And_UnreadCount()
    {
        var dbName = Guid.NewGuid().ToString();
        var userGuid = Guid.NewGuid();
        var currentUser = new TestCurrentUserService { UserId = userGuid.ToString() };

        using var db = CreateDbContext(dbName);

        // Create 2 notifications
        var createHandler = new CreateNotificationHandler(db);
        var notif1Id = await createHandler.Handle(new CreateNotificationCommand(
            userGuid, NotificationType.RentPayment, "Rent Received", "Tenant paid KES 25,000 for unit 101"
        ), CancellationToken.None);

        var notif2Id = await createHandler.Handle(new CreateNotificationCommand(
            userGuid, NotificationType.MaintenanceUpdate, "Maintenance Acknowledged", "Plumber assigned to ticket #102"
        ), CancellationToken.None);

        // Check unread count = 2
        var countHandler = new GetUnreadNotificationCountHandler(db, currentUser);
        var unreadCount = await countHandler.Handle(new GetUnreadNotificationCountQuery(), CancellationToken.None);
        unreadCount.Should().Be(2);

        // Mark notif1 as read
        var markReadHandler = new MarkNotificationReadHandler(db, currentUser);
        await markReadHandler.Handle(new MarkNotificationReadCommand(notif1Id), CancellationToken.None);

        // Check unread count = 1
        unreadCount = await countHandler.Handle(new GetUnreadNotificationCountQuery(), CancellationToken.None);
        unreadCount.Should().Be(1);

        // Mark all as read
        var markAllHandler = new MarkAllNotificationsReadHandler(db, currentUser);
        await markAllHandler.Handle(new MarkAllNotificationsReadCommand(), CancellationToken.None);

        unreadCount = await countHandler.Handle(new GetUnreadNotificationCountQuery(), CancellationToken.None);
        unreadCount.Should().Be(0);
    }
}
