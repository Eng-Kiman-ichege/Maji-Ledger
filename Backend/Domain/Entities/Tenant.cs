using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// A tenant who occupies an apartment under a tenancy agreement.
/// Extended for PropertyLedger Stage 5: separate first, middle, and last names,
/// alternative phone, physical address, and optional linked user account.
/// </summary>
public class Tenant : AuditableEntity
{
    public Guid? UserId { get; private set; }
    public string FirstName { get; private set; } = default!;
    public string? MiddleName { get; private set; }
    public string LastName { get; private set; } = default!;
    public string FullName { get; private set; } = default!;
    public string PhoneNumber { get; private set; } = default!;
    public string? AlternativePhoneNumber { get; private set; }
    public string? Email { get; private set; }
    public string? NationalId { get; private set; }
    public string? Address { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation
    public ApplicationUser? User { get; private set; }
    public ICollection<Tenancy> Tenancies { get; private set; } = [];
    public ICollection<TenancyTenant> TenancyAssignments { get; private set; } = [];

    private Tenant() { }

    public static Tenant Create(
        string firstName,
        string lastName,
        string phoneNumber,
        string? middleName = null,
        string? email = null,
        string? nationalId = null,
        string? alternativePhoneNumber = null,
        string? address = null,
        Guid? userId = null,
        string? createdBy = null)
    {
        var fullName = string.IsNullOrWhiteSpace(middleName)
            ? $"{firstName.Trim()} {lastName.Trim()}"
            : $"{firstName.Trim()} {middleName.Trim()} {lastName.Trim()}";

        return new Tenant
        {
            FirstName = firstName.Trim(),
            MiddleName = string.IsNullOrWhiteSpace(middleName) ? null : middleName.Trim(),
            LastName = lastName.Trim(),
            FullName = fullName,
            PhoneNumber = phoneNumber.Trim(),
            AlternativePhoneNumber = string.IsNullOrWhiteSpace(alternativePhoneNumber) ? null : alternativePhoneNumber.Trim(),
            Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant(),
            NationalId = string.IsNullOrWhiteSpace(nationalId) ? null : nationalId.Trim(),
            Address = string.IsNullOrWhiteSpace(address) ? null : address.Trim(),
            UserId = userId,
            IsActive = true,
            CreatedBy = createdBy
        };
    }

    public void Update(
        string firstName,
        string lastName,
        string phoneNumber,
        string? middleName = null,
        string? email = null,
        string? nationalId = null,
        string? alternativePhoneNumber = null,
        string? address = null,
        string? updatedBy = null)
    {
        FirstName = firstName.Trim();
        MiddleName = string.IsNullOrWhiteSpace(middleName) ? null : middleName.Trim();
        LastName = lastName.Trim();
        FullName = string.IsNullOrWhiteSpace(middleName)
            ? $"{firstName.Trim()} {lastName.Trim()}"
            : $"{firstName.Trim()} {middleName.Trim()} {lastName.Trim()}";

        PhoneNumber = phoneNumber.Trim();
        AlternativePhoneNumber = string.IsNullOrWhiteSpace(alternativePhoneNumber) ? null : alternativePhoneNumber.Trim();
        Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();
        NationalId = string.IsNullOrWhiteSpace(nationalId) ? null : nationalId.Trim();
        Address = string.IsNullOrWhiteSpace(address) ? null : address.Trim();
        UpdatedBy = updatedBy;
        MarkUpdated();
    }

    public void LinkUser(Guid userId, string? updatedBy = null)
    {
        UserId = userId;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }

    public void Deactivate(string updatedBy)
    {
        IsActive = false;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }

    public void Activate(string updatedBy)
    {
        IsActive = true;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }
}
