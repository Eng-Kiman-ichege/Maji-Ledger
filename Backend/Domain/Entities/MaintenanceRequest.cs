using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Represents a maintenance request raised against a property, building or apartment.
/// </summary>
public class MaintenanceRequest
{
    public Guid Id { get; private set; }

    // ── Location ──────────────────────────────────────────────────────────────
    public Guid PropertyId { get; private set; }
    public Guid? BuildingId { get; private set; }
    public Guid? ApartmentId { get; private set; }

    // ── Tenancy link (optional — maintenance can be raised without a tenant) ─
    public Guid? TenancyId { get; private set; }
    public Guid? TenantId { get; private set; }

    // ── Classification ────────────────────────────────────────────────────────
    public MaintenanceCategory Category { get; private set; }
    public MaintenancePriority Priority { get; private set; }
    public MaintenanceStatus Status { get; private set; }

    // ── Details ───────────────────────────────────────────────────────────────
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;

    // ── Assignment ────────────────────────────────────────────────────────────
    public string? AssignedTo { get; private set; }

    // ── Financials ────────────────────────────────────────────────────────────
    public decimal? EstimatedCost { get; private set; }
    public decimal? ActualCost { get; private set; }

    // ── Timeline ──────────────────────────────────────────────────────────────
    public DateTime SubmittedAt { get; private set; }
    public DateTime? AcknowledgedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public DateTime? CancelledAt { get; private set; }

    // ── Resolution notes ─────────────────────────────────────────────────────
    public string? CompletionNotes { get; private set; }
    public string? CancelledReason { get; private set; }

    // ── Audit ─────────────────────────────────────────────────────────────────
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public string CreatedBy { get; private set; } = string.Empty;

    // ── Navigation ────────────────────────────────────────────────────────────
    public Property Property { get; private set; } = null!;
    public Building? Building { get; private set; }
    public Apartment? Apartment { get; private set; }
    public Tenancy? Tenancy { get; private set; }
    public Tenant? Tenant { get; private set; }

    private MaintenanceRequest() { }

    public static MaintenanceRequest Create(
        Guid propertyId,
        MaintenanceCategory category,
        MaintenancePriority priority,
        string title,
        string description,
        string createdBy,
        Guid? buildingId = null,
        Guid? apartmentId = null,
        Guid? tenancyId = null,
        Guid? tenantId = null,
        decimal? estimatedCost = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(description);

        var now = DateTime.UtcNow;
        return new MaintenanceRequest
        {
            Id = Guid.NewGuid(),
            PropertyId = propertyId,
            BuildingId = buildingId,
            ApartmentId = apartmentId,
            TenancyId = tenancyId,
            TenantId = tenantId,
            Category = category,
            Priority = priority,
            Status = MaintenanceStatus.Submitted,
            Title = title.Trim(),
            Description = description.Trim(),
            CreatedBy = createdBy,
            EstimatedCost = estimatedCost,
            SubmittedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    public void Acknowledge(string? assignedTo)
    {
        if (Status != MaintenanceStatus.Submitted)
            throw new InvalidOperationException("Only submitted requests can be acknowledged.");

        Status = MaintenanceStatus.Acknowledged;
        AssignedTo = assignedTo;
        AcknowledgedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateStatus(MaintenanceStatus newStatus, string? notes = null, decimal? actualCost = null, string? assignedTo = null)
    {
        if (Status == MaintenanceStatus.Completed || Status == MaintenanceStatus.Cancelled)
            throw new InvalidOperationException($"Cannot update a {Status} maintenance request.");

        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;

        if (assignedTo is not null) AssignedTo = assignedTo;
        if (actualCost.HasValue) ActualCost = actualCost;

        if (newStatus == MaintenanceStatus.Completed)
        {
            CompletedAt = DateTime.UtcNow;
            CompletionNotes = notes;
        }
    }

    public void Cancel(string reason)
    {
        if (Status == MaintenanceStatus.Completed || Status == MaintenanceStatus.Cancelled)
            throw new InvalidOperationException($"Cannot cancel a {Status} maintenance request.");

        Status = MaintenanceStatus.Cancelled;
        CancelledReason = reason.Trim();
        CancelledAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
