using MajiLedger.Application.Features.Auth;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/users")]
[Produces("application/json")]
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
}
