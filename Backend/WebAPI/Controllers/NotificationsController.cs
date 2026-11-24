using MajiLedger.Application.Features.LandlordPortal;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/notifications")]
[Produces("application/json")]
[Authorize]
public class NotificationsController(ISender sender) : ControllerBase
{
    /// <summary>Gets notifications for the authenticated user.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<AppNotificationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool unreadOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        CancellationToken ct = default)
    {
        var result = await sender.Send(new GetNotificationsQuery(unreadOnly, page, pageSize), ct);
        return Ok(result);
    }

    /// <summary>Gets the unread notification count.</summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
    {
        var count = await sender.Send(new GetUnreadNotificationCountQuery(), ct);
        return Ok(new { count });
    }

    /// <summary>Marks a single notification as read.</summary>
    [HttpPut("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        await sender.Send(new MarkNotificationReadCommand(id), ct);
        return NoContent();
    }

    /// <summary>Marks all notifications as read for the current user.</summary>
    [HttpPut("all/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        await sender.Send(new MarkAllNotificationsReadCommand(), ct);
        return NoContent();
    }
}
