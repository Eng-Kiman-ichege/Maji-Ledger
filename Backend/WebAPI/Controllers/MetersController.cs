using MajiLedger.Application.Features.Meters;
using MajiLedger.Application.Features.QrCodes;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/meters")]
[Produces("application/json")]
[Authorize]
public class MetersController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<MeterDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] Guid? propertyId, CancellationToken ct)
    {
        var result = await sender.Send(new GetMetersQuery(propertyId), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(MeterDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetMeterQuery(id), ct);
        return Ok(result);
    }

    [HttpGet("by-qr/{publicToken}")]
    [ProducesResponseType(typeof(MeterDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByQrToken(string publicToken, CancellationToken ct)
    {
        var result = await sender.Send(new GetMeterByQrTokenQuery(publicToken), ct);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateMeterCommand command, CancellationToken ct)
    {
        var id = await sender.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, id);
    }

    [HttpPost("{id:guid}/assignment")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignToApartment(Guid id, [FromBody] AssignMeterRequest request, CancellationToken ct)
    {
        await sender.Send(new AssignMeterToApartmentCommand(id, request.ApartmentId, request.AssignedBy), ct);
        return NoContent();
    }

    [HttpPut("{id:guid}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateMeterStatusRequest request, CancellationToken ct)
    {
        await sender.Send(new UpdateMeterStatusCommand(id, request.Status, request.UpdatedBy), ct);
        return NoContent();
    }

    [HttpGet("{id:guid}/shared-billing")]
    [ProducesResponseType(typeof(List<SharedMeterBillingPointDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSharedBilling(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetMeterSharedBillingPointsQuery(id), ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/shared-billing")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfigureSharedBilling(Guid id, [FromBody] ConfigureSharedBillingRequest request, CancellationToken ct)
    {
        await sender.Send(new ConfigureSharedMeterBillingPointsCommand(id, request.Allocations, request.ConfiguredBy), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/qr-code")]
    [ProducesResponseType(typeof(QrCodeRegistrationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RegisterQrCode(Guid id, [FromBody] RegisterQrCodeRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new RegisterQrCodeCommand(id, request.PaymentProviderConfigId, request.RegisteredBy ?? "System"), ct);
        return Created(string.Empty, result);
    }

    [HttpDelete("qr-code/{registrationId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeQrCode(Guid registrationId, [FromBody] RevokeQrCodeRequest request, CancellationToken ct)
    {
        await sender.Send(new Application.Features.QrCodes.RevokeQrCodeCommand(registrationId, request.Reason, request.RevokedBy), ct);
        return NoContent();
    }
}

public record AssignMeterRequest(Guid ApartmentId, string? AssignedBy);
public record UpdateMeterStatusRequest(MeterStatus Status, string UpdatedBy);
public record RegisterQrCodeRequest(Guid PaymentProviderConfigId, string? RegisteredBy);
public record RevokeQrCodeRequest(string Reason, string RevokedBy);
public record ConfigureSharedBillingRequest(List<SharedBillingAllocationInput> Allocations, string ConfiguredBy);
