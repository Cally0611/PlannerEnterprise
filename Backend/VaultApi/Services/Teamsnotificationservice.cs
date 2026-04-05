
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using VaultApi.Models;

namespace VaultApi.Services;

public interface ITeamsNotificationService
{
    Task<(bool Success, string Message)> SendSummaryAsync(AnalysisResponse analysis);
}

public class TeamsNotificationService : ITeamsNotificationService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<TeamsNotificationService> _logger;

    public TeamsNotificationService(
        HttpClient http,
        IConfiguration config,
        ILogger<TeamsNotificationService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public async Task<(bool Success, string Message)> SendSummaryAsync(AnalysisResponse analysis)
    {
        var webhookUrl = _config["Teams:WebhookUrl"];

        if (string.IsNullOrWhiteSpace(webhookUrl))
            return (false, "Teams webhook URL is not configured in appsettings.json.");

        try
        {
            var card = BuildAdaptiveCard(analysis);
            var payload = JsonSerializer.Serialize(card);
            var content = new StringContent(payload, Encoding.UTF8, "application/json");

            var response = await _http.PostAsync(webhookUrl, content);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Teams webhook returned {Code}: {Body}", response.StatusCode, body);
                return (false, $"Teams returned {(int)response.StatusCode}: {body}");
            }

            _logger.LogInformation("Teams summary sent for {File}", analysis.FileName);
            return (true, "Summary sent to Teams successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Teams notification");
            return (false, ex.Message);
        }
    }

    // Builds a Teams Adaptive Card payload
    private static object BuildAdaptiveCard(AnalysisResponse analysis)
    {
        var sheet = analysis.Sheets.FirstOrDefault();
        var rows = sheet?.Rows ?? new List<List<string>>();
        var headers = sheet?.Headers ?? new List<string>();

        var targetIdx = FindColIndex(headers, "target");
        var actualIdx = FindColIndex(headers, "actual");
        var machineIdx = FindColIndex(headers, "machine");
        var dateIdx = FindColIndex(headers, "date");

        // Calculate summary stats
        var totalMachines = rows.Count;
        var onTarget = 0;
        var notOnTarget = 0;
        var machineRows = new List<object>();

        foreach (var row in rows)
        {
            if (targetIdx == -1 || actualIdx == -1) break;

            var targetVal = ParseDouble(row, targetIdx);
            var actualVal = ParseDouble(row, actualIdx);
            var machine = machineIdx != -1 ? row[machineIdx] : "Unknown";
            var date = dateIdx != -1 ? row[dateIdx] : "-";
            var isOnTarget = actualVal >= targetVal;

            if (isOnTarget) onTarget++; else notOnTarget++;

            machineRows.Add(new
            {
                type = "TableRow",
                cells = new[]
                {
                    TableCell(machine),
                    TableCell(date),
                    TableCell(targetVal.ToString("N0")),
                    TableCell(actualVal.ToString("N0")),
                    TableCell(isOnTarget ? "✅ On target" : "❌ Not on target"),
                }
            });
        }

        var sentAt = DateTime.Now.ToString("dd MMM yyyy, hh:mm tt");

        // Adaptive Card v1.5 wrapped in O365ConnectorCard format for webhook
        return new
        {
            type = "message",
            attachments = new[]
            {
                new
                {
                    contentType = "application/vnd.microsoft.card.adaptive",
                    content = new
                    {
                        type = "AdaptiveCard",
                        version = "1.5",
                        body = new object[]
                        {
                            // Title
                            new {
                                type = "TextBlock",
                                text = "📊 Daily Production Summary",
                                weight = "Bolder",
                                size = "Large",
                                color = "Accent",
                            },
                            // Subtitle
                            new {
                                type = "TextBlock",
                                text = $"File: **{analysis.FileName}** · Sent at {sentAt}",
                                isSubtle = true,
                                wrap = true,
                                spacing = "None",
                            },
                            // Stat columns
                            new {
                                type = "ColumnSet",
                                spacing = "Medium",
                                columns = new[]
                                {
                                    StatColumn("Total Machines", totalMachines.ToString(), "Default"),
                                    StatColumn("On Target", onTarget.ToString(), "Good"),
                                    StatColumn("Not on Target", notOnTarget.ToString(), notOnTarget > 0 ? "Attention" : "Good"),
                                }
                            },
                            // Divider
                            new { type = "TextBlock", text = "---", separator = true },
                            // Machine table
                            new {
                                type = "Table",
                                gridStyle = "accent",
                                firstRowAsHeader = true,
                                columns = new[]
                                {
                                    new { width = 2 },
                                    new { width = 2 },
                                    new { width = 1 },
                                    new { width = 1 },
                                    new { width = 2 },
                                },
                                rows = new object[]
                                {
                                    // Header row
                                    new {
                                        type = "TableRow",
                                        style = "accent",
                                        cells = new[]
                                        {
                                            TableCell("Machine"),
                                            TableCell("Date"),
                                            TableCell("Target"),
                                            TableCell("Actual"),
                                            TableCell("Status"),
                                        }
                                    }
                                }.Concat(machineRows).ToArray()
                            },
                            // Footer
                            new {
                                type = "TextBlock",
                                text = $"Generated by Vault · {sentAt}",
                                isSubtle = true,
                                size = "Small",
                                spacing = "Medium",
                            }
                        }
                    }
                }
            }
        };
    }

    private static object StatColumn(string label, string value, string color) => new
    {
        type = "Column",
        width = "stretch",
        items = new object[]
        {
            new { type = "TextBlock", text = value, weight = "Bolder", size = "ExtraLarge", color },
            new { type = "TextBlock", text = label, isSubtle = true, spacing = "None", size = "Small" },
        }
    };

    private static object TableCell(string text) => new
    {
        type = "TableCell",
        items = new[] { new { type = "TextBlock", text, wrap = true } }
    };

    private static int FindColIndex(List<string> headers, string keyword) =>
        headers.FindIndex(h => h.Contains(keyword, StringComparison.OrdinalIgnoreCase));

    private static double ParseDouble(List<string> row, int idx) =>
        idx >= 0 && idx < row.Count && double.TryParse(row[idx], out var v) ? v : 0;
}