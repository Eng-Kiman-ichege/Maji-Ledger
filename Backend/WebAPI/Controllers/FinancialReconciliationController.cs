using MajiLedger.Application.Common.Security;
using MajiLedger.Application.Features.FinancialReconciliation;
using MajiLedger.Domain.Enums;
using MajiLedger.WebAPI.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/finance/reconciliation")]
[Produces("application/json")]
[Authorize]
public class FinancialReconciliationController(ISender sender) : ControllerBase
{
    [HttpGet("sessions")]
    [ProducesResponseType(typeof(List<ReconciliationSessionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSessions(
        [FromQuery] ReconciliationLedgerType? ledgerType,
        [FromQuery] Guid? propertyId,
        [FromQuery] ReconciliationStatus? status,
        CancellationToken ct)
    {
        var result = await sender.Send(new GetReconciliationSessionsQuery(ledgerType, propertyId, status), ct);
        return Ok(result);
    }

    [HttpPost("process")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    public async Task<IActionResult> Process([FromBody] ProcessReconciliationRequest req, CancellationToken ct)
    {
        var id = await sender.Send(new ProcessReconciliationCommand(
            req.LedgerType, req.PropertyId, req.PeriodFrom, req.PeriodTo, req.ExternalTransactions, req.Notes), ct);
        return Ok(new { sessionId = id });
    }

    [HttpGet("discrepancies")]
    [ProducesResponseType(typeof(List<DiscrepancyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDiscrepancies(
        [FromQuery] Guid? sessionId,
        [FromQuery] DiscrepancyStatus? status,
        CancellationToken ct)
    {
        var result = await sender.Send(new GetDiscrepanciesQuery(sessionId, status), ct);
        return Ok(result);
    }

    [HttpPost("discrepancies/{id:guid}/resolve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ResolveDiscrepancy(
        Guid id, [FromBody] ResolveDiscrepancyRequest req, CancellationToken ct)
    {
        await sender.Send(new ResolveDiscrepancyCommand(id, req.ResolutionNotes), ct);
        return NoContent();
    }

    [HttpGet("reports/consolidated")]
    [ProducesResponseType(typeof(ConsolidatedFinancialReportDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConsolidatedReport(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        [FromQuery] Guid? propertyId,
        CancellationToken ct)
    {
        var result = await sender.Send(new GetConsolidatedFinancialReportQuery(from, to, propertyId), ct);
        return Ok(result);
    }
}

public record ProcessReconciliationRequest(
    ReconciliationLedgerType LedgerType,
    Guid? PropertyId,
    DateTime PeriodFrom,
    DateTime PeriodTo,
    List<ExternalStatementItem> ExternalTransactions,
    string? Notes = null);

public record ResolveDiscrepancyRequest(string ResolutionNotes);
