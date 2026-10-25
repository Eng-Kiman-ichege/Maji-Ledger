using MajiLedger.Domain.Enums;

namespace MajiLedger.Application.Common.Interfaces;

/// <summary>
/// Placeholder contract for initiating payments through mobile money providers (e.g. M-Pesa STK push).
/// Concrete provider adapter will be connected in Step 4.
/// </summary>
public interface IPaymentGatewayService
{
    Task<string> InitiatePushAsync(
        PaymentChannel channel,
        string customerPhone,
        decimal amount,
        string accountReference,
        CancellationToken cancellationToken = default);
}
