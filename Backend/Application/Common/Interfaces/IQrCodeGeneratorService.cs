namespace MajiLedger.Application.Common.Interfaces;

public interface IQrCodeGeneratorService
{
    string GenerateSvg(string payload);
    string GenerateDataUriSvg(string payload);
    byte[] GeneratePng(string payload, int pixelsPerModule = 10);
}
