using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Tracks tenant credit balances originating from overpayments, security deposit refunds,
/// or rent adjustments. Can be applied against future rent charges.
/// </summary>
public class TenantCredit : BaseEntity
{
    public string CreditReference { get; private set; } = default!;
    public Guid TenantId { get; private set; }
    public Guid? TenancyId { get; private set; }
    public Guid PropertyId { get; private set; }
    public Guid? SourcePaymentId { get; private set; }
    public decimal OriginalAmount { get; private set; }
    public decimal RemainingCredit { get; private set; }
    public TenantCreditStatus Status { get; private set; } = TenantCreditStatus.Active;
    public string Reason { get; private set; } = default!;
    public DateTime? UtilizedAt { get; private set; }
    public DateTime? RefundedAt { get; private set; }
    public string? Notes { get; private set; }

    // Navigations
    public Tenant Tenant { get; private set; } = default!;
    public Tenancy? Tenancy { get; private set; }
    public Property Property { get; private set; } = default!;
    public RentPayment? SourcePayment { get; private set; }

    private TenantCredit() { }

    public static TenantCredit Create(
        string creditReference,
        Guid tenantId,
        Guid propertyId,
        decimal amount,
        string reason,
        Guid? tenancyId = null,
        Guid? sourcePaymentId = null,
        string? notes = null)
    {
        if (string.IsNullOrWhiteSpace(creditReference))
            throw new ArgumentException("Credit reference cannot be empty.", nameof(creditReference));
        if (amount <= 0)
            throw new ArgumentException("Credit amount must be greater than zero.", nameof(amount));

        return new TenantCredit
        {
            CreditReference = creditReference.Trim(),
            TenantId = tenantId,
            PropertyId = propertyId,
            TenancyId = tenancyId,
            SourcePaymentId = sourcePaymentId,
            OriginalAmount = amount,
            RemainingCredit = amount,
            Status = TenantCreditStatus.Active,
            Reason = reason,
            Notes = notes
        };
    }

    public void Utilize(decimal amount)
    {
        if (Status != TenantCreditStatus.Active)
            throw new InvalidOperationException($"Cannot utilize credit with status '{Status}'.");
        if (amount <= 0)
            throw new ArgumentException("Utilized amount must be greater than zero.", nameof(amount));
        if (amount > RemainingCredit)
            throw new InvalidOperationException($"Cannot utilize {amount:N2}. Exceeds remaining credit of {RemainingCredit:N2}.");

        RemainingCredit -= amount;
        if (RemainingCredit == 0m)
        {
            Status = TenantCreditStatus.FullyUtilized;
            UtilizedAt = DateTime.UtcNow;
        }

        MarkUpdated();
    }

    public void Refund(string? reason = null)
    {
        if (Status != TenantCreditStatus.Active)
            throw new InvalidOperationException($"Cannot refund credit with status '{Status}'.");

        Status = TenantCreditStatus.Refunded;
        RefundedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(reason))
            Notes = string.IsNullOrWhiteSpace(Notes) ? reason : $"{Notes} | Refunded: {reason}";
        RemainingCredit = 0m;
        MarkUpdated();
    }
}
