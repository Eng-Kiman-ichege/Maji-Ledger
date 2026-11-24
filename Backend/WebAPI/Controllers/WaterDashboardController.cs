using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.WaterLedger;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/water/dashboard")]
[Produces("application/json")]
[Authorize]
[RequiresModule(AppModules.WaterLedger)]
public class WaterDashboardController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(WaterDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard([FromQuery] Guid? propertyId = null, CancellationToken ct = default)
    {
        var result = await sender.Send(new GetWaterDashboardQuery(propertyId), ct);
        return Ok(result);
    }
}
