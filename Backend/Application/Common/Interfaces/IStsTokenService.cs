namespace MajiLedger.Application.Common.Interfaces;

/// <summary>
/// Placeholder contract for Standard Transfer Specification (STS) token generation.
/// Concrete integration will interface with the STS key management and token dispenser in Step 4.
/// </summary>
public interface IStsTokenService
{
    Task<string> GenerateTokenAsync(string meterNumber, decimal units, CancellationToken cancellationToken = default);
}
