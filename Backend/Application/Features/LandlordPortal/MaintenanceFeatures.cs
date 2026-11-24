using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.LandlordPortal;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record MaintenanceRequestDto(
    Guid Id,
    Guid PropertyId,
    string PropertyName,
    Guid? BuildingId,
    string? BuildingName,
    Guid? ApartmentId,
    string? UnitNumber,
    Guid? TenancyId,
    Guid? TenantId,
    string? TenantName,
    MaintenanceCategory Category,
    MaintenancePriority Priority,
    MaintenanceStatus Status,
    string Title,
    string Description,
    string? AssignedTo,
    decimal? EstimatedCost,
    decimal? ActualCost,
    DateTime SubmittedAt,
    DateTime? AcknowledgedAt,
    DateTime? CompletedAt,
    string? CompletionNotes,
    string? CancelledReason,
    string CreatedBy,
    DateTime CreatedAt,
    DateTime UpdatedAt);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetMaintenanceRequestsQuery(
    Guid? PropertyId,
    Guid? ApartmentId,
    MaintenanceStatus? Status,
    MaintenancePriority? Priority,
    MaintenanceCategory? Category,
    int Page = 1,
    int PageSize = 20) : IRequest<List<MaintenanceRequestDto>>;

public class GetMaintenanceRequestsHandler : IRequestHandler<GetMaintenanceRequestsQuery, List<MaintenanceRequestDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetMaintenanceRequestsHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<List<MaintenanceRequestDto>> Handle(GetMaintenanceRequestsQuery req, CancellationToken ct)
    {
        var query = _db.MaintenanceRequests
            .Include(m => m.Property)
            .Include(m => m.Building)
            .Include(m => m.Apartment)
            .Include(m => m.Tenant)
            .AsQueryable();

        // Scope to authorized properties
        if (!_currentUser.IsInRole("Admin"))
        {
            var authorizedIds = _currentUser.AuthorizedPropertyIds;
            query = query.Where(m => authorizedIds.Contains(m.PropertyId));
        }

        if (req.PropertyId.HasValue)
            query = query.Where(m => m.PropertyId == req.PropertyId.Value);

        if (req.ApartmentId.HasValue)
            query = query.Where(m => m.ApartmentId == req.ApartmentId.Value);

        if (req.Status.HasValue)
            query = query.Where(m => m.Status == req.Status.Value);

        if (req.Priority.HasValue)
            query = query.Where(m => m.Priority == req.Priority.Value);

        if (req.Category.HasValue)
            query = query.Where(m => m.Category == req.Category.Value);

        return await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(m => new MaintenanceRequestDto(
                m.Id,
                m.PropertyId,
                m.Property.Name,
                m.BuildingId,
                m.Building != null ? m.Building.Name : null,
                m.ApartmentId,
                m.Apartment != null ? m.Apartment.UnitNumber : null,
                m.TenancyId,
                m.TenantId,
                m.Tenant != null ? m.Tenant.FirstName + " " + m.Tenant.LastName : null,
                m.Category,
                m.Priority,
                m.Status,
                m.Title,
                m.Description,
                m.AssignedTo,
                m.EstimatedCost,
                m.ActualCost,
                m.SubmittedAt,
                m.AcknowledgedAt,
                m.CompletedAt,
                m.CompletionNotes,
                m.CancelledReason,
                m.CreatedBy,
                m.CreatedAt,
                m.UpdatedAt))
            .ToListAsync(ct);
    }
}

public record GetMaintenanceRequestByIdQuery(Guid Id) : IRequest<MaintenanceRequestDto>;

public class GetMaintenanceRequestByIdHandler : IRequestHandler<GetMaintenanceRequestByIdQuery, MaintenanceRequestDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetMaintenanceRequestByIdHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<MaintenanceRequestDto> Handle(GetMaintenanceRequestByIdQuery req, CancellationToken ct)
    {
        var m = await _db.MaintenanceRequests
            .Include(x => x.Property)
            .Include(x => x.Building)
            .Include(x => x.Apartment)
            .Include(x => x.Tenant)
            .FirstOrDefaultAsync(x => x.Id == req.Id, ct)
            ?? throw new NotFoundException(nameof(MaintenanceRequest), req.Id);

        if (!_currentUser.IsInRole("Admin") && !_currentUser.HasPropertyAccess(m.PropertyId))
            throw new ForbiddenException();

        return new MaintenanceRequestDto(
            m.Id, m.PropertyId, m.Property.Name,
            m.BuildingId, m.Building?.Name,
            m.ApartmentId, m.Apartment?.UnitNumber,
            m.TenancyId, m.TenantId,
            m.Tenant != null ? m.Tenant.FirstName + " " + m.Tenant.LastName : null,
            m.Category, m.Priority, m.Status,
            m.Title, m.Description, m.AssignedTo,
            m.EstimatedCost, m.ActualCost,
            m.SubmittedAt, m.AcknowledgedAt, m.CompletedAt,
            m.CompletionNotes, m.CancelledReason,
            m.CreatedBy, m.CreatedAt, m.UpdatedAt);
    }
}

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreateMaintenanceRequestCommand(
    Guid PropertyId,
    Guid? BuildingId,
    Guid? ApartmentId,
    Guid? TenancyId,
    Guid? TenantId,
    MaintenanceCategory Category,
    MaintenancePriority Priority,
    string Title,
    string Description,
    decimal? EstimatedCost) : IRequest<Guid>;

public class CreateMaintenanceRequestHandler : IRequestHandler<CreateMaintenanceRequestCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CreateMaintenanceRequestHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateMaintenanceRequestCommand cmd, CancellationToken ct)
    {
        if (!_currentUser.IsInRole("Admin") && !_currentUser.HasPropertyAccess(cmd.PropertyId))
            throw new ForbiddenException();

        var propertyExists = await _db.Properties.AnyAsync(p => p.Id == cmd.PropertyId, ct);
        if (!propertyExists) throw new NotFoundException(nameof(Property), cmd.PropertyId);

        var request = MaintenanceRequest.Create(
            cmd.PropertyId,
            cmd.Category,
            cmd.Priority,
            cmd.Title,
            cmd.Description,
            _currentUser.UserId ?? "system",
            cmd.BuildingId,
            cmd.ApartmentId,
            cmd.TenancyId,
            cmd.TenantId,
            cmd.EstimatedCost);

        _db.MaintenanceRequests.Add(request);
        await _db.SaveChangesAsync(ct);
        return request.Id;
    }
}

public record AcknowledgeMaintenanceCommand(Guid Id, string? AssignedTo) : IRequest;

public class AcknowledgeMaintenanceHandler : IRequestHandler<AcknowledgeMaintenanceCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public AcknowledgeMaintenanceHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(AcknowledgeMaintenanceCommand cmd, CancellationToken ct)
    {
        var req = await _db.MaintenanceRequests.FirstOrDefaultAsync(x => x.Id == cmd.Id, ct)
            ?? throw new NotFoundException(nameof(MaintenanceRequest), cmd.Id);

        if (!_currentUser.IsInRole("Admin") && !_currentUser.HasPropertyAccess(req.PropertyId))
            throw new ForbiddenException();

        req.Acknowledge(cmd.AssignedTo);
        await _db.SaveChangesAsync(ct);
    }
}

public record UpdateMaintenanceStatusCommand(
    Guid Id,
    MaintenanceStatus Status,
    string? Notes,
    decimal? ActualCost,
    string? AssignedTo) : IRequest;

public class UpdateMaintenanceStatusHandler : IRequestHandler<UpdateMaintenanceStatusCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public UpdateMaintenanceStatusHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(UpdateMaintenanceStatusCommand cmd, CancellationToken ct)
    {
        var req = await _db.MaintenanceRequests.FirstOrDefaultAsync(x => x.Id == cmd.Id, ct)
            ?? throw new NotFoundException(nameof(MaintenanceRequest), cmd.Id);

        if (!_currentUser.IsInRole("Admin") && !_currentUser.HasPropertyAccess(req.PropertyId))
            throw new ForbiddenException();

        req.UpdateStatus(cmd.Status, cmd.Notes, cmd.ActualCost, cmd.AssignedTo);
        await _db.SaveChangesAsync(ct);
    }
}

public record CancelMaintenanceRequestCommand(Guid Id, string Reason) : IRequest;

public class CancelMaintenanceRequestHandler : IRequestHandler<CancelMaintenanceRequestCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CancelMaintenanceRequestHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(CancelMaintenanceRequestCommand cmd, CancellationToken ct)
    {
        var req = await _db.MaintenanceRequests.FirstOrDefaultAsync(x => x.Id == cmd.Id, ct)
            ?? throw new NotFoundException(nameof(MaintenanceRequest), cmd.Id);

        if (!_currentUser.IsInRole("Admin") && !_currentUser.HasPropertyAccess(req.PropertyId))
            throw new ForbiddenException();

        req.Cancel(cmd.Reason);
        await _db.SaveChangesAsync(ct);
    }
}
