using MajiLedger.Application.Common.Interfaces;

namespace MajiLedger.Infrastructure.Services;

/// <summary>
/// Placeholder STS token generation service.
/// Generates deterministic 20-digit STS formatted test tokens for development.
/// Concrete STS HSM / cipher provider will be plugged in Step 4.
/// </summary>
public class PlaceholderStsTokenService : IStsTokenService
{
    public Task<string> GenerateTokenAsync(string meterNumber, decimal units, CancellationToken cancellationToken = default)
    {
        // Generates standard 20-digit STS token formatted as 4-4-4-4-4
        var hash = Math.Abs(HashCode.Combine(meterNumber, units, DateTime.UtcNow.Ticks));
        var rawDigits = hash.ToString().PadRight(20, '7')[..20];
        var formatted = $"{rawDigits[..4]}-{rawDigits[4..8]}-{rawDigits[8..12]}-{rawDigits[12..16]}-{rawDigits[16..20]}";
        return Task.FromResult(formatted);
    }
}
