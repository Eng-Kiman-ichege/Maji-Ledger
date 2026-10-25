using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Non-secret payment provider configuration metadata — identifies the correct
/// Paybill shortcode and provider for a given property or platform.
/// API credentials are stored in Key Vault / environment secrets, never here.
/// </summary>
public class PaymentProviderConfig : AuditableEntity
{
    /// <summary>Null means this is a platform-wide default config.</summary>
    public Guid? PropertyId { get; private set; }

    public PaymentProviderType ProviderType { get; private set; }
    public string BusinessShortCode { get; private set; } = default!;

    /// <summary>Human-readable name shown to the customer on the Scan-to-Pay page.</summary>
    public string DisplayName { get; private set; } = default!;

    public EnvironmentType EnvironmentType { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation
    public Property? Property { get; private set; }
    public ICollection<QrCodeRegistration> QrCodeRegistrations { get; private set; } = [];
    public ICollection<PaymentAttempt> PaymentAttempts { get; private set; } = [];

    private PaymentProviderConfig() { }

    public static PaymentProviderConfig Create(
        PaymentProviderType providerType,
        string businessShortCode,
        string displayName,
        EnvironmentType environmentType = EnvironmentType.Production,
        Guid? propertyId = null,
        string? createdBy = null)
    {
        return new PaymentProviderConfig
        {
            PropertyId = propertyId,
            ProviderType = providerType,
            BusinessShortCode = businessShortCode,
            DisplayName = displayName,
            EnvironmentType = environmentType,
            CreatedBy = createdBy
        };
    }

    public void Deactivate(string updatedBy) { IsActive = false; UpdatedBy = updatedBy; MarkUpdated(); }
}
