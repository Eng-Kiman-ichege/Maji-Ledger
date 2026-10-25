using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// An active or historical tenancy between a tenant and an apartment.
/// Closed (not deleted) when a tenant moves out, preserving full history.
/// </summary>
public class Tenancy : BaseEntity
{
    public Guid TenantId { get; private set; }
    public Guid ApartmentId { get; private set; }
    public TenancyStatus Status { get; private set; } = TenancyStatus.Active;
    public DateTime StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public string? Notes { get; private set; }
    public string? CreatedBy { get; private set; }

    // Navigation
    public Tenant Tenant { get; private set; } = default!;
    public Apartment Apartment { get; private set; } = default!;

    private Tenancy() { }

    public static Tenancy Create(
        Guid tenantId,
        Guid apartmentId,
        DateTime? startDate = null,
        string? createdBy = null)
    {
        return new Tenancy
        {
            TenantId = tenantId,
            ApartmentId = apartmentId,
            StartDate = startDate ?? DateTime.UtcNow,
            Status = TenancyStatus.Active,
            CreatedBy = createdBy
        };
    }

    public void End(string? notes = null)
    {
        Status = TenancyStatus.Ended;
        EndDate = DateTime.UtcNow;
        Notes = notes;
    }

    public void Suspend(string? notes = null)
    {
        Status = TenancyStatus.Suspended;
        Notes = notes;
    }

    public bool IsActive => Status == TenancyStatus.Active;
}
