using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Authoritative financial transaction record for the Water Ledger.
/// Strictly separated from Rent Ledger transactions.
/// </summary>
public class WaterTransaction : BaseEntity
{
    public string TransactionReference { get; private set; } = default!;
    public Guid PropertyId { get; private set; }
    public Guid UnitId { get; private set; }
    public Guid WaterMeterId { get; private set; }
    public Guid? TenantId { get; private set; }
    public decimal Amount { get; private set; }
    public decimal UnitsPurchased { get; private set; }
    public decimal UnitPrice { get; private set; }
    public WaterPaymentMethod PaymentMethod { get; private set; }
    public string? ExternalTransactionReference { get; private set; } // e.g. M-Pesa Receipt Code
    public string PhoneNumber { get; private set; } = default!;
    public DateTime TransactionDate { get; private set; }
    public WaterTransactionPaymentStatus PaymentStatus { get; private set; } = WaterTransactionPaymentStatus.Pending;
    public WaterTransactionTokenStatus TokenStatus { get; private set; } = WaterTransactionTokenStatus.Pending;
    public string? TokenValue { get; private set; }
    public string? FailureReason { get; private set; }
    public string? Notes { get; private set; }

    // Navigations
    public Property Property { get; private set; } = default!;
    public Apartment Unit { get; private set; } = default!;
    public Meter WaterMeter { get; private set; } = default!;
    public Tenant? Tenant { get; private set; }

    private WaterTransaction() { }

    public static WaterTransaction Create(
        string transactionReference,
        Guid propertyId,
        Guid unitId,
        Guid waterMeterId,
        decimal amount,
        decimal unitsPurchased,
        decimal unitPrice,
        WaterPaymentMethod paymentMethod,
        string phoneNumber,
        DateTime transactionDate,
        Guid? tenantId = null,
        string? externalTransactionReference = null,
        WaterTransactionPaymentStatus paymentStatus = WaterTransactionPaymentStatus.Pending,
        WaterTransactionTokenStatus tokenStatus = WaterTransactionTokenStatus.Pending,
        string? notes = null)
    {
        if (string.IsNullOrWhiteSpace(transactionReference))
            throw new ArgumentException("Transaction reference cannot be empty.", nameof(transactionReference));
        if (amount <= 0)
            throw new ArgumentException("Amount must be greater than zero.", nameof(amount));

        return new WaterTransaction
        {
            TransactionReference = transactionReference.Trim(),
            PropertyId = propertyId,
            UnitId = unitId,
            WaterMeterId = waterMeterId,
            TenantId = tenantId,
            Amount = amount,
            UnitsPurchased = unitsPurchased,
            UnitPrice = unitPrice,
            PaymentMethod = paymentMethod,
            PhoneNumber = phoneNumber.Trim(),
            TransactionDate = transactionDate,
            ExternalTransactionReference = string.IsNullOrWhiteSpace(externalTransactionReference) ? null : externalTransactionReference.Trim(),
            PaymentStatus = paymentStatus,
            TokenStatus = tokenStatus,
            Notes = notes
        };
    }

    public void ConfirmPayment(string? externalRef = null)
    {
        PaymentStatus = WaterTransactionPaymentStatus.Confirmed;
        if (!string.IsNullOrWhiteSpace(externalRef))
            ExternalTransactionReference = externalRef.Trim();
        MarkUpdated();
    }

    public void SetTokenGenerated(string tokenValue)
    {
        TokenStatus = WaterTransactionTokenStatus.Generated;
        TokenValue = tokenValue.Trim();
        MarkUpdated();
    }

    public void SetTokenDelivered()
    {
        TokenStatus = WaterTransactionTokenStatus.Delivered;
        MarkUpdated();
    }

    public void FailPayment(string reason)
    {
        PaymentStatus = WaterTransactionPaymentStatus.Failed;
        FailureReason = reason;
        MarkUpdated();
    }

    public void FailToken(string reason)
    {
        TokenStatus = WaterTransactionTokenStatus.Failed;
        FailureReason = reason;
        MarkUpdated();
    }

    public void Reverse(string reason)
    {
        PaymentStatus = WaterTransactionPaymentStatus.Reversed;
        Notes = string.IsNullOrWhiteSpace(Notes) ? $"Reversed: {reason}" : $"{Notes} | Reversed: {reason}";
        MarkUpdated();
    }
}
