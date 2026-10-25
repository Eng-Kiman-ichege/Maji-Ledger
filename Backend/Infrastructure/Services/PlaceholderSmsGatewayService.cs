using MajiLedger.Application.Common.Interfaces;

namespace MajiLedger.Infrastructure.Services;

/// <summary>
/// Placeholder SMS gateway service.
/// Logs dispatch and returns mock message references for development.
/// Concrete gateway adapter (e.g. Africa's Talking) will be plugged in Step 4.
/// </summary>
public class PlaceholderSmsGatewayService : ISmsGatewayService
{
    public Task<string> SendSmsAsync(string recipientPhone, string message, CancellationToken cancellationToken = default)
    {
        var messageRef = $"SMS-{Guid.NewGuid():N}"[..16].ToUpperInvariant();
        return Task.FromResult(messageRef);
    }
}
