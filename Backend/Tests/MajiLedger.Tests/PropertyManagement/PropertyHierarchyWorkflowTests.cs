using FluentAssertions;
using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Application.Features.PropertyManagement;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MajiLedger.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MajiLedger.Tests.PropertyManagement;

public class PropertyHierarchyWorkflowTests
{
    private MajiLedgerDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<MajiLedgerDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new MajiLedgerDbContext(options);
    }

    [Fact]
    public async Task CreateProperty_WithPropertyCodeAndLandlord_CreatesHierarchySuccessfully()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var landlord = Owner.Create("Mwangi Karanja", "0711999888");
        db.Owners.Add(landlord);
        await db.SaveChangesAsync();

        var propertyHandler = new CreatePropertyManagementHandler(db);
        var propertyId = await propertyHandler.Handle(new CreatePropertyManagementCommand(
            "Blue Valley Apartments",
            "BVA-01",
            PropertyType.Residential,
            "Langata Road",
            "Nairobi",
            "Nairobi South",
            "00100",
            "Modern apartment complex",
            landlord.Id,
            "admin@majiledger.com"), CancellationToken.None);

        propertyId.Should().NotBeEmpty();

        var property = await db.Properties
            .Include(p => p.Ownerships)
            .FirstOrDefaultAsync(p => p.Id == propertyId);

        property.Should().NotBeNull();
        property!.PropertyCode.Should().Be("BVA-01");
        property.Ownerships.Should().HaveCount(1);
        property.Ownerships.First().OwnerId.Should().Be(landlord.Id);
    }

    [Fact]
    public async Task CreateProperty_DuplicatePropertyCode_ThrowsConflictException()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var handler = new CreatePropertyManagementHandler(db);
        await handler.Handle(new CreatePropertyManagementCommand("Property One", "CODE-100"), CancellationToken.None);

        var act = async () => await handler.Handle(new CreatePropertyManagementCommand("Property Two", "CODE-100"), CancellationToken.None);
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*CODE-100*already in use*");
    }

    [Fact]
    public async Task CreateBuilding_DuplicateBuildingCodeWithinProperty_ThrowsConflictException()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var property = Property.Create("Green Towers", PropertyType.Residential, propertyCode: "GT-01");
        db.Properties.Add(property);
        await db.SaveChangesAsync();

        var buildingHandler = new CreateBuildingManagementHandler(db);
        await buildingHandler.Handle(new CreateBuildingManagementCommand(
            property.Id, "Block A", "BLK-A", 5, "Residential Block A"), CancellationToken.None);

        var act = async () => await buildingHandler.Handle(new CreateBuildingManagementCommand(
            property.Id, "Block A Duplicate", "BLK-A", 4), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*BLK-A*already in use*");
    }

    [Fact]
    public async Task UnitTypes_CreateAndList_EnforcesUniqueness()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var createHandler = new CreateUnitTypeHandler(db);
        var id1 = await createHandler.Handle(new CreateUnitTypeCommand("Bedsitter", "Single open room", 1), CancellationToken.None);
        var id2 = await createHandler.Handle(new CreateUnitTypeCommand("1 Bedroom", "One master bedroom with lounge", 2), CancellationToken.None);

        id1.Should().NotBeEmpty();
        id2.Should().NotBeEmpty();

        // Duplicate name check
        var act = async () => await createHandler.Handle(new CreateUnitTypeCommand("Bedsitter", "Duplicate"), CancellationToken.None);
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*Bedsitter*already exists*");

        // List unit types
        var listHandler = new GetUnitTypesHandler(db);
        var list = await listHandler.Handle(new GetUnitTypesQuery(), CancellationToken.None);
        list.Should().HaveCount(2);
        list[0].Name.Should().Be("Bedsitter");
        list[1].Name.Should().Be("1 Bedroom");
    }

    [Fact]
    public async Task CreateUnit_WithRentAndUnitType_Succeeds()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var property = Property.Create("Green Towers", PropertyType.Residential);
        var building = Building.Create(property.Id, "Block A");
        var unitType = UnitType.Create("2 Bedroom", "Two bedroom apartment", 3);
        db.Properties.Add(property);
        db.Buildings.Add(building);
        db.UnitTypes.Add(unitType);
        await db.SaveChangesAsync();

        var unitHandler = new CreateUnitManagementHandler(db);
        var unitId = await unitHandler.Handle(new CreateUnitManagementCommand(
            property.Id,
            building.Id,
            "A-101",
            unitType.Id,
            "1st Floor",
            "Front-facing 2 bedroom",
            35000m,
            "admin@majiledger.com"), CancellationToken.None);

        unitId.Should().NotBeEmpty();

        var unit = await db.Apartments.FindAsync(unitId);
        unit.Should().NotBeNull();
        unit!.UnitNumber.Should().Be("A-101");
        unit.MonthlyRent.Should().Be(35000m);
        unit.UnitTypeId.Should().Be(unitType.Id);
        unit.PropertyId.Should().Be(property.Id);
    }

    [Fact]
    public async Task CreateUnit_NegativeRent_ThrowsValidationException()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var property = Property.Create("Green Towers", PropertyType.Residential);
        var building = Building.Create(property.Id, "Block A");
        db.Properties.Add(property);
        db.Buildings.Add(building);
        await db.SaveChangesAsync();

        var unitHandler = new CreateUnitManagementHandler(db);
        var act = async () => await unitHandler.Handle(new CreateUnitManagementCommand(
            property.Id, building.Id, "A-102", MonthlyRent: -500m), CancellationToken.None);

        var ex = await act.Should().ThrowAsync<ValidationException>();
        ex.Which.Errors.Should().ContainKey("MonthlyRent");
        ex.Which.Errors["MonthlyRent"].Should().Contain("Monthly rent cannot be negative.");
    }

    [Fact]
    public async Task CreateUnit_DuplicateUnitNumberInBuilding_ThrowsConflictException()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var property = Property.Create("Green Towers", PropertyType.Residential);
        var building = Building.Create(property.Id, "Block A");
        db.Properties.Add(property);
        db.Buildings.Add(building);
        await db.SaveChangesAsync();

        var unitHandler = new CreateUnitManagementHandler(db);
        await unitHandler.Handle(new CreateUnitManagementCommand(
            property.Id, building.Id, "A-101", MonthlyRent: 20000m), CancellationToken.None);

        var act = async () => await unitHandler.Handle(new CreateUnitManagementCommand(
            property.Id, building.Id, "A-101", MonthlyRent: 22000m), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already exists in building*");
    }

    [Fact]
    public async Task SetUnitRent_UpdatesRentSuccessfully()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var property = Property.Create("Green Towers", PropertyType.Residential);
        var building = Building.Create(property.Id, "Block A");
        var unit = Apartment.Create(building.Id, "A-101", monthlyRent: 20000m);
        db.Properties.Add(property);
        db.Buildings.Add(building);
        db.Apartments.Add(unit);
        await db.SaveChangesAsync();

        var rentHandler = new SetUnitRentHandler(db);
        await rentHandler.Handle(new SetUnitRentCommand(unit.Id, 25000m, "admin@majiledger.com"), CancellationToken.None);

        var updatedUnit = await db.Apartments.FindAsync(unit.Id);
        updatedUnit!.MonthlyRent.Should().Be(25000m);

        // Negative rent update check
        var act = async () => await rentHandler.Handle(new SetUnitRentCommand(unit.Id, -100m), CancellationToken.None);
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task PropertyManagementQuery_LandlordOnlySeesAssignedPropertiesAndUnits()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);

        var landlord1 = Owner.Create("Landlord Alpha", "0711000111");
        var landlord2 = Owner.Create("Landlord Beta", "0722000222");
        var prop1 = Property.Create("Alpha Estate", PropertyType.Residential, propertyCode: "ALPHA-01");
        var prop2 = Property.Create("Beta Estate", PropertyType.Residential, propertyCode: "BETA-01");
        var bld1 = Building.Create(prop1.Id, "Block 1");
        var bld2 = Building.Create(prop2.Id, "Block 2");
        var unit1 = Apartment.Create(bld1.Id, "U-1", propertyId: prop1.Id, monthlyRent: 15000m);
        var unit2 = Apartment.Create(bld2.Id, "U-2", propertyId: prop2.Id, monthlyRent: 20000m);

        db.Owners.AddRange(landlord1, landlord2);
        db.Properties.AddRange(prop1, prop2);
        db.Buildings.AddRange(bld1, bld2);
        db.Apartments.AddRange(unit1, unit2);
        await db.SaveChangesAsync();

        var assignHandler = new AssignLandlordToPropertyHandler(db);
        await assignHandler.Handle(new AssignLandlordToPropertyCommand(landlord1.Id, prop1.Id), CancellationToken.None);
        await assignHandler.Handle(new AssignLandlordToPropertyCommand(landlord2.Id, prop2.Id), CancellationToken.None);

        // Landlord Alpha context
        var landlordUser = new TestCurrentUserService
        {
            Role = "Owner",
            OwnerId = landlord1.Id
        };

        // Query properties list: should only see Alpha Estate
        var propsHandler = new GetPropertiesManagementHandler(db, landlordUser);
        var props = await propsHandler.Handle(new GetPropertiesManagementQuery(), CancellationToken.None);
        props.Should().HaveCount(1);
        props[0].Id.Should().Be(prop1.Id);
        props[0].Name.Should().Be("Alpha Estate");

        // Query units: should only see U-1
        var unitsHandler = new GetUnitsManagementHandler(db, landlordUser);
        var units = await unitsHandler.Handle(new GetUnitsManagementQuery(), CancellationToken.None);
        units.Should().HaveCount(1);
        units[0].UnitNumber.Should().Be("U-1");

        // Access Beta Estate detail should throw ForbiddenException
        var detailHandler = new GetPropertyManagementByIdHandler(db, landlordUser);
        var act = async () => await detailHandler.Handle(new GetPropertyManagementByIdQuery(prop2.Id), CancellationToken.None);
        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("*not authorized to access this property*");
    }
}
