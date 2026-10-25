using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// One row per payment initiation — including failed, expired, and reversed attempts.
/// A <see cref="Payment"/> is only created when this attempt reaches Confirmed status.
/// </summary>
public class PaymentAttempt : BaseEntity
{
    public Guid MeterId { get; private set; }

    /// <summary>Null for Paybill/USSD initiated payments (no QR scan).</summary>
    public Guid? QrCodeRegistrationId { get; private set; }

    public Guid PaymentProviderConfigId { get; private set; }
    public PaymentChannel Channel { get; private set; }
    public string CustomerPhone { get; private set; } = default!;
    public decimal RequestedAmount { get; private set; }

    /// <summary>Provider's request tracking ID (e.g. M-Pesa CheckoutRequestID). Used to match callbacks.</summary>
    public string? ProviderCheckoutId { get; private set; }

    public PaymentAttemptStatus Status { get; private set; } = PaymentAttemptStatus.Initiated;
    public string? FailureReason { get; private set; }
    public DateTime InitiatedAt { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    // Navigation
    public Meter Meter { get; private set; } = default!;
    public QrCodeRegistration? QrCodeRegistration { get; private set; }
    public PaymentProviderConfig PaymentProviderConfig { get; private set; } = default!;
    public Payment? Payment { get; private set; }

    private PaymentAttempt() { }

    public static PaymentAttempt Initiate(
        Guid meterId,
        Guid paymentProviderConfigId,
        PaymentChannel channel,
        string customerPhone,
        decimal requestedAmount,
        Guid? qrCodeRegistrationId = null,
        TimeSpan? expiryWindow = null)
    {
        return new PaymentAttempt
        {
            MeterId = meterId,
            QrCodeRegistrationId = qrCodeRegistrationId,
            PaymentProviderConfigId = paymentProviderConfigId,
            Channel = channel,
            CustomerPhone = customerPhone,
            RequestedAmount = requestedAmount,
            InitiatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.Add(expiryWindow ?? TimeSpan.FromMinutes(5))
        };
    }

    public void SetProviderCheckoutId(string providerCheckoutId) => ProviderCheckoutId = providerCheckoutId;

    public void Confirm()
    {
        Status = PaymentAttemptStatus.Confirmed;
        CompletedAt = DateTime.UtcNow;
    }

    public void Fail(string reason)
    {
        Status = PaymentAttemptStatus.Failed;
        FailureReason = reason;
        CompletedAt = DateTime.UtcNow;
    }

    public void Expire()
    {
        Status = PaymentAttemptStatus.Expired;
        CompletedAt = DateTime.UtcNow;
    }

    public void Reverse()
    {
        Status = PaymentAttemptStatus.Reversed;
        CompletedAt = DateTime.UtcNow;
    }

    public bool IsTerminal => Status is
        PaymentAttemptStatus.Confirmed or
        PaymentAttemptStatus.Failed or
        PaymentAttemptStatus.Expired or
        PaymentAttemptStatus.Reversed;
}
