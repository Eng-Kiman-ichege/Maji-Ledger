using FluentAssertions;
using MajiLedger.Domain.Entities;
using Xunit;

namespace MajiLedger.Tests.Domain;

public class SharedMeterBillingPointTests
{
    [Fact]
    public void Create_ValidFraction_SetsActiveBillingPoint()
    {
        // Arrange
        var meterId = Guid.NewGuid();
        var apartmentId = Guid.NewGuid();

        // Act
        var point = SharedMeterBillingPoint.Create(meterId, apartmentId, 0.4m, notes: "Apartment 1A 40% share");

        // Assert
        point.MeterId.Should().Be(meterId);
        point.ApartmentId.Should().Be(apartmentId);
        point.AllocationFraction.Should().Be(0.4m);
        point.IsActive.Should().BeTrue();
        point.EffectiveTo.Should().BeNull();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-0.1)]
    [InlineData(1.05)]
    public void Create_InvalidFraction_ThrowsArgumentOutOfRangeException(decimal fraction)
    {
        var meterId = Guid.NewGuid();
        var apartmentId = Guid.NewGuid();

        var act = () => SharedMeterBillingPoint.Create(meterId, apartmentId, fraction);
        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void Close_TerminatesBillingPointAndMarksInactive()
    {
        // Arrange
        var point = SharedMeterBillingPoint.Create(Guid.NewGuid(), Guid.NewGuid(), 0.5m);

        // Act
        point.Close("Reallocated");

        // Assert
        point.IsActive.Should().BeFalse();
        point.EffectiveTo.Should().NotBeNull();
        point.Notes.Should().Be("Reallocated");
    }
}
