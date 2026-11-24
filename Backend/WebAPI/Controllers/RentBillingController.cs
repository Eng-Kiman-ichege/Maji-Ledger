using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.RentLedger;
using MajiLedger.Domain.Enums;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/rent/charges")]
[Produces("application/json")]
[Authorize]
[RequiresModule(AppModules.PropertyManagement)]
public class RentBillingController(ISender sender) : ControllerBase
{
    /// <summary>Generates monthly rent charges for all active tenancies.</summary>
    [HttpPost("generate")]
    [Authorize(Roles = "Admin,PlatformAdmin,Manager,FinanceOfficer")]
    [ProducesResponseType(typeof(GenerateChargesResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateMonthly(
        [FromBody] GenerateChargesRequest request, CancellationToken ct)
    {
        var result = await sender.Send(
            new GenerateMonthlyRentChargesCommand(request.BillingPeriod, request.PropertyId), ct);
        return Ok(result);
    }

    /// <summary>Creates a one-off manual rent charge for a specific tenancy.</summary>
    [HttpPost("manual")]
    [Authorize(Roles = "Admin,PlatformAdmin,Manager,FinanceOfficer")]
    [ProducesResponseType(typeof(RentChargeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateManual(
        [FromBody] CreateManualChargeRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new CreateManualRentChargeCommand(
            request.TenancyId, request.BillingPeriod,
            request.BillingDate, request.DueDate,
            request.Amount, request.Description), ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>Cancels a rent charge (only if no payments are applied).</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelChargeRequest request, CancellationToken ct)
    {
        await sender.Send(new CancelRentChargeCommand(id, request.Reason), ct);
        return NoContent();
    }

    /// <summary>Lists rent charges with optional filters.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<RentChargeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? propertyId = null,
        [FromQuery] Guid? tenancyId = null,
        [FromQuery] Guid? tenantId = null,
        [FromQuery] string? billingPeriod = null,
        [FromQuery] RentChargeStatus? status = null,
        CancellationToken ct = default)
    {
        var result = await sender.Send(
            new GetRentChargesQuery(propertyId, tenancyId, tenantId, billingPeriod, status), ct);
        return Ok(result);
    }

    /// <summary>Gets a single rent charge by ID, including allocations.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(RentChargeDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetRentChargeByIdQuery(id), ct);
        return Ok(result);
    }
}

// ── Request models ─────────────────────────────────────────────────────────────

public record GenerateChargesRequest(string BillingPeriod, Guid? PropertyId = null);

public record CreateManualChargeRequest(
    Guid TenancyId,
    string BillingPeriod,
    DateTime BillingDate,
    DateTime DueDate,
    decimal Amount,
    string? Description = null);

public record CancelChargeRequest(string Reason);
