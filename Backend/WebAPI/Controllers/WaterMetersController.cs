using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.WaterLedger;
using MajiLedger.Domain.Enums;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/water/meters")]
[Produces("application/json")]
[Authorize]
[RequiresModule(AppModules.WaterLedger)]
public class WaterMetersController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<WaterMeterDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? propertyId = null,
        [FromQuery] MeterStatus? status = null,
        [FromQuery] MeterType? type = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await sender.Send(new GetWaterMetersQuery(propertyId, status, type, search), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(WaterMeterDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetWaterMeterByIdQuery(id), ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,PlatformAdmin,Manager")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterWaterMeterCommand command, CancellationToken ct)
    {
        var id = await sender.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,PlatformAdmin,Manager")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateWaterMeterRequest request, CancellationToken ct)
    {
        await sender.Send(new UpdateWaterMeterCommand(
            id,
            request.SerialNumber,
            request.Manufacturer,
            request.Model,
            request.Type,
            request.IntegrationType,
            request.InstallationDate,
            request.Notes), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/transfer")]
    [Authorize(Roles = "Admin,PlatformAdmin,Manager")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Transfer(Guid id, [FromBody] TransferMeterRequest request, CancellationToken ct)
    {
        await sender.Send(new TransferWaterMeterCommand(id, request.NewApartmentId, request.Reason), ct);
        return NoContent();
    }

    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "Admin,PlatformAdmin,Manager")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] ChangeWaterMeterStatusRequest request, CancellationToken ct)
    {
        await sender.Send(new UpdateWaterMeterStatusCommand(id, request.Status, request.Notes), ct);
        return NoContent();
    }
}

public record UpdateWaterMeterRequest(
    string? SerialNumber,
    string? Manufacturer,
    string? Model,
    MeterType Type,
    MeterIntegrationType IntegrationType,
    DateTime? InstallationDate,
    string? Notes);

public record TransferMeterRequest(
    Guid NewApartmentId,
    string? Reason = null);

public record ChangeWaterMeterStatusRequest(
    MeterStatus Status,
    string? Notes = null);
