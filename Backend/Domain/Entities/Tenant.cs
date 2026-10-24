using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// A tenant who occupies an apartment under a tenancy agreement.
/// </summary>
public class Tenant : AuditableEntity
{
    public string FullName { get; private set; } = default!;
    public string PhoneNumber { get; private set; } = default!;
    public string? Email { get; private set; }
    public string? NationalId { get; private set; }

    // Navigation
    public ICollection<Tenancy> Tenancies { get; private set; } = [];

    private Tenant() { }

    public static Tenant Create(string fullName, string phoneNumber, string? email = null, string? nationalId = null, string? createdBy = null)
    {
        return new Tenant
        {
            FullName = fullName,
            PhoneNumber = phoneNumber,
            Email = email,
            NationalId = nationalId,
            CreatedBy = createdBy
        };
    }
}
