using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// An active or historical tenancy agreement between one or more tenants and an apartment unit.
/// Preserves agreed rent, deposit, payment terms, and occupancy history.
/// </summary>
public class Tenancy : BaseEntity
{
    public Guid ApartmentId { get; private set; }
    public Guid TenantId { get; private set; }    // Primary tenant for backward compatibility and fast direct lookup
    public string? TenancyReference { get; private set; }
    public TenancyStatus Status { get; private set; } = TenancyStatus.Active;
    public DateTime StartDate { get; private set; }
    public DateTime? ExpectedEndDate { get; private set; }
    public DateTime? ActualEndDate { get; private set; }
    public decimal MonthlyRent { get; private set; }
    public decimal SecurityDeposit { get; private set; }
    public int RentPaymentDueDay { get; private set; } = 1;
    public BillingFrequency BillingFrequency { get; private set; } = BillingFrequency.Monthly;
    public string? AgreementNotes { get; private set; }
    public string? CreatedBy { get; private set; }

    // Backward compatibility redirects
    public DateTime? EndDate => ActualEndDate ?? ExpectedEndDate;
    public string? Notes => AgreementNotes;

    // Navigation
    public Apartment Apartment { get; private set; } = default!;
    public Tenant Tenant { get; private set; } = default!;
    public ICollection<TenancyTenant> Tenants { get; private set; } = [];

    private Tenancy() { }

    public static Tenancy Create(
        Guid apartmentId,
        Guid primaryTenantId,
        decimal monthlyRent,
        decimal securityDeposit,
        DateTime startDate,
        string? tenancyReference = null,
        DateTime? expectedEndDate = null,
        int rentPaymentDueDay = 1,
        BillingFrequency billingFrequency = BillingFrequency.Monthly,
        string? agreementNotes = null,
        TenancyStatus initialStatus = TenancyStatus.Active,
        string? createdBy = null)
    {
        var tenancy = new Tenancy
        {
            ApartmentId = apartmentId,
            TenantId = primaryTenantId,
            TenancyReference = tenancyReference,
            MonthlyRent = monthlyRent,
            SecurityDeposit = securityDeposit,
            StartDate = startDate,
            ExpectedEndDate = expectedEndDate,
            RentPaymentDueDay = rentPaymentDueDay,
            BillingFrequency = billingFrequency,
            AgreementNotes = agreementNotes,
            Status = initialStatus,
            CreatedBy = createdBy
        };

        // Add primary tenant assignment
        tenancy.Tenants.Add(TenancyTenant.Create(tenancy.Id, primaryTenantId, isPrimaryTenant: true, joinedAt: startDate));
        return tenancy;
    }

    /// <summary>
    /// Legacy overload for existing tests and simple initializations.
    /// </summary>
    public static Tenancy Create(
        Guid tenantId,
        Guid apartmentId,
        DateTime? startDate = null,
        string? createdBy = null)
    {
        return Create(
            apartmentId: apartmentId,
            primaryTenantId: tenantId,
            monthlyRent: 0m,
            securityDeposit: 0m,
            startDate: startDate ?? DateTime.UtcNow,
            createdBy: createdBy);
    }

    public void AddTenant(Guid tenantId, bool isPrimary = false, DateTime? joinedAt = null)
    {
        if (Status != TenancyStatus.Active && Status != TenancyStatus.Pending)
            throw new InvalidOperationException("Cannot add a tenant to an inactive, expired or terminated tenancy.");

        var existing = Tenants.FirstOrDefault(t => t.TenantId == tenantId && t.LeftAt == null);
        if (existing != null)
            throw new InvalidOperationException("This tenant is already actively assigned to this tenancy.");

        if (isPrimary)
        {
            SetPrimaryTenant(tenantId);
        }

        Tenants.Add(TenancyTenant.Create(Id, tenantId, isPrimary, joinedAt ?? DateTime.UtcNow));
        MarkUpdated();
    }

    public void RemoveTenant(Guid tenantId, DateTime? leftAt = null)
    {
        var assignment = Tenants.FirstOrDefault(t => t.TenantId == tenantId && t.LeftAt == null);
        if (assignment == null)
            throw new InvalidOperationException("Active tenant assignment not found in this tenancy.");

        assignment.RecordLeft(leftAt ?? DateTime.UtcNow);

        // If the removed tenant was primary, update TenantId if another active tenant exists
        if (assignment.IsPrimaryTenant)
        {
            var nextActive = Tenants.FirstOrDefault(t => t.TenantId != tenantId && t.LeftAt == null);
            if (nextActive != null)
            {
                nextActive.SetPrimary(true);
                TenantId = nextActive.TenantId;
            }
        }

        MarkUpdated();
    }

    public void SetPrimaryTenant(Guid tenantId)
    {
        var target = Tenants.FirstOrDefault(t => t.TenantId == tenantId && t.LeftAt == null);
        if (target == null)
            throw new InvalidOperationException("Target tenant must be an active occupant of this tenancy.");

        foreach (var t in Tenants.Where(t => t.LeftAt == null))
        {
            t.SetPrimary(t.TenantId == tenantId);
        }

        TenantId = tenantId;
        MarkUpdated();
    }

    public void Activate()
    {
        if (!Tenants.Any(t => t.LeftAt == null))
            throw new InvalidOperationException("A tenancy must have at least one tenant before activation.");

        Status = TenancyStatus.Active;
        MarkUpdated();
    }

    public void Terminate(DateTime? actualEndDate = null, string? notes = null)
    {
        Status = TenancyStatus.Terminated;
        ActualEndDate = actualEndDate ?? DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(notes))
            AgreementNotes = string.IsNullOrWhiteSpace(AgreementNotes) ? notes : $"{AgreementNotes}\n[Terminated]: {notes}";

        foreach (var t in Tenants.Where(t => t.LeftAt == null))
        {
            t.RecordLeft(ActualEndDate);
        }

        MarkUpdated();
    }

    public void Cancel(string? notes = null)
    {
        Status = TenancyStatus.Cancelled;
        ActualEndDate = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(notes))
            AgreementNotes = string.IsNullOrWhiteSpace(AgreementNotes) ? notes : $"{AgreementNotes}\n[Cancelled]: {notes}";

        foreach (var t in Tenants.Where(t => t.LeftAt == null))
        {
            t.RecordLeft(ActualEndDate);
        }

        MarkUpdated();
    }

    public void Expire()
    {
        Status = TenancyStatus.Expired;
        ActualEndDate ??= ExpectedEndDate ?? DateTime.UtcNow;

        foreach (var t in Tenants.Where(t => t.LeftAt == null))
        {
            t.RecordLeft(ActualEndDate);
        }

        MarkUpdated();
    }

    public void Renew(DateTime newExpectedEndDate, decimal? newRent = null, string? notes = null)
    {
        if (newExpectedEndDate <= StartDate)
            throw new InvalidOperationException("New expected end date must be after the tenancy start date.");

        ExpectedEndDate = newExpectedEndDate;
        if (newRent.HasValue)
        {
            if (newRent.Value < 0) throw new InvalidOperationException("Rent cannot be negative.");
            MonthlyRent = newRent.Value;
        }

        if (!string.IsNullOrWhiteSpace(notes))
            AgreementNotes = string.IsNullOrWhiteSpace(AgreementNotes) ? notes : $"{AgreementNotes}\n[Renewed]: {notes}";

        Status = TenancyStatus.Active;
        ActualEndDate = null;
        MarkUpdated();
    }

    public void UpdateAgreement(
        decimal monthlyRent,
        decimal securityDeposit,
        int rentDueDay,
        BillingFrequency billingFrequency,
        DateTime? expectedEndDate,
        string? notes)
    {
        if (monthlyRent < 0) throw new InvalidOperationException("Monthly rent cannot be negative.");
        if (securityDeposit < 0) throw new InvalidOperationException("Security deposit cannot be negative.");
        if (rentDueDay < 1 || rentDueDay > 31) throw new InvalidOperationException("Rent due day must be between 1 and 31.");

        MonthlyRent = monthlyRent;
        SecurityDeposit = securityDeposit;
        RentPaymentDueDay = rentDueDay;
        BillingFrequency = billingFrequency;
        ExpectedEndDate = expectedEndDate;
        AgreementNotes = notes;
        MarkUpdated();
    }

    public void End(string? notes = null)
    {
        Terminate(DateTime.UtcNow, notes);
    }

    public void Suspend(string? notes = null)
    {
        Status = TenancyStatus.Suspended;
        if (!string.IsNullOrWhiteSpace(notes))
            AgreementNotes = string.IsNullOrWhiteSpace(AgreementNotes) ? notes : $"{AgreementNotes}\n[Suspended]: {notes}";
        MarkUpdated();
    }

    public bool IsActive => Status == TenancyStatus.Active;
}
