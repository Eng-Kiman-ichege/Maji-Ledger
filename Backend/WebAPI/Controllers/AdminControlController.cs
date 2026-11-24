using MajiLedger.Application.Features.AdminControl;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/admin/control")]
[Produces("application/json")]
[Authorize(Roles = "Admin")]
public class AdminControlController(ISender sender) : ControllerBase
{
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(AdminExecutiveDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExecutiveDashboard(CancellationToken ct)
    {
        var result = await sender.Send(new GetAdminExecutiveDashboardQuery(), ct);
        return Ok(result);
    }

    [HttpGet("audit-logs")]
    [ProducesResponseType(typeof(List<AuditLogSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
    {
        var result = await sender.Send(new GetAuditLogsQuery(page, pageSize), ct);
        return Ok(result);
    }

    [HttpGet("integrations")]
    [ProducesResponseType(typeof(List<IntegrationStatusDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetIntegrations(CancellationToken ct)
    {
        var result = await sender.Send(new GetIntegrationStatusQuery(), ct);
        return Ok(result);
    }
}

[ApiController]
[Route("api/v1/admin/settings")]
[Produces("application/json")]
[Authorize(Roles = "Admin")]
public class SystemSettingsController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<SystemSettingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettings(CancellationToken ct)
    {
        var result = await sender.Send(new GetSystemSettingsQuery(), ct);
        return Ok(result);
    }

    [HttpPut]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateSetting([FromBody] UpdateSettingRequest req, CancellationToken ct)
    {
        await sender.Send(new UpdateSystemSettingCommand(req.Key, req.Value), ct);
        return NoContent();
    }
}

public record UpdateSettingRequest(string Key, string Value);
