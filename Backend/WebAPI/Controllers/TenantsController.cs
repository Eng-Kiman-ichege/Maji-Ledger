using MajiLedger.Application.Features.Tenants;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/tenants")]
[Produces("application/json")]
[Authorize]
public class TenantsController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<TenantDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await sender.Send(new GetTenantsQuery(), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TenantDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetTenantQuery(id), ct);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateTenantCommand command, CancellationToken ct)
    {
        var id = await sender.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, id);
    }

    [HttpGet("/api/v1/apartments/{apartmentId:guid}/tenancies")]
    [ProducesResponseType(typeof(List<TenancyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetApartmentTenancies(Guid apartmentId, CancellationToken ct)
    {
        var result = await sender.Send(new GetApartmentTenanciesQuery(apartmentId), ct);
        return Ok(result);
    }

    [HttpPost("tenancies")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateTenancy([FromBody] CreateTenancyCommand command, CancellationToken ct)
    {
        var id = await sender.Send(command, ct);
        return Created(string.Empty, id);
    }

    [HttpPost("tenancies/{tenancyId:guid}/end")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EndTenancy(Guid tenancyId, [FromBody] EndTenancyRequest request, CancellationToken ct)
    {
        await sender.Send(new EndTenancyCommand(tenancyId, request.Notes), ct);
        return NoContent();
    }
}

public record EndTenancyRequest(string? Notes);
