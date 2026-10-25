using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// The 20-digit STS token record. Created after a successful STS API call.
/// One-to-one with a <see cref="WaterPurchase"/>.
/// </summary>
public class WaterToken : BaseEntity
{
    public Guid WaterPurchaseId { get; private set; }
    public string StsToken { get; private set; } = default!;
    public string? StsRequestRef { get; private set; }
    public WaterTokenStatus Status { get; private set; } = WaterTokenStatus.Issued;
    public DateTime IssuedAt { get; private set; }

    // Navigation
    public WaterPurchase WaterPurchase { get; private set; } = default!;
    public ICollection<SmsDeliveryRecord> SmsDeliveries { get; private set; } = [];

    private WaterToken() { }

    public static WaterToken Issue(Guid waterPurchaseId, string stsToken, string? stsRequestRef = null)
    {
        if (string.IsNullOrWhiteSpace(stsToken))
            throw new ArgumentException("STS token cannot be empty.", nameof(stsToken));

        return new WaterToken
        {
            WaterPurchaseId = waterPurchaseId,
            StsToken = stsToken,
            StsRequestRef = stsRequestRef,
            IssuedAt = DateTime.UtcNow
        };
    }

    public void MarkDelivered() { Status = WaterTokenStatus.Delivered; }
    public void MarkDeliveryFailed() { Status = WaterTokenStatus.DeliveryFailed; }
    public void Revoke() { Status = WaterTokenStatus.Revoked; }
}
