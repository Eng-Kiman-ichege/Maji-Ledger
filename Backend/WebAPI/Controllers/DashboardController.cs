using MajiLedger.Application.Features.Dashboard;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
[Produces("application/json")]
public class DashboardController(ISender sender) : ControllerBase
{
    /// <summary>
    /// Portfolio-level administrator dashboard metrics, collections, token sales, and property summaries.
    /// </summary>
    [HttpGet("admin")]
    [ProducesResponseType(typeof(AdminDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAdminDashboard(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken ct = default)
    {
        var result = await sender.Send(new GetAdminDashboardQuery(from, to), ct);
        return Ok(result);
    }

    /// <summary>
    /// Property owner dashboard scoped strictly to authorized properties.
    /// </summary>
    [HttpGet("owner/{ownerId:guid}")]
    [ProducesResponseType(typeof(OwnerDashboardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOwnerDashboard(
        Guid ownerId,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken ct = default)
    {
        var result = await sender.Send(new GetOwnerDashboardQuery(ownerId, from, to), ct);
        return Ok(result);
    }

    /// <summary>
    /// Portfolio-wide QR code traceability and analytics with filtering.
    /// </summary>
    [HttpGet("analytics/qr")]
    [ProducesResponseType(typeof(QrAnalyticsResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetQrAnalytics(
        [FromQuery] Guid? propertyId = null,
        [FromQuery] Guid? buildingId = null,
        [FromQuery] Guid? apartmentId = null,
        [FromQuery] Guid? meterId = null,
        [FromQuery] Guid? qrRegistrationId = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] string? providerShortCode = null,
        [FromQuery] PaymentAttemptStatus? status = null,
        [FromQuery] QrCodeStatus? qrStatus = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var query = new GetQrAnalyticsQuery(
            PropertyId: propertyId,
            BuildingId: buildingId,
            ApartmentId: apartmentId,
            MeterId: meterId,
            QrRegistrationId: qrRegistrationId,
            From: from,
            To: to,
            PaymentProviderShortCode: providerShortCode,
            Status: status,
            QrStatus: qrStatus,
            Page: page,
            PageSize: pageSize);

        var result = await sender.Send(query, ct);
        return Ok(result);
    }

    /// <summary>
    /// QR analytics scoped to an owner's authorized properties with strict ownership isolation.
    /// </summary>
    [HttpGet("analytics/qr/owner/{ownerId:guid}")]
    [ProducesResponseType(typeof(QrAnalyticsResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOwnerQrAnalytics(
        Guid ownerId,
        [FromQuery] Guid? propertyId = null,
        [FromQuery] Guid? meterId = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] QrCodeStatus? qrStatus = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var query = new GetOwnerQrAnalyticsQuery(
            OwnerId: ownerId,
            PropertyId: propertyId,
            MeterId: meterId,
            From: from,
            To: to,
            QrStatus: qrStatus,
            Page: page,
            PageSize: pageSize);

        var result = await sender.Send(query, ct);
        return Ok(result);
    }
}
