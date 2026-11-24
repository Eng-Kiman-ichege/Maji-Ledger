using MajiLedger.Application.Features.Analytics;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/analytics")]
[Produces("application/json")]
[Authorize]
public class AnalyticsController(ISender sender) : ControllerBase
{
    [HttpGet("overview")]
    [ProducesResponseType(typeof(AnalyticsOverviewDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOverview(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] Guid? propertyId,
        CancellationToken ct)
    {
        var result = await sender.Send(new GetAnalyticsOverviewQuery(from, to, propertyId), ct);
        return Ok(result);
    }
}
