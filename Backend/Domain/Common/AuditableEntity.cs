namespace MajiLedger.Domain.Common;

/// <summary>
/// Extends BaseEntity with soft-delete and created/modified-by tracking.
/// </summary>
public abstract class AuditableEntity : BaseEntity
{
    public string? CreatedBy { get; protected set; }
    public string? UpdatedBy { get; protected set; }
    public bool IsDeleted { get; protected set; }
    public DateTime? DeletedAt { get; protected set; }

    public void SoftDelete(string deletedBy)
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
        UpdatedBy = deletedBy;
        MarkUpdated();
    }
}
