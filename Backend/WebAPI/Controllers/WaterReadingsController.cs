using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.WaterLedger;
using MajiLedger.Domain.Enums;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/water/readings")]
[Produces("application/json")]
[Authorize]
[RequiresModule(AppModules.WaterLedger)]
public class WaterReadingsController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<WaterReadingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? propertyId = null,
        [FromQuery] Guid? waterMeterId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken ct = default)
    {
        var result = await sender.Send(new GetWaterReadingsQuery(propertyId, waterMeterId, fromDate, toDate), ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,PlatformAdmin,Manager,Staff")]
    [ProducesResponseType(typeof(WaterReadingDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> RecordReading(
        [FromBody] RecordWaterReadingCommand command,
        CancellationToken ct)
    {
        var result = await sender.Send(command, ct);
        return CreatedAtAction(nameof(GetAll), new { waterMeterId = result.WaterMeterId }, result);
    }
}
