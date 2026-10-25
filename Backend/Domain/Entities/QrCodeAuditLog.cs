using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Immutable audit trail for every QR code status change.
/// Never updated or deleted.
/// </summary>
public class QrCodeAuditLog : BaseEntity
{
    public Guid QrCodeRegistrationId { get; private set; }
    public QrCodeAuditEvent EventType { get; private set; }
    public string PerformedBy { get; private set; } = default!;
    public string? Notes { get; private set; }
    public DateTime OccurredAt { get; private set; }

    // Navigation
    public QrCodeRegistration QrCodeRegistration { get; private set; } = default!;

    private QrCodeAuditLog() { }

    public static QrCodeAuditLog Record(
        Guid qrCodeRegistrationId,
        QrCodeAuditEvent eventType,
        string performedBy,
        string? notes = null)
    {
        return new QrCodeAuditLog
        {
            QrCodeRegistrationId = qrCodeRegistrationId,
            EventType = eventType,
            PerformedBy = performedBy,
            Notes = notes,
            OccurredAt = DateTime.UtcNow
        };
    }
}
