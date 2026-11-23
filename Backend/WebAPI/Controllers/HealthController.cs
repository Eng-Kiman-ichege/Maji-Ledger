using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Controllers;

/// <summary>
/// Simple health-check controller. Also mapped via app.MapHealthChecks("/health").
/// </summary>
[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class HealthController : ControllerBase
{
    /// <summary>Returns a simple liveness response confirming the API is running.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult Get()
    {
        return Ok(new
        {
            status  = "healthy",
            service = "PropertyLedger API",
            version = "1.0.0",
            utc     = DateTime.UtcNow
        });
    }
}
