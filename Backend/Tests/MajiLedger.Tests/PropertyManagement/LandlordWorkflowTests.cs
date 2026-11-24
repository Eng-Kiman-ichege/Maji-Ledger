using FluentAssertions;
using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.PropertyManagement;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MajiLedger.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MajiLedger.Tests.PropertyManagement;

public class TestCurrentUserService : ICurrentUserService
{
    public string? UserId { get; set; } = "user-123";
    public string? Email { get; set; } = "admin@majiledger.com";
    public string? Role { get; set; } = "Admin";
    public bool IsAuthenticated => true;
    public Guid? OwnerId { get; set; }
    public Guid? TenantId { get; set; }
    public IReadOnlyList<Guid> AuthorizedPropertyIds { get; set; } = [];
    public IReadOnlyList<string> Permissions { get; set; } = [];
    public IReadOnlyList<string> Modules { get; set; } = [AppModules.PropertyManagement, AppModules.WaterLedger];

    public bool IsInRole(string role) => Role == role;
    public bool HasPermission(string permission) => Permissions.Contains(permission);
    public bool HasModuleAccess(string module) => Modules.Contains(module);
    public bool HasPropertyAccess(Guid propertyId) => AuthorizedPropertyIds.Contains(propertyId);
}

public class LandlordWorkflowTests
{
    private MajiLedgerDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<MajiLedgerDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new MajiLedgerDbContext(options);
    }

    [Fact]
    public async Task CreateLandlord_ValidData_PersistsSuccessfully()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var handler = new CreateLandlordHandler(db);

        var id = await handler.Handle(new CreateLandlordCommand(
            "Peter Maina",
            "0712345678",
            "peter@example.com",
            "12345678",
            "A001122334Z",
            "P.O. Box 100, Nairobi",
            "admin@majiledger.com"), CancellationToken.None);

        id.Should().NotBeEmpty();

        var landlord = await db.Owners.FindAsync(id);
        landlord.Should().NotBeNull();
        landlord!.FullName.Should().Be("Peter Maina");
        landlord.PhoneNumber.Should().Be("0712345678");
        landlord.Address.Should().Be("P.O. Box 100, Nairobi");
        landlord.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task CreateLandlord_DuplicatePhoneNumber_ThrowsConflictException()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var handler = new CreateLandlordHandler(db);

        await handler.Handle(new CreateLandlordCommand(
            "Peter Maina", "0712345678"), CancellationToken.None);

        var act = async () => await handler.Handle(new CreateLandlordCommand(
            "Different Name", "0712345678"), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*0712345678*already exists*");
    }

    [Fact]
    public async Task CreateLandlord_MissingNameOrPhone_ThrowsValidationException()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var handler = new CreateLandlordHandler(db);

        var actNoName = async () => await handler.Handle(new CreateLandlordCommand(
            "", "0712345678"), CancellationToken.None);
        await actNoName.Should().ThrowAsync<ValidationException>();

        var actNoPhone = async () => await handler.Handle(new CreateLandlordCommand(
            "Peter Maina", ""), CancellationToken.None);
        await actNoPhone.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task AssignLandlordToProperty_DuplicateAssignment_ThrowsConflictException()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var landlord = Owner.Create("Sarah Ochieng", "0722000111");
        var property = Property.Create("Sunrise Court", PropertyType.Residential);
        db.Owners.Add(landlord);
        db.Properties.Add(property);
        await db.SaveChangesAsync();

        var assignHandler = new AssignLandlordToPropertyHandler(db);
        var assignmentId = await assignHandler.Handle(new AssignLandlordToPropertyCommand(
            landlord.Id, property.Id, OwnershipRole.PrimaryOwner), CancellationToken.None);

        assignmentId.Should().NotBeEmpty();

        // Duplicate assignment attempt
        var act = async () => await assignHandler.Handle(new AssignLandlordToPropertyCommand(
            landlord.Id, property.Id, OwnershipRole.CoOwner), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already actively assigned*");
    }

    [Fact]
    public async Task AssignLandlordToProperty_MultiplePrimaryOwners_ThrowsConflictException()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var landlord1 = Owner.Create("Landlord One", "0711111111");
        var landlord2 = Owner.Create("Landlord Two", "0722222222");
        var property = Property.Create("Highland View", PropertyType.Residential);
        db.Owners.AddRange(landlord1, landlord2);
        db.Properties.Add(property);
        await db.SaveChangesAsync();

        var assignHandler = new AssignLandlordToPropertyHandler(db);
        await assignHandler.Handle(new AssignLandlordToPropertyCommand(
            landlord1.Id, property.Id, OwnershipRole.PrimaryOwner), CancellationToken.None);

        // Assigning second landlord as PrimaryOwner must fail
        var act = async () => await assignHandler.Handle(new AssignLandlordToPropertyCommand(
            landlord2.Id, property.Id, OwnershipRole.PrimaryOwner), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already has an active primary landlord*");
    }

    [Fact]
    public async Task RemoveLandlordAssignment_ClosesAssignment()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var landlord = Owner.Create("Sarah Ochieng", "0722000111");
        var property = Property.Create("Sunrise Court", PropertyType.Residential);
        db.Owners.Add(landlord);
        db.Properties.Add(property);
        await db.SaveChangesAsync();

        var assignHandler = new AssignLandlordToPropertyHandler(db);
        var assignmentId = await assignHandler.Handle(new AssignLandlordToPropertyCommand(
            landlord.Id, property.Id, OwnershipRole.PrimaryOwner), CancellationToken.None);

        var removeHandler = new RemoveLandlordAssignmentHandler(db);
        await removeHandler.Handle(new RemoveLandlordAssignmentCommand(assignmentId), CancellationToken.None);

        var assignment = await db.PropertyOwnerships.FindAsync(assignmentId);
        assignment!.EffectiveTo.Should().NotBeNull();
    }

    [Fact]
    public async Task LandlordIsolation_OwnerCanOnlyAccessOwnRecordAndAssignedProperties()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var landlord1 = Owner.Create("Landlord One", "0711111111");
        var landlord2 = Owner.Create("Landlord Two", "0722222222");
        var prop1 = Property.Create("Property One", PropertyType.Residential);
        var prop2 = Property.Create("Property Two", PropertyType.Commercial);
        db.Owners.AddRange(landlord1, landlord2);
        db.Properties.AddRange(prop1, prop2);
        await db.SaveChangesAsync();

        var assignHandler = new AssignLandlordToPropertyHandler(db);
        await assignHandler.Handle(new AssignLandlordToPropertyCommand(landlord1.Id, prop1.Id), CancellationToken.None);
        await assignHandler.Handle(new AssignLandlordToPropertyCommand(landlord2.Id, prop2.Id), CancellationToken.None);

        // Current user is landlord1
        var landlordUser = new TestCurrentUserService
        {
            Role = "Owner",
            OwnerId = landlord1.Id
        };

        // Query landlords list: should only return landlord1
        var listHandler = new GetLandlordsHandler(db, landlordUser);
        var landlords = await listHandler.Handle(new GetLandlordsQuery(), CancellationToken.None);
        landlords.Should().HaveCount(1);
        landlords[0].Id.Should().Be(landlord1.Id);

        // Attempt to access landlord2 detail: should throw ForbiddenException
        var detailHandler = new GetLandlordByIdHandler(db, landlordUser);
        var act = async () => await detailHandler.Handle(new GetLandlordByIdQuery(landlord2.Id), CancellationToken.None);
        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("*cannot access another landlord*");

        // Attempt to access landlord2 properties: should throw ForbiddenException
        var propsHandler = new GetLandlordPropertiesHandler(db, landlordUser);
        var actProps = async () => await propsHandler.Handle(new GetLandlordPropertiesQuery(landlord2.Id), CancellationToken.None);
        await actProps.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("*cannot access another landlord*");
    }
}
