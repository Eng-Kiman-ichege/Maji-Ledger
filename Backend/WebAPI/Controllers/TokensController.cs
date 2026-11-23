using MajiLedger.Application.Features.Tokens;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/tokens")]
[Produces("application/json")]
[Authorize]
public class TokensController(ISender sender) : ControllerBase
{
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(WaterTokenDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetTokenQuery(id), ct);
        return Ok(result);
    }

    [HttpGet("by-purchase/{purchaseId:guid}")]
    [ProducesResponseType(typeof(WaterTokenDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByPurchase(Guid purchaseId, CancellationToken ct)
    {
        var result = await sender.Send(new GetTokenByPurchaseQuery(purchaseId), ct);
        return Ok(result);
    }

    [HttpGet("meters/{meterId:guid}/history")]
    [ProducesResponseType(typeof(List<TokenPurchaseHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMeterHistory(Guid meterId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await sender.Send(new GetMeterTokenHistoryQuery(meterId, page, pageSize), ct);
        return Ok(result);
    }

    [HttpPost("issue")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecordTokenIssued([FromBody] RecordTokenIssuedCommand command, CancellationToken ct)
    {
        var id = await sender.Send(command, ct);
        return Ok(new { tokenId = id });
    }

    [HttpPost("attempts/fail")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecordAttemptFailed([FromBody] RecordTokenAttemptFailedCommand command, CancellationToken ct)
    {
        await sender.Send(command, ct);
        return NoContent();
    }
}
