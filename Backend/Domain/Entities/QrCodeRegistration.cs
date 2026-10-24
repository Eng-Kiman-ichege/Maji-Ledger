using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// A QR-code registration that links a meter to an approved payment configuration
/// and a publicly-accessible Scan-to-Pay URL.
/// The QR code does NOT contain payment credentials.
/// </summary>
public class QrCodeRegistration : AuditableEntity
{
    public Guid MeterId { get; private set; }
    public string QrToken { get; private set; } = default!;  // random, opaque token embedded in the URL
    public bool IsActive { get; private set; } = true;
    public string? PaymentReference { get; private set; }     // e.g., Paybill account number, set by admin

    // Navigation
    public Meter Meter { get; private set; } = default!;

    private QrCodeRegistration() { }

    public static QrCodeRegistration Create(Guid meterId, string? paymentReference = null, string? createdBy = null)
    {
        return new QrCodeRegistration
        {
            MeterId = meterId,
            QrToken = Guid.NewGuid().ToString("N"),
            PaymentReference = paymentReference,
            CreatedBy = createdBy
        };
    }

    public void Deactivate() { IsActive = false; MarkUpdated(); }
}
