using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.TenantPortal;
using MajiLedger.Application.Features.RentLedger;
using MajiLedger.Application.Features.LandlordPortal;
using MajiLedger.Domain.Enums;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/tenant-portal")]
[Produces("application/json")]
[Authorize]
public class TenantPortalController(ISender sender) : ControllerBase
{
    /// <summary>Gets the unified tenant dashboard.</summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(TenantPortalDashboardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetDashboard(CancellationToken ct)
    {
        var result = await sender.Send(new GetTenantPortalDashboardQuery(), ct);
        return Ok(result);
    }

    /// <summary>Gets tenant profile details.</summary>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(TenantProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var result = await sender.Send(new GetTenantProfileQuery(), ct);
        return Ok(result);
    }

    /// <summary>Updates permitted contact fields in tenant profile.</summary>
    [HttpPut("profile")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateTenantProfileRequest request, CancellationToken ct)
    {
        await sender.Send(new UpdateTenantProfileCommand(
            request.PhoneNumber, request.AlternativePhoneNumber, request.Email, request.Address), ct);
        return NoContent();
    }
}

public record UpdateTenantProfileRequest(
    string PhoneNumber,
    string? AlternativePhoneNumber,
    string? Email,
    string? Address);
