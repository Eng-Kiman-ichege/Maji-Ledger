using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.RentLedger;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/rent")]
[Produces("application/json")]
[Authorize]
[RequiresModule(AppModules.PropertyManagement)]
public class RentReportsController(ISender sender) : ControllerBase
{
    /// <summary>Returns the rent management dashboard KPIs.</summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(RentDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Dashboard(
        [FromQuery] Guid? propertyId = null, CancellationToken ct = default)
    {
        var result = await sender.Send(new GetRentDashboardQuery(propertyId), ct);
        return Ok(result);
    }

    /// <summary>Returns the full arrears aging report.</summary>
    [HttpGet("reports/arrears")]
    [ProducesResponseType(typeof(ArrearsReportDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Arrears(
        [FromQuery] Guid? propertyId = null,
        [FromQuery] DateTime? asOf = null,
        CancellationToken ct = default)
    {
        var result = await sender.Send(new GetArrearsReportQuery(propertyId, asOf), ct);
        return Ok(result);
    }

    /// <summary>Returns the financial statement for a specific tenancy.</summary>
    [HttpGet("statements/{tenancyId:guid}")]
    [ProducesResponseType(typeof(TenantStatementDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Statement(
        Guid tenancyId,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken ct = default)
    {
        var result = await sender.Send(new GetTenantStatementQuery(tenancyId, fromDate, toDate), ct);
        return Ok(result);
    }
}
