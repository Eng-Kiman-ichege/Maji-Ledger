namespace MajiLedger.Application.Common.Interfaces;

/// <summary>
/// Placeholder contract for sending SMS notifications.
/// Concrete integration will dispatch tokens to tenant phone numbers in Step 4.
/// </summary>
public interface ISmsGatewayService
{
    Task<string> SendSmsAsync(string recipientPhone, string message, CancellationToken cancellationToken = default);
}
