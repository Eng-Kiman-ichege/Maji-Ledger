using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// A property owner who may own multiple properties.
/// </summary>
public class Owner : AuditableEntity
{
    public string FullName { get; private set; } = default!;
    public string PhoneNumber { get; private set; } = default!;
    public string? Email { get; private set; }
    public string? NationalId { get; private set; }

    // Navigation
    public ICollection<PropertyOwnership> Ownerships { get; private set; } = [];

    private Owner() { }

    public static Owner Create(string fullName, string phoneNumber, string? email = null, string? nationalId = null, string? createdBy = null)
    {
        return new Owner
        {
            FullName = fullName,
            PhoneNumber = phoneNumber,
            Email = email,
            NationalId = nationalId,
            CreatedBy = createdBy
        };
    }
}
