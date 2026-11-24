using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Business profile of a property owner. Decoupled from <see cref="ApplicationUser"/>
/// so ownership records persist even if login credentials change.
/// </summary>
public class Owner : AuditableEntity
{
    public string FullName { get; private set; } = default!;
    public string PhoneNumber { get; private set; } = default!;
    public string? Email { get; private set; }
    public string? NationalId { get; private set; }
    public string? KraPin { get; private set; }
    public string? Address { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation
    public ICollection<PropertyOwnership> Ownerships { get; private set; } = [];
    public ICollection<ApplicationUser> LinkedUsers { get; private set; } = [];

    private Owner() { }

    public static Owner Create(
        string fullName,
        string phoneNumber,
        string? email = null,
        string? nationalId = null,
        string? kraPin = null,
        string? address = null,
        string? createdBy = null)
    {
        return new Owner
        {
            FullName = fullName,
            PhoneNumber = phoneNumber,
            Email = email,
            NationalId = nationalId,
            KraPin = kraPin,
            Address = address,
            CreatedBy = createdBy
        };
    }

    public void Deactivate(string updatedBy) { IsActive = false; UpdatedBy = updatedBy; MarkUpdated(); }

    public void Activate(string updatedBy) { IsActive = true; UpdatedBy = updatedBy; MarkUpdated(); }

    public void Update(string fullName, string phoneNumber, string? email, string? nationalId, string? kraPin, string? address, string updatedBy)
    {
        FullName = fullName;
        PhoneNumber = phoneNumber;
        Email = email;
        NationalId = nationalId;
        KraPin = kraPin;
        Address = address;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }
}
