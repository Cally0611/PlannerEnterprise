using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VaultApi.Models;
using VaultApi.Services;

namespace VaultApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly IFileUploadService _uploadService;
    private readonly ILogger<UploadController> _logger;

    public UploadController(IFileUploadService uploadService, ILogger<UploadController> logger)
    {
        _uploadService = uploadService;
        _logger = logger;
    }

    /// <summary>
    /// Accepts one or more files from the Vault frontend.
    /// Expects multipart/form-data with field name "files".
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(500 * 1024 * 1024)] // 500 MB total request limit
    [RequestFormLimits(MultipartBodyLengthLimit = 500 * 1024 * 1024)]
    public async Task<IActionResult> Upload(IList<IFormFile> files)
    {
        _logger.LogInformation("Upload request received: {Count} file(s)", files.Count);

        var (isValid, errors) = await _uploadService.ValidateFilesAsync(files);

        if (!isValid)
        {
            return BadRequest(new ErrorResponse
            {
                Error = "Validation failed.",
                Details = errors,
            });
        }

        try
        {
            var saved = await _uploadService.SaveFilesAsync(files);

            return Ok(new UploadResponse
            {
                Success = true,
                Message = $"{saved.Count} file{(saved.Count == 1 ? "" : "s")} uploaded successfully.",
                Files = saved,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving uploaded files");
            return StatusCode(500, new ErrorResponse
            {
                Error = "An error occurred while saving the files.",
                Details = new List<string> { ex.Message },
            });
        }
    }

    /// <summary>
    /// Health check — useful for verifying CORS and connectivity from the frontend.
    /// </summary>
    [HttpGet("ping")]
    public IActionResult Ping() => Ok(new { status = "ok", timestamp = DateTime.UtcNow });
}
