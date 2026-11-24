using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Represents a billed rent obligation for a tenancy covering a specific period.
/// </summary>
public class RentCharge : BaseEntity
{
    public string ChargeReference { get; private set; } = default!;
    public Guid TenancyId { get; private set; }
    public Guid TenantId { get; private set; }
    public Guid PropertyId { get; private set; }
    public Guid ApartmentId { get; private set; }
    public string BillingPeriod { get; private set; } = default!; // e.g. "2026-11"
    public DateTime BillingDate { get; private set; }
    public DateTime DueDate { get; private set; }
    public decimal Amount { get; private set; }
    public decimal AmountPaid { get; private set; }
    public RentChargeStatus Status { get; private set; } = RentChargeStatus.Pending;
    public string? Description { get; private set; }
    public string? CreatedBy { get; private set; }
    public DateTime? CancelledAt { get; private set; }
    public string? CancellationReason { get; private set; }

    public decimal OutstandingAmount => Math.Max(0m, Amount - AmountPaid);

    // Navigations
    public Tenancy Tenancy { get; private set; } = default!;
    public Tenant Tenant { get; private set; } = default!;
    public Property Property { get; private set; } = default!;
    public Apartment Apartment { get; private set; } = default!;
    public ICollection<PaymentAllocation> Allocations { get; private set; } = [];

    private RentCharge() { }

    public static RentCharge Create(
        string chargeReference,
        Guid tenancyId,
        Guid tenantId,
        Guid propertyId,
        Guid apartmentId,
        string billingPeriod,
        DateTime billingDate,
        DateTime dueDate,
        decimal amount,
        string? description = null,
        string? createdBy = null)
    {
        if (string.IsNullOrWhiteSpace(chargeReference))
            throw new ArgumentException("Charge reference cannot be empty.", nameof(chargeReference));
        if (amount <= 0)
            throw new ArgumentException("Charge amount must be strictly positive.", nameof(amount));
        if (dueDate < billingDate)
            throw new ArgumentException("Due date cannot precede billing date.", nameof(dueDate));

        return new RentCharge
        {
            ChargeReference = chargeReference.Trim(),
            TenancyId = tenancyId,
            TenantId = tenantId,
            PropertyId = propertyId,
            ApartmentId = apartmentId,
            BillingPeriod = billingPeriod.Trim(),
            BillingDate = billingDate,
            DueDate = dueDate,
            Amount = amount,
            AmountPaid = 0m,
            Status = RentChargeStatus.Pending,
            Description = description,
            CreatedBy = createdBy
        };
    }

    public void ApplyPayment(decimal amount)
    {
        if (Status == RentChargeStatus.Cancelled)
            throw new InvalidOperationException("Cannot apply payment to a cancelled rent charge.");
        if (amount <= 0)
            throw new ArgumentException("Payment amount must be greater than zero.", nameof(amount));
        if (amount > OutstandingAmount)
            throw new InvalidOperationException($"Cannot apply payment of {amount:N2} exceeding outstanding amount of {OutstandingAmount:N2}.");

        AmountPaid += amount;
        RecalculateStatus(DateTime.UtcNow);
        MarkUpdated();
    }

    public void ReversePayment(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Reversal amount must be greater than zero.", nameof(amount));
        if (amount > AmountPaid)
            throw new InvalidOperationException($"Cannot reverse {amount:N2} exceeding total paid {AmountPaid:N2}.");

        AmountPaid -= amount;
        RecalculateStatus(DateTime.UtcNow);
        MarkUpdated();
    }

    public void Cancel(string reason)
    {
        if (Status == RentChargeStatus.Cancelled)
            throw new InvalidOperationException("Charge is already cancelled.");
        if (AmountPaid > 0)
            throw new InvalidOperationException("Cannot cancel a rent charge that has payments applied. Reverse allocations first.");

        Status = RentChargeStatus.Cancelled;
        CancelledAt = DateTime.UtcNow;
        CancellationReason = reason;
        MarkUpdated();
    }

    public void RecalculateStatus(DateTime asOf)
    {
        if (Status == RentChargeStatus.Cancelled)
            return;

        if (AmountPaid >= Amount)
        {
            Status = RentChargeStatus.Paid;
        }
        else if (AmountPaid > 0)
        {
            Status = RentChargeStatus.PartiallyPaid;
        }
        else
        {
            Status = asOf > DueDate ? RentChargeStatus.Overdue : RentChargeStatus.Pending;
        }
    }
}
