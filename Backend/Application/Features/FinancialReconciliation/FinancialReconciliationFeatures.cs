using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.FinancialReconciliation;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record ReconciliationSessionDto(
    Guid Id,
    ReconciliationLedgerType LedgerType,
    Guid? PropertyId,
    string? PropertyName,
    DateTime PeriodFrom,
    DateTime PeriodTo,
    ReconciliationStatus Status,
    decimal TotalInternalAmount,
    decimal TotalExternalAmount,
    decimal DiscrepancyAmount,
    int MatchedCount,
    int UnmatchedCount,
    string ReconciledBy,
    DateTime? ReconciledAt,
    string? Notes,
    DateTime CreatedAt);

public record DiscrepancyDto(
    Guid Id,
    Guid SessionId,
    string TransactionReference,
    decimal InternalAmount,
    decimal ExternalAmount,
    string DiscrepancyReason,
    DiscrepancyStatus Status,
    string? ResolutionNotes,
    string? ResolvedBy,
    DateTime? ResolvedAt,
    DateTime CreatedAt);

public record ExternalStatementItem(
    string Reference,
    decimal Amount,
    DateTime Date,
    string? Channel);

public record ConsolidatedFinancialReportDto(
    DateTime From,
    DateTime To,
    decimal TotalRentBilled,
    decimal TotalRentCollected,
    decimal TotalRentOutstanding,
    decimal TotalWaterRevenue,
    decimal TotalUnitsVended,
    decimal TotalMaintenanceExpense,
    decimal NetOperatingIncome,
    int TotalConfirmedPayments,
    int TotalFailedPayments);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetReconciliationSessionsQuery(
    ReconciliationLedgerType? LedgerType = null,
    Guid? PropertyId = null,
    ReconciliationStatus? Status = null) : IRequest<List<ReconciliationSessionDto>>;

public class GetReconciliationSessionsHandler : IRequestHandler<GetReconciliationSessionsQuery, List<ReconciliationSessionDto>>
{
    private readonly IApplicationDbContext _db;

    public GetReconciliationSessionsHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<ReconciliationSessionDto>> Handle(GetReconciliationSessionsQuery req, CancellationToken ct)
    {
        var query = _db.ReconciliationSessions
            .Include(s => s.Property)
            .AsQueryable();

        if (req.LedgerType.HasValue)
            query = query.Where(s => s.LedgerType == req.LedgerType.Value);

        if (req.PropertyId.HasValue)
            query = query.Where(s => s.PropertyId == req.PropertyId.Value);

        if (req.Status.HasValue)
            query = query.Where(s => s.Status == req.Status.Value);

        return await query
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new ReconciliationSessionDto(
                s.Id,
                s.LedgerType,
                s.PropertyId,
                s.Property != null ? s.Property.Name : "Consolidated Portfolio",
                s.PeriodFrom,
                s.PeriodTo,
                s.Status,
                s.TotalInternalAmount,
                s.TotalExternalAmount,
                s.DiscrepancyAmount,
                s.MatchedCount,
                s.UnmatchedCount,
                s.ReconciledBy,
                s.ReconciledAt,
                s.Notes,
                s.CreatedAt))
            .ToListAsync(ct);
    }
}

public record GetDiscrepanciesQuery(Guid? SessionId = null, DiscrepancyStatus? Status = null) : IRequest<List<DiscrepancyDto>>;

public class GetDiscrepanciesHandler : IRequestHandler<GetDiscrepanciesQuery, List<DiscrepancyDto>>
{
    private readonly IApplicationDbContext _db;

    public GetDiscrepanciesHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<DiscrepancyDto>> Handle(GetDiscrepanciesQuery req, CancellationToken ct)
    {
        var query = _db.ReconciliationDiscrepancies.AsQueryable();

        if (req.SessionId.HasValue)
            query = query.Where(d => d.SessionId == req.SessionId.Value);

        if (req.Status.HasValue)
            query = query.Where(d => d.Status == req.Status.Value);

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new DiscrepancyDto(
                d.Id, d.SessionId, d.TransactionReference,
                d.InternalAmount, d.ExternalAmount,
                d.DiscrepancyReason, d.Status,
                d.ResolutionNotes, d.ResolvedBy,
                d.ResolvedAt, d.CreatedAt))
            .ToListAsync(ct);
    }
}

public record GetConsolidatedFinancialReportQuery(DateTime From, DateTime To, Guid? PropertyId = null)
    : IRequest<ConsolidatedFinancialReportDto>;

public class GetConsolidatedFinancialReportHandler : IRequestHandler<GetConsolidatedFinancialReportQuery, ConsolidatedFinancialReportDto>
{
    private readonly IApplicationDbContext _db;

    public GetConsolidatedFinancialReportHandler(IApplicationDbContext db) => _db = db;

    public async Task<ConsolidatedFinancialReportDto> Handle(GetConsolidatedFinancialReportQuery req, CancellationToken ct)
    {
        // Rent queries
        var rentChargesQuery = _db.RentCharges.Where(c => c.BillingDate >= req.From && c.BillingDate <= req.To);
        if (req.PropertyId.HasValue)
            rentChargesQuery = rentChargesQuery.Where(c => c.PropertyId == req.PropertyId.Value);

        var rentCharges = await rentChargesQuery.ToListAsync(ct);
        var totalRentBilled = rentCharges.Sum(c => c.Amount);
        var totalRentCollected = rentCharges.Sum(c => c.AmountPaid);
        var totalRentOutstanding = rentCharges.Sum(c => Math.Max(0m, c.Amount - c.AmountPaid));

        // Rent payments counts
        var rentPaymentsQuery = _db.RentPayments.Where(p => p.PaymentDate >= req.From && p.PaymentDate <= req.To);
        var confirmedRentPayments = await rentPaymentsQuery.CountAsync(p => p.PaymentStatus == RentPaymentStatus.Confirmed, ct);
        var failedRentPayments = await rentPaymentsQuery.CountAsync(p => p.PaymentStatus == RentPaymentStatus.Failed, ct);

        // Water transactions
        var waterTxQuery = _db.WaterTransactions.Where(w => w.TransactionDate >= req.From && w.TransactionDate <= req.To);
        if (req.PropertyId.HasValue)
            waterTxQuery = waterTxQuery.Where(w => w.PropertyId == req.PropertyId.Value);

        var waterTransactions = await waterTxQuery.ToListAsync(ct);
        var totalWaterRevenue = waterTransactions.Sum(w => w.Amount);
        var totalUnitsVended = waterTransactions.Sum(w => w.UnitsPurchased);

        // Maintenance expenses
        var maintQuery = _db.MaintenanceRequests
            .Where(m => m.Status == MaintenanceStatus.Completed && m.CompletedAt >= req.From && m.CompletedAt <= req.To);
        if (req.PropertyId.HasValue)
            maintQuery = maintQuery.Where(m => m.PropertyId == req.PropertyId.Value);

        var totalMaintenanceExpense = await maintQuery.SumAsync(m => m.ActualCost ?? 0m, ct);

        var netOperatingIncome = totalRentCollected + totalWaterRevenue - totalMaintenanceExpense;

        return new ConsolidatedFinancialReportDto(
            req.From, req.To,
            totalRentBilled, totalRentCollected, totalRentOutstanding,
            totalWaterRevenue, totalUnitsVended,
            totalMaintenanceExpense, netOperatingIncome,
            confirmedRentPayments + waterTransactions.Count,
            failedRentPayments);
    }
}

// ── Commands ──────────────────────────────────────────────────────────────────

public record ProcessReconciliationCommand(
    ReconciliationLedgerType LedgerType,
    Guid? PropertyId,
    DateTime PeriodFrom,
    DateTime PeriodTo,
    List<ExternalStatementItem> ExternalTransactions,
    string? Notes = null) : IRequest<Guid>;

public class ProcessReconciliationHandler : IRequestHandler<ProcessReconciliationCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ProcessReconciliationHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(ProcessReconciliationCommand cmd, CancellationToken ct)
    {
        var session = ReconciliationSession.Create(
            cmd.LedgerType, cmd.PropertyId, cmd.PeriodFrom, cmd.PeriodTo,
            _currentUser.UserId ?? "System", cmd.Notes);

        _db.ReconciliationSessions.Add(session);
        await _db.SaveChangesAsync(ct);

        // Fetch internal confirmed payments
        var internalRefs = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

        if (cmd.LedgerType == ReconciliationLedgerType.Rent || cmd.LedgerType == ReconciliationLedgerType.Consolidated)
        {
            var rentPayments = await _db.RentPayments
                .Where(rp => rp.PaymentDate >= cmd.PeriodFrom && rp.PaymentDate <= cmd.PeriodTo && rp.PaymentStatus == RentPaymentStatus.Confirmed)
                .ToListAsync(ct);

            foreach (var rp in rentPayments)
            {
                internalRefs[rp.PaymentReference] = rp.Amount;
            }
        }

        if (cmd.LedgerType == ReconciliationLedgerType.Water || cmd.LedgerType == ReconciliationLedgerType.Consolidated)
        {
            var waterTxs = await _db.WaterTransactions
                .Where(wt => wt.TransactionDate >= cmd.PeriodFrom && wt.TransactionDate <= cmd.PeriodTo)
                .ToListAsync(ct);

            foreach (var wt in waterTxs)
            {
                var refCode = !string.IsNullOrWhiteSpace(wt.ExternalTransactionReference)
                    ? wt.ExternalTransactionReference
                    : wt.TransactionReference;
                internalRefs[refCode] = wt.Amount;
            }
        }

        int matched = 0;
        int unmatched = 0;
        decimal externalTotal = 0;

        foreach (var ext in cmd.ExternalTransactions)
        {
            externalTotal += ext.Amount;

            if (internalRefs.TryGetValue(ext.Reference, out var intAmt))
            {
                if (intAmt == ext.Amount)
                {
                    matched++;
                }
                else
                {
                    unmatched++;
                    var disc = ReconciliationDiscrepancy.Create(
                        session.Id, ext.Reference, intAmt, ext.Amount,
                        $"Amount mismatch: Internal={intAmt:N2}, External={ext.Amount:N2}");
                    _db.ReconciliationDiscrepancies.Add(disc);
                }
            }
            else
            {
                unmatched++;
                var disc = ReconciliationDiscrepancy.Create(
                    session.Id, ext.Reference, 0m, ext.Amount,
                    "External transaction not found in internal ledger records.");
                _db.ReconciliationDiscrepancies.Add(disc);
            }
        }

        var internalTotal = internalRefs.Values.Sum();
        session.UpdateTotals(internalTotal, externalTotal, matched, unmatched);
        await _db.SaveChangesAsync(ct);

        return session.Id;
    }
}

public record ResolveDiscrepancyCommand(Guid DiscrepancyId, string ResolutionNotes) : IRequest;

public class ResolveDiscrepancyHandler : IRequestHandler<ResolveDiscrepancyCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ResolveDiscrepancyHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(ResolveDiscrepancyCommand cmd, CancellationToken ct)
    {
        var disc = await _db.ReconciliationDiscrepancies.FirstOrDefaultAsync(d => d.Id == cmd.DiscrepancyId, ct)
            ?? throw new NotFoundException(nameof(ReconciliationDiscrepancy), cmd.DiscrepancyId);

        disc.Resolve(cmd.ResolutionNotes, _currentUser.UserId ?? "System");
        await _db.SaveChangesAsync(ct);
    }
}
