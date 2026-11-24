using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// A financial reconciliation session covering Rent, Water, or Consolidated transactions for a property and period.
/// </summary>
public class ReconciliationSession : BaseEntity
{
    public ReconciliationLedgerType LedgerType { get; private set; }
    public Guid? PropertyId { get; private set; }
    public DateTime PeriodFrom { get; private set; }
    public DateTime PeriodTo { get; private set; }
    public ReconciliationStatus Status { get; private set; }

    public decimal TotalInternalAmount { get; private set; }
    public decimal TotalExternalAmount { get; private set; }
    public decimal DiscrepancyAmount { get; private set; }
    public int MatchedCount { get; private set; }
    public int UnmatchedCount { get; private set; }

    public string ReconciledBy { get; private set; } = string.Empty;
    public DateTime? ReconciledAt { get; private set; }
    public string? Notes { get; private set; }

    // Navigation
    public Property? Property { get; private set; }
    public ICollection<ReconciliationDiscrepancy> Discrepancies { get; private set; } = new List<ReconciliationDiscrepancy>();

    private ReconciliationSession() { }

    public static ReconciliationSession Create(
        ReconciliationLedgerType ledgerType,
        Guid? propertyId,
        DateTime periodFrom,
        DateTime periodTo,
        string reconciledBy,
        string? notes = null)
    {
        return new ReconciliationSession
        {
            LedgerType = ledgerType,
            PropertyId = propertyId,
            PeriodFrom = periodFrom,
            PeriodTo = periodTo,
            Status = ReconciliationStatus.Draft,
            ReconciledBy = reconciledBy,
            Notes = notes
        };
    }

    public void UpdateTotals(decimal internalTotal, decimal externalTotal, int matched, int unmatched)
    {
        TotalInternalAmount = internalTotal;
        TotalExternalAmount = externalTotal;
        DiscrepancyAmount = Math.Abs(internalTotal - externalTotal);
        MatchedCount = matched;
        UnmatchedCount = unmatched;

        Status = DiscrepancyAmount == 0 && unmatched == 0
            ? ReconciliationStatus.Reconciled
            : ReconciliationStatus.DiscrepanciesFlagged;

        if (Status == ReconciliationStatus.Reconciled)
        {
            ReconciledAt = DateTime.UtcNow;
        }

        MarkUpdated();
    }

    public void Close(string? closingNotes = null)
    {
        Status = ReconciliationStatus.Closed;
        if (!string.IsNullOrWhiteSpace(closingNotes))
        {
            Notes = string.IsNullOrWhiteSpace(Notes) ? closingNotes : $"{Notes}\n{closingNotes}";
        }
        MarkUpdated();
    }
}
