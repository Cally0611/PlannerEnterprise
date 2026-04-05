using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using OfficeOpenXml;
using VaultApi.Models;

namespace VaultApi.Services;

public interface IFileAnalysisService
{
    Task<AnalysisResponse> AnalyseAsync(IFormFile file);
}

public class FileAnalysisService : IFileAnalysisService
{
    private readonly ILogger<FileAnalysisService> _logger;

    // Max rows returned per sheet to avoid sending huge payloads
    private const int MaxRows = 1000;

    public FileAnalysisService(ILogger<FileAnalysisService> logger)
    {
        _logger = logger;
        // EPPlus 7 requires a licence context (NonCommercial is free)
        ExcelPackage.License.SetNonCommercialPersonal("Kalpana");
      
    }

    public async Task<AnalysisResponse> AnalyseAsync(IFormFile file)
    {
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

        var response = new AnalysisResponse
        {
            FileName = file.FileName,
            SizeBytes = file.Length,
        };

        try
        {
            if (ext == ".csv")
            {
                response.FileType = "CSV";
                response.Sheets.Add(await ParseCsvAsync(file));
            }
            else if (ext is ".xlsx" or ".xls")
            {
                response.FileType = ext == ".xlsx" ? "Excel (xlsx)" : "Excel (xls)";
                response.Sheets.AddRange(await ParseExcelAsync(file));
            }
            else
            {
                response.Error = $"Unsupported file type: {ext}. Please upload a .csv, .xlsx, or .xls file.";
                return response;
            }

            response.Success = true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to analyse file {Name}", file.FileName);
            response.Error = $"Failed to parse file: {ex.Message}";
        }

        return response;
    }

    // ── CSV ──────────────────────────────────────────────────────────────────

    private static async Task<SheetResult> ParseCsvAsync(IFormFile file)
    {
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            MissingFieldFound = null,
            BadDataFound = null,
        };

        await using var stream = file.OpenReadStream();
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, config);

        var headers = new List<string>();
        var rows = new List<List<string>>();

        await csv.ReadAsync();
        csv.ReadHeader();

        headers = csv.HeaderRecord?.ToList() ?? new List<string>();

        var rowCount = 0;
        while (await csv.ReadAsync() && rowCount < MaxRows)
        {
            var row = headers.Select((_, i) =>
            {
                csv.TryGetField<string>(i, out var val);
                return val ?? string.Empty;
            }).ToList();

            rows.Add(row);
            rowCount++;
        }

        return new SheetResult
        {
            SheetName = "Sheet1",
            Headers = headers,
            Rows = rows,
            RowCount = rowCount,
            ColumnCount = headers.Count,
        };
    }

    // ── Excel ────────────────────────────────────────────────────────────────

    private static async Task<List<SheetResult>> ParseExcelAsync(IFormFile file)
    {
        var results = new List<SheetResult>();

        await using var stream = file.OpenReadStream();
        using var package = new ExcelPackage(stream);

        foreach (var worksheet in package.Workbook.Worksheets)
        {
            var sheet = new SheetResult { SheetName = worksheet.Name };

            var totalRows = worksheet.Dimension?.Rows ?? 0;
            var totalCols = worksheet.Dimension?.Columns ?? 0;

            if (totalRows == 0 || totalCols == 0)
            {
                sheet.Headers = new List<string>();
                sheet.Rows = new List<List<string>>();
                results.Add(sheet);
                continue;
            }

            // First row as headers
            sheet.Headers = Enumerable.Range(1, totalCols)
                .Select(col => worksheet.Cells[1, col].Text.Trim())
                .ToList();

            // Remaining rows (capped at MaxRows)
            var dataRowCount = Math.Min(totalRows - 1, MaxRows);
            for (var row = 2; row <= dataRowCount + 1; row++)
            {
                var rowData = Enumerable.Range(1, totalCols)
                    .Select(col => worksheet.Cells[row, col].Text)
                    .ToList();
                sheet.Rows.Add(rowData);
            }

            sheet.RowCount = dataRowCount;
            sheet.ColumnCount = totalCols;

            results.Add(sheet);
        }

        return results;
    }
}
