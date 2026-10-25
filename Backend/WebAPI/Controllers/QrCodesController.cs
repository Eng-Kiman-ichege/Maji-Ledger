using MajiLedger.Application.Features.QrCodes;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/qr-codes")]
[Produces("application/json")]
public class QrCodesController(ISender sender) : ControllerBase
{
    /// <summary>
    /// Preview the verified customer destination before activating or registering a QR code.
    /// Validates cross-property Paybill mapping and apartment assignment.
    /// </summary>
    [HttpGet("preview-configuration")]
    [ProducesResponseType(typeof(QrRegistrationPreviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PreviewConfiguration(
        [FromQuery] Guid meterId,
        [FromQuery] Guid paymentProviderConfigId,
        CancellationToken ct)
    {
        var result = await sender.Send(new PreviewQrRegistrationQuery(meterId, paymentProviderConfigId), ct);
        return Ok(result);
    }

    /// <summary>
    /// Get registration details by public token.
    /// </summary>
    [HttpGet("{publicToken}")]
    [ProducesResponseType(typeof(QrCodeRegistrationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByToken(string publicToken, CancellationToken ct)
    {
        var result = await sender.Send(new GetQrRegistrationByTokenQuery(publicToken), ct);
        return Ok(result);
    }

    /// <summary>
    /// Get active QR registration for a water meter.
    /// </summary>
    [HttpGet("meter/{meterId:guid}")]
    [ProducesResponseType(typeof(QrCodeRegistrationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActiveByMeter(Guid meterId, CancellationToken ct)
    {
        var result = await sender.Send(new GetMeterActiveQrCodeQuery(meterId), ct);
        return result is null ? NotFound("No active QR code for this meter.") : Ok(result);
    }

    /// <summary>
    /// Registers a new QR code for a water meter and payment provider configuration.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(QrCodeRegistrationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterQrCodeCommand command, CancellationToken ct)
    {
        var result = await sender.Send(command, ct);
        return CreatedAtAction(nameof(GetByToken), new { publicToken = result.PublicToken }, result);
    }

    /// <summary>
    /// Replaces an existing QR code sticker (atomically revokes previous registration and creates new).
    /// </summary>
    [HttpPost("replace")]
    [ProducesResponseType(typeof(QrCodeRegistrationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Replace([FromBody] ReplaceQrCodeCommand command, CancellationToken ct)
    {
        var result = await sender.Send(command, ct);
        return Ok(result);
    }

    /// <summary>
    /// Temporarily disables a QR code (e.g. during maintenance).
    /// </summary>
    [HttpPut("{id:guid}/disable")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Disable(Guid id, [FromBody] DisableQrCodeRequest request, CancellationToken ct)
    {
        await sender.Send(new DisableQrCodeCommand(id, request.DisabledBy), ct);
        return NoContent();
    }

    /// <summary>
    /// Re-enables a disabled QR code.
    /// </summary>
    [HttpPut("{id:guid}/enable")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Enable(Guid id, [FromBody] EnableQrCodeRequest request, CancellationToken ct)
    {
        await sender.Send(new EnableQrCodeCommand(id, request.EnabledBy), ct);
        return NoContent();
    }

    /// <summary>
    /// Permanently revokes a QR code (cannot be re-enabled).
    /// </summary>
    [HttpPut("{id:guid}/revoke")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Revoke(Guid id, [FromBody] RevokeQrCodeRequest request, CancellationToken ct)
    {
        await sender.Send(new RevokeQrCodeCommand(id, request.Reason, request.RevokedBy), ct);
        return NoContent();
    }

    /// <summary>
    /// Downloads printable meter sticker data, including vector SVG QR code and labels for physical printing.
    /// </summary>
    [HttpGet("{id:guid}/sticker")]
    [ProducesResponseType(typeof(MeterStickerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSticker(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetMeterStickerQuery(id), ct);
        return Ok(result);
    }

    /// <summary>
    /// Retrieves immutable audit trail of all lifecycle events on a QR code.
    /// </summary>
    [HttpGet("{id:guid}/audit-logs")]
    [ProducesResponseType(typeof(List<QrCodeAuditLogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetQrAuditLogsQuery(id), ct);
        return Ok(result);
    }
}

public record DisableQrCodeRequest(string DisabledBy);
public record EnableQrCodeRequest(string EnabledBy);
