using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using VaultApi.Models;
using VaultApi.Services;

namespace VaultApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalysisController : ControllerBase
{
    private readonly IFileAnalysisService _analysisService;
    private readonly ILogger<AnalysisController> _logger;

    private static readonly HashSet<string> AllowedExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".csv", ".xlsx", ".xls" };

    public AnalysisController(IFileAnalysisService analysisService, ILogger<AnalysisController> logger)
    {
        _analysisService = analysisService;
        _logger = logger;
    }

    /// <summary>
    /// Accepts a single CSV or Excel file and returns its contents as structured JSON.
    /// Expects multipart/form-data with field name "file".
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(50 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 50 * 1024 * 1024)]
    public async Task<IActionResult> Analyse(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new ErrorResponse { Error = "No file provided." });

        var ext = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(new ErrorResponse
            {
                Error = $"Unsupported file type '{ext}'. Please upload a .csv, .xlsx, or .xls file."
            });

        _logger.LogInformation("Analysing file: {Name} ({Bytes} bytes)", file.FileName, file.Length);

        var result = await _analysisService.AnalyseAsync(file);

        if (!result.Success)
            return UnprocessableEntity(result);

        return Ok(result);
    }
}
