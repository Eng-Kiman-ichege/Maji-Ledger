using MajiLedger.Application.Features.Properties;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/properties")]
[Produces("application/json")]
public class PropertiesController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<PropertyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await sender.Send(new GetPropertiesQuery(), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PropertyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetPropertyQuery(id), ct);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create([FromBody] CreatePropertyCommand command, CancellationToken ct)
    {
        var id = await sender.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, id);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePropertyCommand command, CancellationToken ct)
    {
        if (id != command.Id)
            return BadRequest("Mismatched property ID.");

        await sender.Send(command, ct);
        return NoContent();
    }

    [HttpGet("{propertyId:guid}/buildings")]
    [ProducesResponseType(typeof(List<BuildingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBuildings(Guid propertyId, CancellationToken ct)
    {
        var result = await sender.Send(new GetBuildingsQuery(propertyId), ct);
        return Ok(result);
    }

    [HttpPost("{propertyId:guid}/buildings")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateBuilding(Guid propertyId, [FromBody] CreateBuildingCommand command, CancellationToken ct)
    {
        if (propertyId != command.PropertyId)
            return BadRequest("Mismatched property ID.");

        var id = await sender.Send(command, ct);
        return Created(string.Empty, id);
    }

    [HttpGet("/api/v1/buildings/{buildingId:guid}/apartments")]
    [ProducesResponseType(typeof(List<ApartmentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetApartments(Guid buildingId, CancellationToken ct)
    {
        var result = await sender.Send(new GetApartmentsQuery(buildingId), ct);
        return Ok(result);
    }

    [HttpPost("/api/v1/buildings/{buildingId:guid}/apartments")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateApartment(Guid buildingId, [FromBody] CreateApartmentCommand command, CancellationToken ct)
    {
        if (buildingId != command.BuildingId)
            return BadRequest("Mismatched building ID.");

        var id = await sender.Send(command, ct);
        return Created(string.Empty, id);
    }
}
