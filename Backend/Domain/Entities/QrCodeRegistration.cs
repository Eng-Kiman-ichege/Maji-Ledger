using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;
using System.Security.Cryptography;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// The authoritative QR-code registration record.
/// The QR code sticker physically encodes only:
///   https://pay.majiledger.com/p/{PublicToken}
/// The backend resolves PublicToken to all meter, apartment, building, property,
/// and payment configuration details. No credentials are in the QR payload.
/// Only one Active registration is permitted per meter at any time.
/// </summary>
public class QrCodeRegistration : AuditableEntity
{
    public Guid MeterId { get; private set; }
    public Guid PaymentProviderConfigId { get; private set; }

    /// <summary>Cryptographically random, URL-safe, globally unique token embedded in the QR URL.</summary>
    public string PublicToken { get; private set; } = default!;

    public QrCodeStatus Status { get; private set; } = QrCodeStatus.Active;
    public string? RevokedReason { get; private set; }
    public DateTime? RevokedAt { get; private set; }

    // Navigation
    public Meter Meter { get; private set; } = default!;
    public PaymentProviderConfig PaymentProviderConfig { get; private set; } = default!;
    public ICollection<QrCodeAuditLog> AuditLogs { get; private set; } = [];
    public ICollection<PaymentAttempt> PaymentAttempts { get; private set; } = [];

    private QrCodeRegistration() { }

    public static QrCodeRegistration Create(
        Guid meterId,
        Guid paymentProviderConfigId,
        string? createdBy = null)
    {
        return new QrCodeRegistration
        {
            MeterId = meterId,
            PaymentProviderConfigId = paymentProviderConfigId,
            PublicToken = GeneratePublicToken(),
            Status = QrCodeStatus.Active,
            CreatedBy = createdBy
        };
    }

    public void Disable(string updatedBy)
    {
        Status = QrCodeStatus.Disabled;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }

    public void Revoke(string reason, string updatedBy)
    {
        Status = QrCodeStatus.Revoked;
        RevokedReason = reason;
        RevokedAt = DateTime.UtcNow;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }

    public void Enable(string updatedBy)
    {
        if (Status == QrCodeStatus.Revoked)
            throw new InvalidOperationException("A revoked QR registration cannot be re-enabled. Create a new registration.");

        Status = QrCodeStatus.Active;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }

    public bool IsActive => Status == QrCodeStatus.Active;

    private static string GeneratePublicToken()
    {
        // 32 random bytes → 43-char URL-safe Base64 string (no padding)
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }
}
