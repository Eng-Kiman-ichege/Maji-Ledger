using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// An itemized discrepancy flagged during financial reconciliation.
/// </summary>
public class ReconciliationDiscrepancy : BaseEntity
{
    public Guid SessionId { get; private set; }
    public string TransactionReference { get; private set; } = string.Empty;
    public decimal InternalAmount { get; private set; }
    public decimal ExternalAmount { get; private set; }
    public string DiscrepancyReason { get; private set; } = string.Empty;
    public DiscrepancyStatus Status { get; private set; }
    public string? ResolutionNotes { get; private set; }
    public string? ResolvedBy { get; private set; }
    public DateTime? ResolvedAt { get; private set; }

    // Navigation
    public ReconciliationSession Session { get; private set; } = null!;

    private ReconciliationDiscrepancy() { }

    public static ReconciliationDiscrepancy Create(
        Guid sessionId,
        string transactionReference,
        decimal internalAmount,
        decimal externalAmount,
        string discrepancyReason)
    {
        return new ReconciliationDiscrepancy
        {
            SessionId = sessionId,
            TransactionReference = transactionReference.Trim(),
            InternalAmount = internalAmount,
            ExternalAmount = externalAmount,
            DiscrepancyReason = discrepancyReason.Trim(),
            Status = DiscrepancyStatus.Pending
        };
    }

    public void Resolve(string resolutionNotes, string resolvedBy)
    {
        Status = DiscrepancyStatus.Resolved;
        ResolutionNotes = resolutionNotes.Trim();
        ResolvedBy = resolvedBy.Trim();
        ResolvedAt = DateTime.UtcNow;
        MarkUpdated();
    }

    public void Ignore(string reason, string resolvedBy)
    {
        Status = DiscrepancyStatus.Ignored;
        ResolutionNotes = reason.Trim();
        ResolvedBy = resolvedBy.Trim();
        ResolvedAt = DateTime.UtcNow;
        MarkUpdated();
    }
}
