using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Connects a rent payment to a specific rent charge, recording the exact amount applied.
/// </summary>
public class PaymentAllocation : BaseEntity
{
    public Guid RentPaymentId { get; private set; }
    public Guid RentChargeId { get; private set; }
    public decimal AllocatedAmount { get; private set; }
    public DateTime AllocatedAt { get; private set; }
    public string? CreatedBy { get; private set; }
    public bool IsReversed { get; private set; }
    public DateTime? ReversedAt { get; private set; }
    public string? ReversalReason { get; private set; }

    // Navigations
    public RentPayment RentPayment { get; private set; } = default!;
    public RentCharge RentCharge { get; private set; } = default!;

    private PaymentAllocation() { }

    public static PaymentAllocation Create(
        Guid rentPaymentId,
        Guid rentChargeId,
        decimal allocatedAmount,
        DateTime? allocatedAt = null,
        string? createdBy = null)
    {
        if (allocatedAmount <= 0)
            throw new ArgumentException("Allocated amount must be strictly positive.", nameof(allocatedAmount));

        return new PaymentAllocation
        {
            RentPaymentId = rentPaymentId,
            RentChargeId = rentChargeId,
            AllocatedAmount = allocatedAmount,
            AllocatedAt = allocatedAt ?? DateTime.UtcNow,
            CreatedBy = createdBy,
            IsReversed = false
        };
    }

    public void Reverse(string? reason = null)
    {
        if (IsReversed)
            throw new InvalidOperationException("Allocation is already reversed.");

        IsReversed = true;
        ReversedAt = DateTime.UtcNow;
        ReversalReason = reason;
        MarkUpdated();
    }
}
