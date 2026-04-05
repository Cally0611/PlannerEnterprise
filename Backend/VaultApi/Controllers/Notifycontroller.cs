using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using VaultApi.Models;
using VaultApi.Services;

namespace VaultApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotifyController : ControllerBase
{
    private readonly ITeamsNotificationService _teams;
    private readonly ILogger<NotifyController> _logger;

    public NotifyController(ITeamsNotificationService teams, ILogger<NotifyController> logger)
    {
        _teams = teams;
        _logger = logger;
    }

    /// <summary>
    /// Accepts the analysis result from the frontend and sends a summary to Teams.
    /// POST /api/notify/teams
    /// </summary>
    [HttpPost("teams")]
    public async Task<IActionResult> SendToTeams([FromBody] AnalysisResponse analysis)
    {
        if (analysis is null || analysis.Sheets.Count == 0)
            return BadRequest(new ErrorResponse { Error = "No analysis data provided." });

        var (success, message) = await _teams.SendSummaryAsync(analysis);

        if (!success)
            return StatusCode(500, new ErrorResponse { Error = message });

        return Ok(new { message });
    }
}