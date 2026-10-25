using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// One row per SMS send attempt for a water token delivery.
/// Multiple rows if the gateway is retried after a failure.
/// </summary>
public class SmsDeliveryRecord : BaseEntity
{
    public Guid WaterTokenId { get; private set; }
    public string RecipientPhone { get; private set; } = default!;
    public string MessageBody { get; private set; } = default!;
    public string? GatewayRef { get; private set; }
    public SmsDeliveryStatus Status { get; private set; } = SmsDeliveryStatus.Queued;
    public DateTime SentAt { get; private set; }
    public DateTime? DeliveredAt { get; private set; }

    // Navigation
    public WaterToken WaterToken { get; private set; } = default!;

    private SmsDeliveryRecord() { }

    public static SmsDeliveryRecord Queue(
        Guid waterTokenId,
        string recipientPhone,
        string messageBody)
    {
        return new SmsDeliveryRecord
        {
            WaterTokenId = waterTokenId,
            RecipientPhone = recipientPhone,
            MessageBody = messageBody,
            SentAt = DateTime.UtcNow
        };
    }

    public void MarkSent(string gatewayRef)
    {
        Status = SmsDeliveryStatus.Sent;
        GatewayRef = gatewayRef;
    }

    public void MarkDelivered()
    {
        Status = SmsDeliveryStatus.Delivered;
        DeliveredAt = DateTime.UtcNow;
    }

    public void MarkFailed() => Status = SmsDeliveryStatus.Failed;
}
