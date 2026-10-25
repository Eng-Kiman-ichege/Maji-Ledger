using FluentAssertions;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using Xunit;

namespace MajiLedger.Tests.Domain;

public class PaymentAttemptTests
{
    [Fact]
    public void Initiate_SetsInitialStatusAndExpiryWindow()
    {
        // Arrange
        var meterId = Guid.NewGuid();
        var configId = Guid.NewGuid();
        var phone = "254712345678";
        var amount = 500m;

        // Act
        var attempt = PaymentAttempt.Initiate(
            meterId, configId, PaymentChannel.ScanToPay, phone, amount, expiryWindow: TimeSpan.FromMinutes(10));

        // Assert
        attempt.Status.Should().Be(PaymentAttemptStatus.Initiated);
        attempt.CustomerPhone.Should().Be(phone);
        attempt.RequestedAmount.Should().Be(amount);
        attempt.IsTerminal.Should().BeFalse();
        attempt.ExpiresAt.Should().BeAfter(attempt.InitiatedAt);
    }

    [Fact]
    public void Confirm_TransitionsStatusToConfirmedAndTerminal()
    {
        // Arrange
        var attempt = PaymentAttempt.Initiate(Guid.NewGuid(), Guid.NewGuid(), PaymentChannel.ScanToPay, "0712345678", 200m);

        // Act
        attempt.Confirm();

        // Assert
        attempt.Status.Should().Be(PaymentAttemptStatus.Confirmed);
        attempt.CompletedAt.Should().NotBeNull();
        attempt.IsTerminal.Should().BeTrue();
    }

    [Fact]
    public void Fail_SetsFailureReasonAndTerminalStatus()
    {
        // Arrange
        var attempt = PaymentAttempt.Initiate(Guid.NewGuid(), Guid.NewGuid(), PaymentChannel.ScanToPay, "0712345678", 200m);

        // Act
        attempt.Fail("User cancelled STK push prompt.");

        // Assert
        attempt.Status.Should().Be(PaymentAttemptStatus.Failed);
        attempt.FailureReason.Should().Be("User cancelled STK push prompt.");
        attempt.IsTerminal.Should().BeTrue();
    }

    [Fact]
    public void Expire_TransitionsStatusToExpired()
    {
        // Arrange
        var attempt = PaymentAttempt.Initiate(Guid.NewGuid(), Guid.NewGuid(), PaymentChannel.ScanToPay, "0712345678", 200m);

        // Act
        attempt.Expire();

        // Assert
        attempt.Status.Should().Be(PaymentAttemptStatus.Expired);
        attempt.IsTerminal.Should().BeTrue();
    }
}
