using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Records a water token purchase transaction end-to-end:
/// payment → tariff calculation → STS token → SMS delivery.
/// </summary>
public class WaterTransaction : BaseEntity
{
    public Guid MeterId { get; private set; }
    public PaymentChannel Channel { get; private set; }
    public string CustomerPhone { get; private set; } = default!;
    public decimal AmountPaid { get; private set; }
    public decimal UnitsCalculated { get; private set; }
    public string? StsToken { get; private set; }             // token received from STS platform
    public string? PaymentProviderRef { get; private set; }   // M-Pesa receipt number, etc.
    public PaymentStatus PaymentStatus { get; private set; } = PaymentStatus.Pending;
    public TokenStatus TokenStatus { get; private set; } = TokenStatus.Issued;
    public string? FailureReason { get; private set; }
    public DateTime? PaidAt { get; private set; }

    // Navigation
    public Meter Meter { get; private set; } = default!;

    private WaterTransaction() { }

    public static WaterTransaction Initiate(Guid meterId, PaymentChannel channel, string customerPhone, decimal amountPaid)
    {
        return new WaterTransaction
        {
            MeterId = meterId,
            Channel = channel,
            CustomerPhone = customerPhone,
            AmountPaid = amountPaid
        };
    }

    public void ConfirmPayment(string providerRef)
    {
        PaymentStatus = PaymentStatus.Confirmed;
        PaymentProviderRef = providerRef;
        PaidAt = DateTime.UtcNow;
    }

    public void RecordToken(string stsToken, decimal units)
    {
        StsToken = stsToken;
        UnitsCalculated = units;
        TokenStatus = TokenStatus.Delivered;
    }

    public void Fail(string reason)
    {
        PaymentStatus = PaymentStatus.Failed;
        FailureReason = reason;
    }
}
