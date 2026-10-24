namespace MajiLedger.Domain.Common;

/// <summary>
/// Base class for all domain entities. Provides a strongly-typed primary key
/// and audit timestamps.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; protected set; }

    protected void MarkUpdated() => UpdatedAt = DateTime.UtcNow;
}
