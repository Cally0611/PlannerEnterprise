using System.Collections.Generic;

namespace VaultApi.Models;

public class AnalysisResponse
{
    public bool Success { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public List<SheetResult> Sheets { get; set; } = new();
    public string? Error { get; set; }
}

public class SheetResult
{
    public string SheetName { get; set; } = string.Empty;
    public int RowCount { get; set; }
    public int ColumnCount { get; set; }
    public List<string> Headers { get; set; } = new();
    public List<List<string>> Rows { get; set; } = new();
}
