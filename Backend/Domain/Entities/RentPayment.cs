using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Represents a received rent payment recorded in the Rent Ledger.
/// Tracks transaction reference, allocation across charges, and receipt details.
/// </summary>
public class RentPayment : BaseEntity
{
    public string PaymentReference { get; private set; } = default!;
    public Guid TenancyId { get; private set; }
    public Guid TenantId { get; private set; }
    public Guid PropertyId { get; private set; }
    public Guid ApartmentId { get; private set; }
    public decimal Amount { get; private set; }
    public decimal AmountAllocated { get; private set; }
    public RentPaymentMethod PaymentMethod { get; private set; }
    public string? TransactionReference { get; private set; } // e.g. M-Pesa Receipt / Bank Ref
    public DateTime PaymentDate { get; private set; }
    public string? PayerName { get; private set; }
    public string? PayerPhoneNumber { get; private set; }
    public RentPaymentStatus PaymentStatus { get; private set; } = RentPaymentStatus.Confirmed;
    public string ReceiptNumber { get; private set; } = default!;
    public string? Notes { get; private set; }
    public string? RecordedByUserId { get; private set; }
    public DateTime? ReversedAt { get; private set; }
    public string? ReversalReason { get; private set; }

    public decimal UnallocatedAmount => Math.Max(0m, Amount - AmountAllocated);

    // Navigations
    public Tenancy Tenancy { get; private set; } = default!;
    public Tenant Tenant { get; private set; } = default!;
    public Property Property { get; private set; } = default!;
    public Apartment Apartment { get; private set; } = default!;
    public ICollection<PaymentAllocation> Allocations { get; private set; } = [];

    private RentPayment() { }

    public static RentPayment Create(
        string paymentReference,
        Guid tenancyId,
        Guid tenantId,
        Guid propertyId,
        Guid apartmentId,
        decimal amount,
        RentPaymentMethod paymentMethod,
        DateTime paymentDate,
        string receiptNumber,
        string? transactionReference = null,
        string? payerName = null,
        string? payerPhoneNumber = null,
        string? notes = null,
        string? recordedByUserId = null,
        RentPaymentStatus initialStatus = RentPaymentStatus.Confirmed)
    {
        if (string.IsNullOrWhiteSpace(paymentReference))
            throw new ArgumentException("Payment reference cannot be empty.", nameof(paymentReference));
        if (string.IsNullOrWhiteSpace(receiptNumber))
            throw new ArgumentException("Receipt number cannot be empty.", nameof(receiptNumber));
        if (amount <= 0)
            throw new ArgumentException("Payment amount must be greater than zero.", nameof(amount));

        return new RentPayment
        {
            PaymentReference = paymentReference.Trim(),
            TenancyId = tenancyId,
            TenantId = tenantId,
            PropertyId = propertyId,
            ApartmentId = apartmentId,
            Amount = amount,
            AmountAllocated = 0m,
            PaymentMethod = paymentMethod,
            PaymentDate = paymentDate,
            ReceiptNumber = receiptNumber.Trim(),
            TransactionReference = string.IsNullOrWhiteSpace(transactionReference) ? null : transactionReference.Trim(),
            PayerName = payerName?.Trim(),
            PayerPhoneNumber = payerPhoneNumber?.Trim(),
            Notes = notes,
            RecordedByUserId = recordedByUserId,
            PaymentStatus = initialStatus
        };
    }

    public void Allocate(decimal amount)
    {
        if (PaymentStatus != RentPaymentStatus.Confirmed)
            throw new InvalidOperationException($"Cannot allocate payment with status '{PaymentStatus}'. Only confirmed payments can be allocated.");
        if (amount <= 0)
            throw new ArgumentException("Allocated amount must be greater than zero.", nameof(amount));
        if (amount > UnallocatedAmount)
            throw new InvalidOperationException($"Cannot allocate {amount:N2}. Exceeds unallocated amount of {UnallocatedAmount:N2}.");

        AmountAllocated += amount;
        MarkUpdated();
    }

    public void Deallocate(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Deallocated amount must be greater than zero.", nameof(amount));
        if (amount > AmountAllocated)
            throw new InvalidOperationException($"Cannot deallocate {amount:N2}. Exceeds total allocated amount of {AmountAllocated:N2}.");

        AmountAllocated -= amount;
        MarkUpdated();
    }

    public void Reverse(string reason)
    {
        if (PaymentStatus == RentPaymentStatus.Reversed)
            throw new InvalidOperationException("Payment is already reversed.");

        PaymentStatus = RentPaymentStatus.Reversed;
        ReversedAt = DateTime.UtcNow;
        ReversalReason = reason;
        MarkUpdated();
    }

    public void Confirm()
    {
        if (PaymentStatus == RentPaymentStatus.Confirmed)
            return;

        PaymentStatus = RentPaymentStatus.Confirmed;
        MarkUpdated();
    }

    public void Fail(string? reason = null)
    {
        PaymentStatus = RentPaymentStatus.Failed;
        if (!string.IsNullOrWhiteSpace(reason))
            Notes = string.IsNullOrWhiteSpace(Notes) ? reason : $"{Notes} | Failed: {reason}";
        MarkUpdated();
    }
}
