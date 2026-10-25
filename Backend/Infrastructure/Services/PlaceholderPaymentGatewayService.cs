using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Infrastructure.Services;

/// <summary>
/// Placeholder Payment Gateway service.
/// Generates mock provider checkout IDs for development without calling live mobile money APIs.
/// Concrete Daraja / Airtel Money adapter will be plugged in Step 4.
/// </summary>
public class PlaceholderPaymentGatewayService : IPaymentGatewayService
{
    public Task<string> InitiatePushAsync(
        PaymentChannel channel,
        string customerPhone,
        decimal amount,
        string accountReference,
        CancellationToken cancellationToken = default)
    {
        var checkoutRequestId = $"ws_CO_{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid():N}"[..32];
        return Task.FromResult(checkoutRequestId);
    }
}
