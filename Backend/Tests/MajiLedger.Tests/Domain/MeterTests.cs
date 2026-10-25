using FluentAssertions;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using Xunit;

namespace MajiLedger.Tests.Domain;

public class MeterTests
{
    [Fact]
    public void Create_ValidParameters_InstantiatesMeterWithMaskedIdentifier()
    {
        // Arrange
        var meterNumber = "MTR-8829-4102";
        var serial = "SN-2026-9901";

        // Act
        var meter = Meter.Create(meterNumber, MeterType.Prepaid, serial);

        // Assert
        meter.Should().NotBeNull();
        meter.MeterNumber.Should().Be(meterNumber);
        meter.SerialNumber.Should().Be(serial);
        meter.Type.Should().Be(MeterType.Prepaid);
        meter.Status.Should().Be(MeterStatus.Active);
        meter.MaskedIdentifier.Should().Be("****4102");
    }

    [Fact]
    public void AssignToApartment_ValidApartmentId_UpdatesCurrentApartmentAndRecordsUpdatedBy()
    {
        // Arrange
        var meter = Meter.Create("MTR-12345", MeterType.Prepaid);
        var apartmentId = Guid.NewGuid();
        var user = "admin@majiledger.com";

        // Act
        meter.AssignToApartment(apartmentId, user);

        // Assert
        meter.CurrentApartmentId.Should().Be(apartmentId);
        meter.UpdatedBy.Should().Be(user);
    }

    [Fact]
    public void UpdateStatus_Decommissioned_UpdatesStatusCorrectly()
    {
        // Arrange
        var meter = Meter.Create("MTR-12345", MeterType.Prepaid);

        // Act
        meter.UpdateStatus(MeterStatus.Decommissioned, "admin");

        // Assert
        meter.Status.Should().Be(MeterStatus.Decommissioned);
        meter.UpdatedBy.Should().Be("admin");
    }

    [Fact]
    public void MeterAssignment_CreateAndClose_ManagesActiveWindow()
    {
        // Arrange
        var meterId = Guid.NewGuid();
        var apartmentId = Guid.NewGuid();

        // Act
        var assignment = MeterAssignment.Create(meterId, apartmentId, "installer");

        // Assert
        assignment.IsActive.Should().BeTrue();
        assignment.UnassignedAt.Should().BeNull();

        // Close
        assignment.Close();
        assignment.IsActive.Should().BeFalse();
        assignment.UnassignedAt.Should().NotBeNull();
    }
}
