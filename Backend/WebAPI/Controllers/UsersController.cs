using MajiLedger.Application.Features.AdminControl;
using MajiLedger.Application.Features.Auth;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/users")]
[Produces("application/json")]
[Authorize(Roles = "Admin")]
public class UsersController(ISender sender) : ControllerBase
{
    public record CreateUserRequest(
        string Email,
        string FullName,
        string PhoneNumber,
        string Password,
        UserRole Role,
        Guid? OwnerId = null,
        List<Guid>? PropertyIds = null);

    public record ResetPasswordRequest(string NewPassword);
    public record AssignRoleRequest(UserRole Role);

    [HttpGet]
    [ProducesResponseType(typeof(List<UserSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var users = await sender.Send(new GetUsersQuery(), ct);
        return Ok(users);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        var id = await sender.Send(new CreateUserCommand(
            request.Email,
            request.FullName,
            request.PhoneNumber,
            request.Password,
            request.Role,
            request.OwnerId,
            request.PropertyIds), ct);

        return CreatedAtAction(nameof(GetAll), new { id }, id);
    }

    [HttpPatch("{id:guid}/toggle-active")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleActive(Guid id, CancellationToken ct)
    {
        var isActive = await sender.Send(new ToggleUserActiveCommand(id), ct);
        return Ok(new { isActive });
    }

    [HttpPost("{id:guid}/reset-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordRequest req, CancellationToken ct)
    {
        await sender.Send(new ResetUserPasswordCommand(id, req.NewPassword), ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/role")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> AssignRole(Guid id, [FromBody] AssignRoleRequest req, CancellationToken ct)
    {
        await sender.Send(new AssignUserRoleCommand(id, req.Role), ct);
        return NoContent();
    }
}
