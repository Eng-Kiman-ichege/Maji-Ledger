using FluentAssertions;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using Xunit;

namespace MajiLedger.Tests.Domain;

public class QrCodeRegistrationTests
{
    [Fact]
    public void Create_GeneratesSecureUrlSafePublicToken()
    {
        // Arrange
        var meterId = Guid.NewGuid();
        var configId = Guid.NewGuid();

        // Act
        var qr = QrCodeRegistration.Create(meterId, configId, "admin");

        // Assert
        qr.Should().NotBeNull();
        qr.MeterId.Should().Be(meterId);
        qr.PaymentProviderConfigId.Should().Be(configId);
        qr.Status.Should().Be(QrCodeStatus.Active);
        qr.IsActive.Should().BeTrue();
        qr.PublicToken.Should().NotBeNullOrWhiteSpace();
        qr.PublicToken.Should().NotContain("+");
        qr.PublicToken.Should().NotContain("/");
        qr.PublicToken.Should().NotContain("=");
        qr.PublicToken.Length.Should().BeGreaterThanOrEqualTo(40);
    }

    [Fact]
    public void DisableAndEnable_TransitionsStatusProperly()
    {
        // Arrange
        var qr = QrCodeRegistration.Create(Guid.NewGuid(), Guid.NewGuid(), "admin");

        // Disable
        qr.Disable("manager");
        qr.Status.Should().Be(QrCodeStatus.Disabled);
        qr.IsActive.Should().BeFalse();

        // Enable
        qr.Enable("manager");
        qr.Status.Should().Be(QrCodeStatus.Active);
        qr.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Revoke_PermanentlyRevokesAndCannotBeReEnabled()
    {
        // Arrange
        var qr = QrCodeRegistration.Create(Guid.NewGuid(), Guid.NewGuid(), "admin");

        // Revoke
        qr.Revoke("Damaged physical sticker", "field_officer");
        qr.Status.Should().Be(QrCodeStatus.Revoked);
        qr.RevokedReason.Should().Be("Damaged physical sticker");
        qr.RevokedAt.Should().NotBeNull();

        // Attempting to re-enable must throw
        var act = () => qr.Enable("field_officer");
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*revoked*cannot be re-enabled*");
    }

    [Fact]
    public void QrCodeAuditLog_Record_CapturesImmutableAuditEntry()
    {
        // Arrange
        var qrId = Guid.NewGuid();

        // Act
        var audit = QrCodeAuditLog.Record(qrId, QrCodeAuditEvent.Revoked, "inspector", "Sticker tampered");

        // Assert
        audit.QrCodeRegistrationId.Should().Be(qrId);
        audit.EventType.Should().Be(QrCodeAuditEvent.Revoked);
        audit.PerformedBy.Should().Be("inspector");
        audit.Notes.Should().Be("Sticker tampered");
        audit.OccurredAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
    }
}
