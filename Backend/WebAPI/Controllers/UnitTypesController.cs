using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.PropertyManagement;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/unit-types")]
[Produces("application/json")]
[Authorize]
[RequiresModule(AppModules.PropertyManagement)]
public class UnitTypesController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<UnitTypeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false, CancellationToken ct = default)
    {
        var result = await sender.Send(new GetUnitTypesQuery(includeInactive), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(UnitTypeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetUnitTypeByIdQuery(id), ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create([FromBody] CreateUnitTypeCommand command, CancellationToken ct)
    {
        var id = await sender.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, id);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUnitTypeRequest request, CancellationToken ct)
    {
        await sender.Send(new UpdateUnitTypeCommand(id, request.Name, request.Description, request.SortOrder), ct);
        return NoContent();
    }

    [HttpPut("{id:guid}/activate")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        await sender.Send(new ActivateUnitTypeCommand(id), ct);
        return NoContent();
    }

    [HttpPut("{id:guid}/deactivate")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        await sender.Send(new DeactivateUnitTypeCommand(id), ct);
        return NoContent();
    }
}

public record UpdateUnitTypeRequest(
    string Name,
    string? Description = null,
    int SortOrder = 0);
