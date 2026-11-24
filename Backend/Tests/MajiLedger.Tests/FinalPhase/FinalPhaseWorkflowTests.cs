using FluentAssertions;
using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Application.Features.AdminControl;
using MajiLedger.Application.Features.FinancialReconciliation;
using MajiLedger.Application.Features.TenantPortal;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MajiLedger.Infrastructure.Persistence;
using MajiLedger.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MajiLedger.Tests.FinalPhase;

public class FinalPhaseCurrentUser : ICurrentUserService
{
    public string? UserId { get; set; } = Guid.NewGuid().ToString();
    public string? Email { get; set; } = "user@test.com";
    public string? Role { get; set; } = "Tenant";
    public bool IsAuthenticated => true;
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

public class FinalPhaseWorkflowTests
{
    private MajiLedgerDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<MajiLedgerDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new MajiLedgerDbContext(options);
    }

    [Fact]
    public async Task TenantPortal_Dashboard_And_ProfileUpdate_ShouldSucceed()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        // 1. Setup Property, Building, Apartment
        var property = Property.Create("Emerald Suites", PropertyType.Residential, "admin");
        db.Properties.Add(property);
        await db.SaveChangesAsync();

        var building = Building.Create(property.Id, "Wing A", 4, "A", "admin");
        db.Buildings.Add(building);
        await db.SaveChangesAsync();

        var apartment = Apartment.Create(building.Id, "A-101", floor: "1", description: "Standard", createdBy: "admin", monthlyRent: 35000m);
        db.Apartments.Add(apartment);
        await db.SaveChangesAsync();

        // 2. Setup Tenant & Login Account
        var tenant = Tenant.Create("Robert", "Mwangi", "0722333444", "robert@tenant.com");
        db.Tenants.Add(tenant);
        await db.SaveChangesAsync();

        var userGuid = Guid.NewGuid();
        var user = ApplicationUser.Create("robert@tenant.com", "0722333444", "Robert Mwangi", "hash", UserRole.Tenant, tenantId: tenant.Id);
        db.ApplicationUsers.Add(user);
        tenant.LinkUser(user.Id);
        await db.SaveChangesAsync();

        // 3. Setup Tenancy
        var tenancy = Tenancy.Create(apartment.Id, tenant.Id, 35000m, 35000m, DateTime.UtcNow.AddMonths(-2), tenancyReference: "TEN-MWANGI", createdBy: "admin");
        db.Tenancies.Add(tenancy);
        await db.SaveChangesAsync();

        // 4. Setup Rent Charge & Confirmed Payment
        var charge = RentCharge.Create("CHG-001", tenancy.Id, tenant.Id, property.Id, apartment.Id, "2026-11", DateTime.UtcNow.Date, DateTime.UtcNow.Date.AddDays(5), 35000m, "Rent", "admin");
        charge.ApplyPayment(35000m);
        db.RentCharges.Add(charge);

        var payment = RentPayment.Create("RCP-001", tenancy.Id, tenant.Id, property.Id, apartment.Id, 35000m, RentPaymentMethod.Mpesa, DateTime.UtcNow, "REC-001", "admin");
        db.RentPayments.Add(payment);
        await db.SaveChangesAsync();

        // 5. Query Tenant Portal Dashboard
        var currentUser = new FinalPhaseCurrentUser
        {
            UserId = user.Id.ToString(),
            Role = "Tenant",
            TenantId = tenant.Id
        };

        var handler = new GetTenantPortalDashboardHandler(db, currentUser);
        var dash = await handler.Handle(new GetTenantPortalDashboardQuery(), CancellationToken.None);

        dash.Should().NotBeNull();
        dash.FullName.Should().Be("Robert Mwangi");
        dash.PropertyName.Should().Be("Emerald Suites");
        dash.UnitNumber.Should().Be("A-101");
        dash.MonthlyRent.Should().Be(35000m);
        dash.TotalRentPaid.Should().Be(35000m);
        dash.OutstandingBalance.Should().Be(0m);
        dash.RecentPayments.Should().HaveCount(1);
        dash.RecentPayments[0].Amount.Should().Be(35000m);

        // 6. Update Tenant Profile
        var updateHandler = new UpdateTenantProfileHandler(db, currentUser);
        await updateHandler.Handle(new UpdateTenantProfileCommand("0799888777", "0711222333", "newemail@test.com", "P.O Box 123"), CancellationToken.None);

        var getProfileHandler = new GetTenantProfileHandler(db, currentUser);
        var profile = await getProfileHandler.Handle(new GetTenantProfileQuery(), CancellationToken.None);
        profile.PhoneNumber.Should().Be("0799888777");
        profile.AlternativePhoneNumber.Should().Be("0711222333");
        profile.Email.Should().Be("newemail@test.com");
    }

    [Fact]
    public async Task FinancialReconciliation_Process_And_ResolveDiscrepancy_ShouldWorkCorrectly()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var prop = Property.Create("City Plaza", PropertyType.Commercial, "admin");
        db.Properties.Add(prop);
        await db.SaveChangesAsync();

        var bld = Building.Create(prop.Id, "Tower 1", 10, "T1", "admin");
        db.Buildings.Add(bld);
        await db.SaveChangesAsync();

        var apt = Apartment.Create(bld.Id, "Shop-01", createdBy: "admin");
        db.Apartments.Add(apt);
        await db.SaveChangesAsync();

        var tenant = Tenant.Create("Acme", "Corp", "0700000000", "acme@test.com");
        db.Tenants.Add(tenant);
        await db.SaveChangesAsync();

        var tenancy = Tenancy.Create(apt.Id, tenant.Id, 50000m, 50000m, DateTime.UtcNow.AddMonths(-1), createdBy: "admin");
        db.Tenancies.Add(tenancy);
        await db.SaveChangesAsync();

        // 1. Add internal confirmed rent payment
        var rentPayment = RentPayment.Create("MPESA-CONFIRMED-1", tenancy.Id, tenant.Id, prop.Id, apt.Id, 50000m, RentPaymentMethod.Mpesa, DateTime.UtcNow, "REC-101", "admin");
        db.RentPayments.Add(rentPayment);
        await db.SaveChangesAsync();

        // 2. Process external bank statement with:
        //    - One matching reference ("MPESA-CONFIRMED-1", 50000)
        //    - One mismatching amount ("MPESA-MISMATCH", internal=0, ext=25000)
        var externalStatement = new List<ExternalStatementItem>
        {
            new("MPESA-CONFIRMED-1", 50000m, DateTime.UtcNow, "M-Pesa"),
            new("MPESA-MISMATCH", 25000m, DateTime.UtcNow, "Bank")
        };

        var financeUser = new FinalPhaseCurrentUser { Role = "FinanceOfficer", UserId = "finance-admin" };
        var processHandler = new ProcessReconciliationHandler(db, financeUser);

        var sessionId = await processHandler.Handle(new ProcessReconciliationCommand(
            ReconciliationLedgerType.Rent,
            prop.Id,
            DateTime.UtcNow.AddDays(-7),
            DateTime.UtcNow.AddDays(1),
            externalStatement,
            "Weekly bank statement reconciliation"
        ), CancellationToken.None);

        sessionId.Should().NotBeEmpty();

        // 3. Verify session summary
        var getSessionsHandler = new GetReconciliationSessionsHandler(db);
        var sessions = await getSessionsHandler.Handle(new GetReconciliationSessionsQuery(PropertyId: prop.Id), CancellationToken.None);
        sessions.Should().HaveCount(1);
        sessions[0].MatchedCount.Should().Be(1);
        sessions[0].UnmatchedCount.Should().Be(1);
        sessions[0].Status.Should().Be(ReconciliationStatus.DiscrepanciesFlagged);

        // 4. Verify Discrepancies
        var getDiscrepanciesHandler = new GetDiscrepanciesHandler(db);
        var discrepancies = await getDiscrepanciesHandler.Handle(new GetDiscrepanciesQuery(SessionId: sessionId), CancellationToken.None);
        discrepancies.Should().HaveCount(1);
        discrepancies[0].TransactionReference.Should().Be("MPESA-MISMATCH");
        discrepancies[0].Status.Should().Be(DiscrepancyStatus.Pending);

        // 5. Resolve Discrepancy
        var resolveHandler = new ResolveDiscrepancyHandler(db, financeUser);
        await resolveHandler.Handle(new ResolveDiscrepancyCommand(discrepancies[0].Id, "Verified as direct bank deposit for deposit arrears"), CancellationToken.None);

        var updatedDiscrepancies = await getDiscrepanciesHandler.Handle(new GetDiscrepanciesQuery(SessionId: sessionId), CancellationToken.None);
        updatedDiscrepancies[0].Status.Should().Be(DiscrepancyStatus.Resolved);
        updatedDiscrepancies[0].ResolutionNotes.Should().Contain("direct bank deposit");
    }

    [Fact]
    public async Task AdminControl_Dashboard_And_UserManagement_ShouldFunction()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        // Create sample data
        var prop = Property.Create("Highland Park", PropertyType.Residential, "admin");
        db.Properties.Add(prop);

        var hasher = new PasswordHasher();
        var adminUser = ApplicationUser.Create("super@admin.com", "0711111111", "Super Admin", hasher.HashPassword("OldPass123!"), UserRole.Admin);
        db.ApplicationUsers.Add(adminUser);
        await db.SaveChangesAsync();

        // 1. Admin Dashboard Query
        var dashHandler = new GetAdminExecutiveDashboardHandler(db);
        var dash = await dashHandler.Handle(new GetAdminExecutiveDashboardQuery(), CancellationToken.None);

        dash.Should().NotBeNull();
        dash.TotalProperties.Should().Be(1);

        // 2. Toggle Active User
        var toggleHandler = new ToggleUserActiveHandler(db);
        var isActive = await toggleHandler.Handle(new ToggleUserActiveCommand(adminUser.Id), CancellationToken.None);
        isActive.Should().BeFalse();

        // 3. Reset Password
        var resetPassHandler = new ResetUserPasswordHandler(db, hasher);
        await resetPassHandler.Handle(new ResetUserPasswordCommand(adminUser.Id, "NewPass456!"), CancellationToken.None);

        var updatedUser = await db.ApplicationUsers.FirstOrDefaultAsync(u => u.Id == adminUser.Id);
        hasher.VerifyPassword("NewPass456!", updatedUser!.PasswordHash).Should().BeTrue();

        // 4. System Settings
        var adminCurrentUser = new FinalPhaseCurrentUser { Role = "Admin", UserId = "admin-1" };
        var settingHandler = new UpdateSystemSettingHandler(db, adminCurrentUser);
        await settingHandler.Handle(new UpdateSystemSettingCommand("PlatformName", "PropertyLedger Cloud"), CancellationToken.None);

        var getSettingsHandler = new GetSystemSettingsHandler(db);
        var settings = await getSettingsHandler.Handle(new GetSystemSettingsQuery(), CancellationToken.None);
        settings.Should().ContainSingle(s => s.Key == "PlatformName" && s.Value == "PropertyLedger Cloud");
    }
}
