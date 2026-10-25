using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Append-only, immutable event log covering every significant state change
/// across the transaction domain. Never updated or deleted.
/// No FK constraint — polymorphic entity reference by EntityId + EntityType.
/// </summary>
public class TransactionAuditLog : BaseEntity
{
    public Guid EntityId { get; private set; }
    public string EntityType { get; private set; } = default!;
    public string EventType { get; private set; } = default!;
    public string? OldValue { get; private set; }   // JSON snapshot
    public string? NewValue { get; private set; }   // JSON snapshot
    public string PerformedBy { get; private set; } = default!;
    public string? IpAddress { get; private set; }
    public DateTime OccurredAt { get; private set; }

    private TransactionAuditLog() { }

    public static TransactionAuditLog Write(
        Guid entityId,
        string entityType,
        string eventType,
        string performedBy,
        string? oldValue = null,
        string? newValue = null,
        string? ipAddress = null)
    {
        return new TransactionAuditLog
        {
            EntityId = entityId,
            EntityType = entityType,
            EventType = eventType,
            PerformedBy = performedBy,
            OldValue = oldValue,
            NewValue = newValue,
            IpAddress = ipAddress,
            OccurredAt = DateTime.UtcNow
        };
    }
}
