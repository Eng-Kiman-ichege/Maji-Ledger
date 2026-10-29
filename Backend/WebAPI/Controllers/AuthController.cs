using MajiLedger.Application.Features.Auth;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

[ApiController]
[Route("api/v1/auth")]
[Produces("application/json")]
public class AuthController(ISender sender) : ControllerBase
{
    public record LoginRequest(string Email, string Password);

    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new LoginCommand(request.Email, request.Password), ct);
        return Ok(result);
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUser(CancellationToken ct)
    {
        var user = await sender.Send(new GetCurrentUserQuery(), ct);
        if (user == null) return Unauthorized();
        return Ok(user);
    }

    [HttpPost("seed-admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SeedAdmin(CancellationToken ct)
    {
        await sender.Send(new SeedDefaultAdminCommand(), ct);
        return Ok(new { message = "Default administrator verified / created." });
    }

    [HttpPost("seed-demo")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SeedDemo(CancellationToken ct)
    {
        await sender.Send(new SeedDemoDataCommand(), ct);
        return Ok(new { message = "Demonstration dataset seeded successfully: 3 properties, buildings, smart meters, payments, and owner accounts." });
    }
}
