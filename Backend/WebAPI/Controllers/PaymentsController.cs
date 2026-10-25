using MajiLedger.Application.Features.Payments;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/payments")]
[Produces("application/json")]
public class PaymentsController(ISender sender) : ControllerBase
{
    /// <summary>
    /// Scan-to-Pay public landing page endpoint.
    /// Returns verified property, building, apartment, masked meter, and payment options for a QR token.
    /// </summary>
    [HttpGet("scan/{publicToken}")]
    [ProducesResponseType(typeof(ScanToPayLandingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetScanToPayDetails(string publicToken, CancellationToken ct)
    {
        var result = await sender.Send(new GetScanToPayLandingQuery(publicToken), ct);
        return Ok(result);
    }

    /// <summary>
    /// Initiates a payment from the customer Scan-to-Pay page.
    /// Triggers STK Push / mobile payment prompt.
    /// </summary>
    [HttpPost("initiate-qr")]
    [ProducesResponseType(typeof(PaymentInitiationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> InitiateQrPayment([FromBody] InitiateQrPaymentCommand command, CancellationToken ct)
    {
        var result = await sender.Send(command, ct);
        return Ok(result);
    }

    /// <summary>
    /// Polls status of a payment attempt.
    /// </summary>
    [HttpGet("attempts/{attemptId:guid}")]
    [ProducesResponseType(typeof(PaymentAttemptDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAttempt(Guid attemptId, CancellationToken ct)
    {
        var result = await sender.Send(new GetPaymentAttemptQuery(attemptId), ct);
        return Ok(result);
    }

    /// <summary>
    /// Gets payment history for a given meter.
    /// </summary>
    [HttpGet("meters/{meterId:guid}/history")]
    [ProducesResponseType(typeof(List<PaymentAttemptDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMeterHistory(Guid meterId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await sender.Send(new GetPaymentHistoryQuery(meterId, page, pageSize), ct);
        return Ok(result);
    }

    /// <summary>
    /// Webhook callback endpoint for mobile money payment confirmations (e.g., M-Pesa C2B / STK callback).
    /// </summary>
    [HttpPost("callback")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfirmCallback([FromBody] ConfirmPaymentCommand command, CancellationToken ct)
    {
        await sender.Send(command, ct);
        return Ok(new { status = "success", message = "Callback processed successfully." });
    }
}
