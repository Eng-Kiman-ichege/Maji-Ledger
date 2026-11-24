using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.Tenants;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/tenants")]
[Produces("application/json")]
[Authorize]
[RequiresModule(AppModules.PropertyManagement)]
public class TenantsController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<TenantDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] bool includeInactive = false,
        CancellationToken ct = default)
    {
        var result = await sender.Send(new GetTenantsQuery(search, includeInactive), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TenantDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetTenantQuery(id), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}/tenancies")]
    [ProducesResponseType(typeof(List<TenantTenancySummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetHistory(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetTenantHistoryQuery(id), ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create([FromBody] CreateTenantRequest request, CancellationToken ct)
    {
        var id = await sender.Send(new CreateTenantCommand(
            request.FirstName,
            request.LastName,
            request.PhoneNumber,
            request.MiddleName,
            request.Email,
            request.NationalId,
            request.AlternativePhoneNumber,
            request.Address,
            request.UserId,
            User.Identity?.Name), ct);

        return CreatedAtAction(nameof(GetById), new { id }, id);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTenantRequest request, CancellationToken ct)
    {
        await sender.Send(new UpdateTenantCommand(
            id,
            request.FirstName,
            request.LastName,
            request.PhoneNumber,
            request.MiddleName,
            request.Email,
            request.NationalId,
            request.AlternativePhoneNumber,
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
        await sender.Send(new ActivateTenantCommand(id, User.Identity?.Name), ct);
        return NoContent();
    }

    [HttpPut("{id:guid}/deactivate")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        await sender.Send(new DeactivateTenantCommand(id, User.Identity?.Name), ct);
        return NoContent();
    }
}

public record CreateTenantRequest(
    string FirstName,
    string LastName,
    string PhoneNumber,
    string? MiddleName = null,
    string? Email = null,
    string? NationalId = null,
    string? AlternativePhoneNumber = null,
    string? Address = null,
    Guid? UserId = null);

public record UpdateTenantRequest(
    string FirstName,
    string LastName,
    string PhoneNumber,
    string? MiddleName = null,
    string? Email = null,
    string? NationalId = null,
    string? AlternativePhoneNumber = null,
    string? Address = null);
