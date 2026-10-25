using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// A confirmed, successful payment. One-to-one with a <see cref="PaymentAttempt"/>.
/// Created only when the provider callback confirms receipt.
/// ProviderRef uniqueness prevents duplicate callbacks generating duplicate payment records.
/// </summary>
public class Payment : BaseEntity
{
    public Guid PaymentAttemptId { get; private set; }

    /// <summary>Provider receipt number (M-Pesa receipt, Airtel TxnID). Globally unique.</summary>
    public string ProviderRef { get; private set; } = default!;

    public decimal AmountConfirmed { get; private set; }
    public string Currency { get; private set; } = "KES";
    public DateTime PaidAt { get; private set; }

    // Navigation
    public PaymentAttempt PaymentAttempt { get; private set; } = default!;
    public WaterPurchase? WaterPurchase { get; private set; }

    private Payment() { }

    public static Payment Confirm(
        Guid paymentAttemptId,
        string providerRef,
        decimal amountConfirmed,
        DateTime paidAt,
        string currency = "KES")
    {
        return new Payment
        {
            PaymentAttemptId = paymentAttemptId,
            ProviderRef = providerRef,
            AmountConfirmed = amountConfirmed,
            Currency = currency,
            PaidAt = paidAt
        };
    }
}
