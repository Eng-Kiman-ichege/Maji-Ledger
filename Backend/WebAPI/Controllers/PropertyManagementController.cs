using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.PropertyManagement;
using MajiLedger.Domain.Enums;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/property-management")]
[Produces("application/json")]
[Authorize]
[RequiresModule(AppModules.PropertyManagement)]
public class PropertyManagementController(ISender sender) : ControllerBase
{
    // ── Properties ────────────────────────────────────────────────────────────

    [HttpGet("properties")]
    [ProducesResponseType(typeof(List<PropertySummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProperties(CancellationToken ct)
    {
        var result = await sender.Send(new GetPropertiesManagementQuery(), ct);
        return Ok(result);
    }

    [HttpGet("properties/{id:guid}")]
    [ProducesResponseType(typeof(PropertyDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPropertyById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetPropertyManagementByIdQuery(id), ct);
        return Ok(result);
    }

    [HttpPost("properties")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateProperty([FromBody] CreatePropertyManagementRequest request, CancellationToken ct)
    {
        var id = await sender.Send(new CreatePropertyManagementCommand(
            request.Name,
            request.PropertyCode,
            request.Type,
            request.PhysicalAddress,
            request.County,
            request.Town,
            request.PostalCode,
            request.Description,
            request.AssignedLandlordId,
            User.Identity?.Name), ct);

        return CreatedAtAction(nameof(GetPropertyById), new { id }, id);
    }

    [HttpPut("properties/{id:guid}")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateProperty(Guid id, [FromBody] UpdatePropertyManagementRequest request, CancellationToken ct)
    {
        await sender.Send(new UpdatePropertyManagementCommand(
            id,
            request.Name,
            request.PropertyCode,
            request.Type,
            request.PhysicalAddress,
            request.County,
            request.Town,
            request.PostalCode,
            request.Description,
            User.Identity?.Name), ct);

        return NoContent();
    }

    [HttpPut("properties/{id:guid}/activate")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActivateProperty(Guid id, CancellationToken ct)
    {
        await sender.Send(new ActivatePropertyManagementCommand(id, User.Identity?.Name), ct);
        return NoContent();
    }

    [HttpPut("properties/{id:guid}/deactivate")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeactivateProperty(Guid id, CancellationToken ct)
    {
        await sender.Send(new DeactivatePropertyManagementCommand(id, User.Identity?.Name), ct);
        return NoContent();
    }

    // ── Buildings ─────────────────────────────────────────────────────────────

    [HttpGet("properties/{propertyId:guid}/buildings")]
    [ProducesResponseType(typeof(List<BuildingSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetBuildings(Guid propertyId, CancellationToken ct)
    {
        var result = await sender.Send(new GetBuildingsManagementQuery(propertyId), ct);
        return Ok(result);
    }

    [HttpGet("buildings/{id:guid}")]
    [ProducesResponseType(typeof(BuildingSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetBuildingById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetBuildingManagementByIdQuery(id), ct);
        return Ok(result);
    }

    [HttpPost("properties/{propertyId:guid}/buildings")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateBuilding(Guid propertyId, [FromBody] CreateBuildingManagementRequest request, CancellationToken ct)
    {
        var id = await sender.Send(new CreateBuildingManagementCommand(
            propertyId,
            request.Name,
            request.BuildingCode,
            request.FloorCount,
            request.Description,
            User.Identity?.Name), ct);

        return CreatedAtAction(nameof(GetBuildingById), new { id }, id);
    }

    [HttpPut("buildings/{id:guid}")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateBuilding(Guid id, [FromBody] UpdateBuildingManagementRequest request, CancellationToken ct)
    {
        await sender.Send(new UpdateBuildingManagementCommand(
            id,
            request.Name,
            request.BuildingCode,
            request.FloorCount,
            request.Description,
            User.Identity?.Name), ct);

        return NoContent();
    }

    [HttpPut("buildings/{id:guid}/activate")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActivateBuilding(Guid id, CancellationToken ct)
    {
        await sender.Send(new ActivateBuildingManagementCommand(id, User.Identity?.Name), ct);
        return NoContent();
    }

    [HttpPut("buildings/{id:guid}/deactivate")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeactivateBuilding(Guid id, CancellationToken ct)
    {
        await sender.Send(new DeactivateBuildingManagementCommand(id, User.Identity?.Name), ct);
        return NoContent();
    }

    // ── Units ─────────────────────────────────────────────────────────────────

    [HttpGet("units")]
    [ProducesResponseType(typeof(List<UnitDetailDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnits(
        [FromQuery] Guid? propertyId = null,
        [FromQuery] Guid? buildingId = null,
        CancellationToken ct = default)
    {
        var result = await sender.Send(new GetUnitsManagementQuery(propertyId, buildingId), ct);
        return Ok(result);
    }

    [HttpGet("units/{id:guid}")]
    [ProducesResponseType(typeof(UnitDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUnitById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetUnitManagementByIdQuery(id), ct);
        return Ok(result);
    }

    [HttpPost("units")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateUnit([FromBody] CreateUnitManagementRequest request, CancellationToken ct)
    {
        var id = await sender.Send(new CreateUnitManagementCommand(
            request.PropertyId,
            request.BuildingId,
            request.UnitNumber,
            request.UnitTypeId,
            request.Floor,
            request.Description,
            request.MonthlyRent,
            User.Identity?.Name), ct);

        return CreatedAtAction(nameof(GetUnitById), new { id }, id);
    }

    [HttpPut("units/{id:guid}")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateUnit(Guid id, [FromBody] UpdateUnitManagementRequest request, CancellationToken ct)
    {
        await sender.Send(new UpdateUnitManagementCommand(
            id,
            request.UnitNumber,
            request.UnitTypeId,
            request.Floor,
            request.Description,
            request.MonthlyRent,
            User.Identity?.Name), ct);

        return NoContent();
    }

    [HttpPatch("units/{id:guid}/rent")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetUnitRent(Guid id, [FromBody] SetRentRequest request, CancellationToken ct)
    {
        await sender.Send(new SetUnitRentCommand(id, request.MonthlyRent, User.Identity?.Name), ct);
        return NoContent();
    }
}

public record CreatePropertyManagementRequest(
    string Name,
    string? PropertyCode = null,
    PropertyType Type = PropertyType.Residential,
    string? PhysicalAddress = null,
    string? County = null,
    string? Town = null,
    string? PostalCode = null,
    string? Description = null,
    Guid? AssignedLandlordId = null);

public record UpdatePropertyManagementRequest(
    string Name,
    string? PropertyCode = null,
    PropertyType Type = PropertyType.Residential,
    string? PhysicalAddress = null,
    string? County = null,
    string? Town = null,
    string? PostalCode = null,
    string? Description = null);

public record CreateBuildingManagementRequest(
    string Name,
    string? BuildingCode = null,
    int? FloorCount = null,
    string? Description = null);

public record UpdateBuildingManagementRequest(
    string Name,
    string? BuildingCode = null,
    int? FloorCount = null,
    string? Description = null);

public record CreateUnitManagementRequest(
    Guid PropertyId,
    Guid BuildingId,
    string UnitNumber,
    Guid? UnitTypeId = null,
    string? Floor = null,
    string? Description = null,
    decimal MonthlyRent = 0m);

public record UpdateUnitManagementRequest(
    string UnitNumber,
    Guid? UnitTypeId = null,
    string? Floor = null,
    string? Description = null,
    decimal MonthlyRent = 0m);

public record SetRentRequest(decimal MonthlyRent);
