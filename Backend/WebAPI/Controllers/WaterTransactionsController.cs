using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.WaterLedger;
using MajiLedger.Domain.Enums;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/water/transactions")]
[Produces("application/json")]
[Authorize]
[RequiresModule(AppModules.WaterLedger)]
public class WaterTransactionsController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<WaterTransactionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? propertyId = null,
        [FromQuery] Guid? meterId = null,
        [FromQuery] WaterTransactionPaymentStatus? paymentStatus = null,
        [FromQuery] WaterTransactionTokenStatus? tokenStatus = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await sender.Send(new GetWaterTransactionsQuery(
            propertyId, meterId, paymentStatus, tokenStatus, fromDate, toDate, search), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(WaterTransactionDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetWaterTransactionByIdQuery(id), ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/manual-token")]
    [Authorize(Roles = "Admin,PlatformAdmin,Manager,FinanceOfficer")]
    [ProducesResponseType(typeof(WaterTransactionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> EnterManualToken(
        Guid id,
        [FromBody] EnterManualTokenRequest request,
        CancellationToken ct)
    {
        var result = await sender.Send(new EnterManualTokenCommand(
            id, request.TokenValue, request.ProviderReference, request.Notes), ct);
        return Ok(result);
    }
}

public record EnterManualTokenRequest(
    string TokenValue,
    string? ProviderReference = null,
    string? Notes = null);
