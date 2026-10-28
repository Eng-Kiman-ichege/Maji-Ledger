using MajiLedger.Domain.Entities;

namespace MajiLedger.Application.Common.Interfaces;

public interface IPaymentFulfillmentService
{
    Task<WaterPurchase> ProcessConfirmedPaymentAsync(
        PaymentAttempt attempt,
        string providerRef,
        decimal amountConfirmed,
        DateTime paidAt,
        CancellationToken ct = default);
}
