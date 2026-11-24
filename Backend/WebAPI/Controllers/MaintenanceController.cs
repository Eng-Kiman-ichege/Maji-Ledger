using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.LandlordPortal;
using MajiLedger.Domain.Enums;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/maintenance")]
[Produces("application/json")]
[Authorize]
[RequiresModule(AppModules.PropertyManagement)]
public class MaintenanceController(ISender sender) : ControllerBase
{
    /// <summary>Lists maintenance requests (scoped to authorized properties).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<MaintenanceRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? propertyId,
        [FromQuery] Guid? apartmentId,
        [FromQuery] MaintenanceStatus? status,
        [FromQuery] MaintenancePriority? priority,
        [FromQuery] MaintenanceCategory? category,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await sender.Send(
            new GetMaintenanceRequestsQuery(propertyId, apartmentId, status, priority, category, page, pageSize), ct);
        return Ok(result);
    }

    /// <summary>Gets a single maintenance request by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(MaintenanceRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetMaintenanceRequestByIdQuery(id), ct);
        return Ok(result);
    }

    /// <summary>Creates a new maintenance request.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateMaintenanceRequest request, CancellationToken ct)
    {
        var id = await sender.Send(new CreateMaintenanceRequestCommand(
            request.PropertyId,
            request.BuildingId,
            request.ApartmentId,
            request.TenancyId,
            request.TenantId,
            request.Category,
            request.Priority,
            request.Title,
            request.Description,
            request.EstimatedCost), ct);

        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    /// <summary>Acknowledges a maintenance request.</summary>
    [HttpPatch("{id:guid}/acknowledge")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Acknowledge(Guid id, [FromBody] AcknowledgeRequest request, CancellationToken ct)
    {
        await sender.Send(new AcknowledgeMaintenanceCommand(id, request.AssignedTo), ct);
        return NoContent();
    }

    /// <summary>Updates the status of a maintenance request.</summary>
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request, CancellationToken ct)
    {
        await sender.Send(new UpdateMaintenanceStatusCommand(
            id, request.Status, request.Notes, request.ActualCost, request.AssignedTo), ct);
        return NoContent();
    }

    /// <summary>Cancels a maintenance request.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelRequest request, CancellationToken ct)
    {
        await sender.Send(new CancelMaintenanceRequestCommand(id, request.Reason), ct);
        return NoContent();
    }
}

// ── Request models ─────────────────────────────────────────────────────────────

public record CreateMaintenanceRequest(
    Guid PropertyId,
    Guid? BuildingId,
    Guid? ApartmentId,
    Guid? TenancyId,
    Guid? TenantId,
    MaintenanceCategory Category,
    MaintenancePriority Priority,
    string Title,
    string Description,
    decimal? EstimatedCost);

public record AcknowledgeRequest(string? AssignedTo);

public record UpdateStatusRequest(
    MaintenanceStatus Status,
    string? Notes,
    decimal? ActualCost,
    string? AssignedTo);

public record CancelRequest(string Reason);
