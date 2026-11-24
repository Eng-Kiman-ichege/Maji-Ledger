using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.WaterLedger;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/water/reconciliation")]
[Produces("application/json")]
[Authorize]
[RequiresModule(AppModules.WaterLedger)]
public class WaterReconciliationController(ISender sender) : ControllerBase
{
    [HttpGet("summary")]
    [ProducesResponseType(typeof(WaterReconciliationSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(
        [FromQuery] Guid? propertyId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken ct = default)
    {
        var result = await sender.Send(new GetWaterReconciliationSummaryQuery(propertyId, fromDate, toDate), ct);
        return Ok(result);
    }

    [HttpGet("lookup")]
    [ProducesResponseType(typeof(ProviderLookupResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> LookupProviderRef(
        [FromQuery] string reference,
        CancellationToken ct = default)
    {
        var result = await sender.Send(new LookupProviderReferenceQuery(reference), ct);
        return Ok(result);
    }
}
