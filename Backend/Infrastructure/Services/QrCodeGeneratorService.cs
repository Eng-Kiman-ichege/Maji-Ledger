using System.Text;
using MajiLedger.Application.Common.Interfaces;
using QRCoder;

namespace MajiLedger.Infrastructure.Services;

public class QrCodeGeneratorService : IQrCodeGeneratorService
{
    public string GenerateSvg(string payload)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.Q);
        var svgQrCode = new SvgQRCode(data);
        return svgQrCode.GetGraphic(20);
    }

    public string GenerateDataUriSvg(string payload)
    {
        var svg = GenerateSvg(payload);
        var base64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(svg));
        return $"data:image/svg+xml;base64,{base64}";
    }

    public byte[] GeneratePng(string payload, int pixelsPerModule = 10)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.Q);
        var pngQrCode = new PngByteQRCode(data);
        return pngQrCode.GetGraphic(pixelsPerModule);
    }
}
