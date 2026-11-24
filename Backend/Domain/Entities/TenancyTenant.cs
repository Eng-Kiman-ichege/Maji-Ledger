using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Connects a tenant to a tenancy agreement, supporting multiple occupants (roommates / co-tenants).
/// Exactly one active tenant in the tenancy should have IsPrimaryTenant = true.
/// </summary>
public class TenancyTenant : BaseEntity
{
    public Guid TenancyId { get; private set; }
    public Guid TenantId { get; private set; }
    public bool IsPrimaryTenant { get; private set; }
    public DateTime JoinedAt { get; private set; }
    public DateTime? LeftAt { get; private set; }

    // Navigation
    public Tenancy Tenancy { get; private set; } = default!;
    public Tenant Tenant { get; private set; } = default!;

    private TenancyTenant() { }

    public static TenancyTenant Create(
        Guid tenancyId,
        Guid tenantId,
        bool isPrimaryTenant = false,
        DateTime? joinedAt = null)
    {
        return new TenancyTenant
        {
            TenancyId = tenancyId,
            TenantId = tenantId,
            IsPrimaryTenant = isPrimaryTenant,
            JoinedAt = joinedAt ?? DateTime.UtcNow
        };
    }

    public void SetPrimary(bool isPrimary) => IsPrimaryTenant = isPrimary;

    public void RecordLeft(DateTime? leftAt = null)
    {
        LeftAt = leftAt ?? DateTime.UtcNow;
        if (IsPrimaryTenant)
        {
            IsPrimaryTenant = false;
        }
        MarkUpdated();
    }
}
