using MajiLedger.Domain.Common;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Full audit of every STS API call — including retries and failures.
/// Separate from <see cref="WaterToken"/> so failed attempts are always preserved
/// even when no token was issued. Append-only — never updated or deleted.
/// </summary>
public class TokenGenerationAttempt : BaseEntity
{
    public Guid WaterPurchaseId { get; private set; }
    public int AttemptNumber { get; private set; }
    public string StsRequestPayload { get; private set; } = default!;   // JSON
    public string? StsResponsePayload { get; private set; }             // JSON
    public bool Succeeded { get; private set; }
    public string? FailureReason { get; private set; }
    public DateTime AttemptedAt { get; private set; }

    // Navigation
    public WaterPurchase WaterPurchase { get; private set; } = default!;

    private TokenGenerationAttempt() { }

    public static TokenGenerationAttempt RecordSuccess(
        Guid waterPurchaseId,
        int attemptNumber,
        string requestPayload,
        string responsePayload)
    {
        return new TokenGenerationAttempt
        {
            WaterPurchaseId = waterPurchaseId,
            AttemptNumber = attemptNumber,
            StsRequestPayload = requestPayload,
            StsResponsePayload = responsePayload,
            Succeeded = true,
            AttemptedAt = DateTime.UtcNow
        };
    }

    public static TokenGenerationAttempt RecordFailure(
        Guid waterPurchaseId,
        int attemptNumber,
        string requestPayload,
        string? responsePayload,
        string failureReason)
    {
        return new TokenGenerationAttempt
        {
            WaterPurchaseId = waterPurchaseId,
            AttemptNumber = attemptNumber,
            StsRequestPayload = requestPayload,
            StsResponsePayload = responsePayload,
            Succeeded = false,
            FailureReason = failureReason,
            AttemptedAt = DateTime.UtcNow
        };
    }
}
