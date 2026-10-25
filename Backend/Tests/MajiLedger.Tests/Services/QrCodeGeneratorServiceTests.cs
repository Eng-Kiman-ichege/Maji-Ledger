using System.Text;
using FluentAssertions;
using MajiLedger.Infrastructure.Services;
using Xunit;

namespace MajiLedger.Tests.Services;

public class QrCodeGeneratorServiceTests
{
    private readonly QrCodeGeneratorService _service = new();

    [Fact]
    public void GenerateSvg_ValidPayload_ReturnsSvgXml()
    {
        // Arrange
        var payload = "https://pay.majiledger.com/p/test-public-token-12345";

        // Act
        var svg = _service.GenerateSvg(payload);

        // Assert
        svg.Should().NotBeNullOrWhiteSpace();
        svg.Should().StartWith("<?xml");
        svg.Should().Contain("<svg");
        svg.Should().Contain("</svg>");
    }

    [Fact]
    public void GenerateDataUriSvg_ValidPayload_ReturnsBase64EncodedDataUri()
    {
        // Arrange
        var payload = "https://pay.majiledger.com/p/test-token";

        // Act
        var dataUri = _service.GenerateDataUriSvg(payload);

        // Assert
        dataUri.Should().StartWith("data:image/svg+xml;base64,");
        var base64Part = dataUri["data:image/svg+xml;base64,".Length..];
        var decodedBytes = Convert.FromBase64String(base64Part);
        var decodedSvg = Encoding.UTF8.GetString(decodedBytes);
        decodedSvg.Should().Contain("<svg");
    }

    [Fact]
    public void GeneratePng_ValidPayload_ReturnsPngBinaryWithHeader()
    {
        // Arrange
        var payload = "https://pay.majiledger.com/p/test-token";

        // Act
        var pngBytes = _service.GeneratePng(payload, pixelsPerModule: 5);

        // Assert
        pngBytes.Should().NotBeNullOrEmpty();
        // PNG magic header: 0x89, 0x50, 0x4E, 0x47
        pngBytes[0].Should().Be(0x89);
        pngBytes[1].Should().Be(0x50); // P
        pngBytes[2].Should().Be(0x4E); // N
        pngBytes[3].Should().Be(0x47); // G
    }
}
