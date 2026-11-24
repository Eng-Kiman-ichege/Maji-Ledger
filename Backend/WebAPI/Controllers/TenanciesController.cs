using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.Tenancies;
using MajiLedger.Domain.Enums;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/tenancies")]
[Produces("application/json")]
[Authorize]
[RequiresModule(AppModules.PropertyManagement)]
public class TenanciesController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<TenancySummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? propertyId = null,
        [FromQuery] Guid? unitId = null,
        [FromQuery] TenancyStatus? status = null,
        CancellationToken ct = default)
    {
        var result = await sender.Send(new GetTenanciesQuery(propertyId, unitId, status), ct);
        return Ok(result);
    }

    [HttpGet("active")]
    [ProducesResponseType(typeof(List<TenancySummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActive([FromQuery] Guid? propertyId = null, CancellationToken ct = default)
    {
        var result = await sender.Send(new GetActiveTenanciesQuery(propertyId), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TenancyDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetTenancyByIdQuery(id), ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create([FromBody] CreateTenancyRequest request, CancellationToken ct)
    {
        var id = await sender.Send(new CreateTenancyCommand(
            request.UnitId,
            request.PrimaryTenantId,
            request.MonthlyRent,
            request.SecurityDeposit,
            request.StartDate,
            request.TenancyReference,
            request.ExpectedEndDate,
            request.RentPaymentDueDay,
            request.BillingFrequency,
            request.AgreementNotes,
            User.Identity?.Name), ct);

        return CreatedAtAction(nameof(GetById), new { id }, id);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTenancyRequest request, CancellationToken ct)
    {
        await sender.Send(new UpdateTenancyCommand(
            id,
            request.MonthlyRent,
            request.SecurityDeposit,
            request.RentPaymentDueDay,
            request.BillingFrequency,
            request.ExpectedEndDate,
            request.AgreementNotes,
            User.Identity?.Name), ct);

        return NoContent();
    }

    [HttpPost("{id:guid}/tenants")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AddTenant(Guid id, [FromBody] AddTenantRequest request, CancellationToken ct)
    {
        var assignmentId = await sender.Send(new AddTenantToTenancyCommand(
            id,
            request.TenantId,
            request.IsPrimaryTenant,
            request.JoinedAt,
            User.Identity?.Name), ct);

        return Created(string.Empty, assignmentId);
    }

    [HttpPost("{id:guid}/tenants/{tenantId:guid}/remove")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> RemoveTenant(Guid id, Guid tenantId, [FromBody] RemoveTenantRequest? request, CancellationToken ct)
    {
        await sender.Send(new RemoveTenantFromTenancyCommand(id, tenantId, request?.LeftAt, User.Identity?.Name), ct);
        return NoContent();
    }

    [HttpPut("{id:guid}/primary-tenant/{tenantId:guid}")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangePrimaryTenant(Guid id, Guid tenantId, CancellationToken ct)
    {
        await sender.Send(new ChangePrimaryTenantCommand(id, tenantId, User.Identity?.Name), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/renew")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Renew(Guid id, [FromBody] RenewTenancyRequest request, CancellationToken ct)
    {
        await sender.Send(new RenewTenancyCommand(id, request.NewExpectedEndDate, request.NewRent, request.Notes, User.Identity?.Name), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/terminate")]
    [Authorize(Roles = "Admin,PlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Terminate(Guid id, [FromBody] TerminateTenancyRequest? request, CancellationToken ct)
    {
        await sender.Send(new TerminateTenancyCommand(id, request?.ActualEndDate, request?.Notes, User.Identity?.Name), ct);
        return NoContent();
    }

    // ── Related endpoints ─────────────────────────────────────────────────────

    [HttpGet("/api/v1/properties/{propertyId:guid}/tenancies")]
    [ProducesResponseType(typeof(List<TenancySummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByProperty(Guid propertyId, CancellationToken ct)
    {
        var result = await sender.Send(new GetTenanciesQuery(PropertyId: propertyId), ct);
        return Ok(result);
    }

    [HttpGet("/api/v1/apartments/{apartmentId:guid}/tenancies")]
    [ProducesResponseType(typeof(List<TenancySummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByApartment(Guid apartmentId, CancellationToken ct)
    {
        var result = await sender.Send(new GetTenanciesQuery(UnitId: apartmentId), ct);
        return Ok(result);
    }

    [HttpGet("/api/v1/apartments/{apartmentId:guid}/occupancy-history")]
    [ProducesResponseType(typeof(List<OccupancyHistoryRecordDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOccupancyHistory(Guid apartmentId, CancellationToken ct)
    {
        var result = await sender.Send(new GetApartmentOccupancyHistoryQuery(apartmentId), ct);
        return Ok(result);
    }
}

public record CreateTenancyRequest(
    Guid UnitId,
    Guid PrimaryTenantId,
    decimal MonthlyRent,
    decimal SecurityDeposit,
    DateTime StartDate,
    string? TenancyReference = null,
    DateTime? ExpectedEndDate = null,
    int RentPaymentDueDay = 1,
    BillingFrequency BillingFrequency = BillingFrequency.Monthly,
    string? AgreementNotes = null);

public record UpdateTenancyRequest(
    decimal MonthlyRent,
    decimal SecurityDeposit,
    int RentPaymentDueDay,
    BillingFrequency BillingFrequency,
    DateTime? ExpectedEndDate,
    string? AgreementNotes);

public record AddTenantRequest(
    Guid TenantId,
    bool IsPrimaryTenant = false,
    DateTime? JoinedAt = null);

public record RemoveTenantRequest(
    DateTime? LeftAt = null);

public record RenewTenancyRequest(
    DateTime NewExpectedEndDate,
    decimal? NewRent = null,
    string? Notes = null);

public record TerminateTenancyRequest(
    DateTime? ActualEndDate = null,
    string? Notes = null);
