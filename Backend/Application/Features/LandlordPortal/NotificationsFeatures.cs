using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.LandlordPortal;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record AppNotificationDto(
    Guid Id,
    NotificationType Type,
    string Title,
    string Message,
    bool IsRead,
    DateTime? ReadAt,
    string? RelatedEntityType,
    Guid? RelatedEntityId,
    DateTime CreatedAt);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetNotificationsQuery(bool UnreadOnly = false, int Page = 1, int PageSize = 30)
    : IRequest<List<AppNotificationDto>>;

public class GetNotificationsHandler : IRequestHandler<GetNotificationsQuery, List<AppNotificationDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetNotificationsHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<List<AppNotificationDto>> Handle(GetNotificationsQuery req, CancellationToken ct)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userGuid))
            throw new ForbiddenException();

        var query = _db.AppNotifications
            .Where(n => n.UserId == userGuid)
            .AsQueryable();

        if (req.UnreadOnly) query = query.Where(n => !n.IsRead);

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(n => new AppNotificationDto(
                n.Id, n.Type, n.Title, n.Message,
                n.IsRead, n.ReadAt,
                n.RelatedEntityType, n.RelatedEntityId,
                n.CreatedAt))
            .ToListAsync(ct);
    }
}

public record GetUnreadNotificationCountQuery : IRequest<int>;

public class GetUnreadNotificationCountHandler : IRequestHandler<GetUnreadNotificationCountQuery, int>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetUnreadNotificationCountHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<int> Handle(GetUnreadNotificationCountQuery _, CancellationToken ct)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userGuid))
            return 0;

        return await _db.AppNotifications.CountAsync(n => n.UserId == userGuid && !n.IsRead, ct);
    }
}

// ── Commands ──────────────────────────────────────────────────────────────────

public record MarkNotificationReadCommand(Guid Id) : IRequest;

public class MarkNotificationReadHandler : IRequestHandler<MarkNotificationReadCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public MarkNotificationReadHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(MarkNotificationReadCommand cmd, CancellationToken ct)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userGuid))
            throw new ForbiddenException();

        var n = await _db.AppNotifications
            .FirstOrDefaultAsync(x => x.Id == cmd.Id && x.UserId == userGuid, ct)
            ?? throw new NotFoundException(nameof(AppNotification), cmd.Id);

        n.MarkRead();
        await _db.SaveChangesAsync(ct);
    }
}

public record MarkAllNotificationsReadCommand : IRequest;

public class MarkAllNotificationsReadHandler : IRequestHandler<MarkAllNotificationsReadCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public MarkAllNotificationsReadHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(MarkAllNotificationsReadCommand _, CancellationToken ct)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userGuid))
            throw new ForbiddenException();

        var unread = await _db.AppNotifications
            .Where(n => n.UserId == userGuid && !n.IsRead)
            .ToListAsync(ct);

        foreach (var n in unread) n.MarkRead();
        await _db.SaveChangesAsync(ct);
    }
}

public record CreateNotificationCommand(
    Guid UserId,
    NotificationType Type,
    string Title,
    string Message,
    Guid? OwnerId = null,
    string? RelatedEntityType = null,
    Guid? RelatedEntityId = null) : IRequest<Guid>;

public class CreateNotificationHandler : IRequestHandler<CreateNotificationCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public CreateNotificationHandler(IApplicationDbContext db) => _db = db;

    public async Task<Guid> Handle(CreateNotificationCommand cmd, CancellationToken ct)
    {
        var notification = AppNotification.Create(
            cmd.UserId, cmd.Type, cmd.Title, cmd.Message,
            cmd.OwnerId, cmd.RelatedEntityType, cmd.RelatedEntityId);

        _db.AppNotifications.Add(notification);
        await _db.SaveChangesAsync(ct);
        return notification.Id;
    }
}
