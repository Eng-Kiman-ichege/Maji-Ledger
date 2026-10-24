using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Records an active or historical tenancy between a tenant and an apartment.
/// Historical records are preserved when a tenant moves out.
/// </summary>
public class Tenancy : BaseEntity
{
    public Guid TenantId { get; private set; }
    public Guid ApartmentId { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public TenancyStatus Status { get; private set; } = TenancyStatus.Active;
    public string? Notes { get; private set; }

    // Navigation
    public Tenant Tenant { get; private set; } = default!;
    public Apartment Apartment { get; private set; } = default!;

    private Tenancy() { }

    public static Tenancy Create(Guid tenantId, Guid apartmentId, DateTime? startDate = null)
    {
        return new Tenancy
        {
            TenantId = tenantId,
            ApartmentId = apartmentId,
            StartDate = startDate ?? DateTime.UtcNow,
            Status = TenancyStatus.Active
        };
    }

    public void End(string? notes = null)
    {
        Status = TenancyStatus.Ended;
        EndDate = DateTime.UtcNow;
        Notes = notes;
    }
}
