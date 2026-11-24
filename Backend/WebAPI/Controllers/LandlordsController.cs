using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.PropertyManagement;
using MajiLedger.Domain.Enums;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/landlords")]
[Produces("application/json")]
[Authorize]
[RequiresModule(AppModules.PropertyManagement)]
public class LandlordsController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<LandlordDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await sender.Send(new GetLandlordsQuery(), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(LandlordDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetLandlordByIdQuery(id), ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create([FromBody] CreateLandlordRequest request, CancellationToken ct)
    {
        var id = await sender.Send(new CreateLandlordCommand(
            request.FullName,
            request.PhoneNumber,
            request.Email,
            request.NationalId,
            request.KraPin,
            request.Address,
            User.Identity?.Name), ct);

        return CreatedAtAction(nameof(GetById), new { id }, id);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLandlordRequest request, CancellationToken ct)
    {
        await sender.Send(new UpdateLandlordCommand(
            id,
            request.FullName,
            request.PhoneNumber,
            request.Email,
            request.NationalId,
            request.KraPin,
            request.Address,
            User.Identity?.Name), ct);

        return NoContent();
    }

    [HttpPut("{id:guid}/activate")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        await sender.Send(new ActivateLandlordCommand(id, User.Identity?.Name), ct);
        return NoContent();
    }

    [HttpPut("{id:guid}/deactivate")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        await sender.Send(new DeactivateLandlordCommand(id, User.Identity?.Name), ct);
        return NoContent();
    }

    [HttpGet("{id:guid}/properties")]
    [ProducesResponseType(typeof(List<LandlordAssignmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetProperties(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetLandlordPropertiesQuery(id), ct);
        return Ok(result);
    }

    [HttpPost("{landlordId:guid}/properties/{propertyId:guid}")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AssignProperty(
        Guid landlordId,
        Guid propertyId,
        [FromBody] AssignPropertyRequest? request,
        CancellationToken ct)
    {
        var role = request?.Role ?? OwnershipRole.PrimaryOwner;
        var id = await sender.Send(new AssignLandlordToPropertyCommand(landlordId, propertyId, role, User.Identity?.Name), ct);
        return Created(string.Empty, id);
    }

    [HttpDelete("assignments/{assignmentId:guid}")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveAssignment(Guid assignmentId, CancellationToken ct)
    {
        await sender.Send(new RemoveLandlordAssignmentCommand(assignmentId), ct);
        return NoContent();
    }
}

public record CreateLandlordRequest(
    string FullName,
    string PhoneNumber,
    string? Email = null,
    string? NationalId = null,
    string? KraPin = null,
    string? Address = null);

public record UpdateLandlordRequest(
    string FullName,
    string PhoneNumber,
    string? Email = null,
    string? NationalId = null,
    string? KraPin = null,
    string? Address = null);

public record AssignPropertyRequest(
    OwnershipRole Role = OwnershipRole.PrimaryOwner);
