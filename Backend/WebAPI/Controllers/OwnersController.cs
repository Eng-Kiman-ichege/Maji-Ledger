using MajiLedger.Application.Features.Owners;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/owners")]
[Produces("application/json")]
public class OwnersController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<OwnerDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await sender.Send(new GetOwnersQuery(), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OwnerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetOwnerQuery(id), ct);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateOwnerCommand command, CancellationToken ct)
    {
        var id = await sender.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, id);
    }

    [HttpGet("/api/v1/properties/{propertyId:guid}/owners")]
    [ProducesResponseType(typeof(List<PropertyOwnershipDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPropertyOwners(Guid propertyId, CancellationToken ct)
    {
        var result = await sender.Send(new GetPropertyOwnersQuery(propertyId), ct);
        return Ok(result);
    }

    [HttpPost("/api/v1/properties/{propertyId:guid}/owners")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AssignOwnership(Guid propertyId, [FromBody] AssignOwnershipRequest request, CancellationToken ct)
    {
        var id = await sender.Send(new AssignPropertyOwnershipCommand(request.OwnerId, propertyId, request.Role, request.CreatedBy), ct);
        return Created(string.Empty, id);
    }

    [HttpDelete("ownership/{ownershipId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveOwnership(Guid ownershipId, CancellationToken ct)
    {
        await sender.Send(new RemovePropertyOwnershipCommand(ownershipId), ct);
        return NoContent();
    }
}

public record AssignOwnershipRequest(
    Guid OwnerId,
    MajiLedger.Domain.Enums.OwnershipRole Role = MajiLedger.Domain.Enums.OwnershipRole.PrimaryOwner,
    string? CreatedBy = null);
