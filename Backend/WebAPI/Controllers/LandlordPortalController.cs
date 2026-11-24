using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.LandlordPortal;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/landlord-portal")]
[Produces("application/json")]
[Authorize]
[RequiresModule(AppModules.PropertyManagement)]
public class LandlordPortalController(ISender sender) : ControllerBase
{
    /// <summary>Landlord portal dashboard — unified KPIs for all authorized properties.</summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(LandlordPortalDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard(
        [FromQuery] Guid? propertyId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct)
    {
        var result = await sender.Send(new GetLandlordPortalDashboardQuery(propertyId, from, to), ct);
        return Ok(result);
    }

    /// <summary>Lists all properties accessible to the authenticated landlord.</summary>
    [HttpGet("properties")]
    [ProducesResponseType(typeof(List<LandlordPortalPropertyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProperties(CancellationToken ct)
    {
        var result = await sender.Send(new GetLandlordPortalPropertyListQuery(), ct);
        return Ok(result);
    }

    /// <summary>Full detail for a single property.</summary>
    [HttpGet("properties/{id:guid}")]
    [ProducesResponseType(typeof(LandlordPortalPropertyDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPropertyDetail(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetLandlordPortalPropertyDetailQuery(id), ct);
        return Ok(result);
    }

    /// <summary>Landlord financial statement for a date range.</summary>
    [HttpGet("statement")]
    [ProducesResponseType(typeof(LandlordStatementDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatement(
        [FromQuery] Guid? propertyId,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        CancellationToken ct)
    {
        var result = await sender.Send(new GetLandlordStatementQuery(propertyId, from, to), ct);
        return Ok(result);
    }
}
