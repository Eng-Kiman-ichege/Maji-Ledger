using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.RentLedger;
using MajiLedger.Domain.Enums;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/rent/payments")]
[Produces("application/json")]
[Authorize]
[RequiresModule(AppModules.PropertyManagement)]
public class RentPaymentsController(ISender sender) : ControllerBase
{
    /// <summary>Records a new rent payment and auto-allocates it to oldest open charges.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin,PlatformAdmin,Manager,FinanceOfficer")]
    [ProducesResponseType(typeof(RecordRentPaymentResult), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Record(
        [FromBody] RecordPaymentRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new RecordRentPaymentCommand(
            request.TenancyId,
            request.Amount,
            request.PaymentMethod,
            request.PaymentDate,
            request.TransactionReference,
            request.PayerName,
            request.PayerPhoneNumber,
            request.Notes), ct);
        return CreatedAtAction(nameof(GetById), new { id = result.PaymentId }, result);
    }

    /// <summary>Reverses a confirmed rent payment and un-applies all allocations.</summary>
    [HttpPost("{id:guid}/reverse")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reverse(Guid id, [FromBody] ReversePaymentRequest request, CancellationToken ct)
    {
        await sender.Send(new ReverseRentPaymentCommand(id, request.Reason), ct);
        return NoContent();
    }

    /// <summary>Lists rent payments with optional filters.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<RentPaymentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? propertyId = null,
        [FromQuery] Guid? tenancyId = null,
        [FromQuery] Guid? tenantId = null,
        [FromQuery] RentPaymentStatus? status = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken ct = default)
    {
        var result = await sender.Send(
            new GetRentPaymentsQuery(propertyId, tenancyId, tenantId, status, fromDate, toDate), ct);
        return Ok(result);
    }

    /// <summary>Gets a single payment by ID, including charge allocations.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(RentPaymentDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetRentPaymentByIdQuery(id), ct);
        return Ok(result);
    }
}

// ── Request models ─────────────────────────────────────────────────────────────

public record RecordPaymentRequest(
    Guid TenancyId,
    decimal Amount,
    RentPaymentMethod PaymentMethod,
    DateTime PaymentDate,
    string? TransactionReference = null,
    string? PayerName = null,
    string? PayerPhoneNumber = null,
    string? Notes = null);

public record ReversePaymentRequest(string Reason);
