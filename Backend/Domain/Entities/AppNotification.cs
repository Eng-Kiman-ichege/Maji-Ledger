using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// In-app notification for landlord portal users.
/// </summary>
public class AppNotification
{
    public Guid Id { get; private set; }

    // ── Recipient ─────────────────────────────────────────────────────────────
    public Guid UserId { get; private set; }
    public Guid? OwnerId { get; private set; }

    // ── Content ───────────────────────────────────────────────────────────────
    public NotificationType Type { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;

    // ── State ─────────────────────────────────────────────────────────────────
    public bool IsRead { get; private set; }
    public DateTime? ReadAt { get; private set; }

    // ── Related entity (optional deep link) ──────────────────────────────────
    public string? RelatedEntityType { get; private set; }
    public Guid? RelatedEntityId { get; private set; }

    // ── Audit ─────────────────────────────────────────────────────────────────
    public DateTime CreatedAt { get; private set; }

    // ── Navigation ────────────────────────────────────────────────────────────
    public ApplicationUser User { get; private set; } = null!;
    public Owner? Owner { get; private set; }

    private AppNotification() { }

    public static AppNotification Create(
        Guid userId,
        NotificationType type,
        string title,
        string message,
        Guid? ownerId = null,
        string? relatedEntityType = null,
        Guid? relatedEntityId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(message);

        return new AppNotification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            OwnerId = ownerId,
            Type = type,
            Title = title.Trim(),
            Message = message.Trim(),
            IsRead = false,
            RelatedEntityType = relatedEntityType,
            RelatedEntityId = relatedEntityId,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void MarkRead()
    {
        if (!IsRead)
        {
            IsRead = true;
            ReadAt = DateTime.UtcNow;
        }
    }
}
