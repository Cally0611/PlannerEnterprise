using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using VaultApi.Models;

namespace VaultApi.Services;

public interface IFileUploadService
{
    Task<(bool IsValid, List<string> Errors)> ValidateFilesAsync(IEnumerable<IFormFile> files);
    Task<List<UploadedFileInfo>> SaveFilesAsync(IEnumerable<IFormFile> files);
}

public class FileUploadService : IFileUploadService
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<FileUploadService> _logger;
    private readonly FileUploadOptions _options;

    // Allowed MIME types
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        // Images
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
        // Documents
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        // Text
        "text/plain", "text/csv",
        // Archives
        "application/zip", "application/x-zip-compressed",
    };

    // Allowed file extensions (secondary check)
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".txt", ".csv", ".zip"
    };

    public FileUploadService(
        IWebHostEnvironment env,
        ILogger<FileUploadService> logger,
        FileUploadOptions options)
    {
        _env = env;
        _logger = logger;
        _options = options;
    }

    public Task<(bool IsValid, List<string> Errors)> ValidateFilesAsync(IEnumerable<IFormFile> files)
    {
        var errors = new List<string>();
        var fileList = files.ToList();

        if (fileList.Count == 0)
        {
            errors.Add("No files were provided.");
            return Task.FromResult((false, errors));
        }

        if (fileList.Count > _options.MaxFileCount)
        {
            errors.Add($"Too many files. Maximum allowed: {_options.MaxFileCount}.");
        }

        foreach (var file in fileList)
        {
            if (file.Length == 0)
            {
                errors.Add($"'{file.FileName}' is empty.");
                continue;
            }

            if (file.Length > _options.MaxFileSizeBytes)
            {
                var maxMb = _options.MaxFileSizeBytes / (1024 * 1024);
                errors.Add($"'{file.FileName}' exceeds the {maxMb} MB size limit.");
            }

            var ext = Path.GetExtension(file.FileName);
            if (!AllowedExtensions.Contains(ext))
            {
                errors.Add($"'{file.FileName}' has a disallowed file extension ({ext}).");
            }

            if (!AllowedContentTypes.Contains(file.ContentType))
            {
                errors.Add($"'{file.FileName}' has a disallowed content type ({file.ContentType}).");
            }
        }

        return Task.FromResult((!errors.Any(), errors));
    }

    public async Task<List<UploadedFileInfo>> SaveFilesAsync(IEnumerable<IFormFile> files)
    {
        var uploadPath = Path.Combine(_env.ContentRootPath, _options.StoragePath);
        Directory.CreateDirectory(uploadPath);

        var results = new List<UploadedFileInfo>();

        foreach (var file in files)
        {
            var originalName = Path.GetFileName(file.FileName); // strips path traversal
            var ext = Path.GetExtension(originalName);
            var storedName = $"{Guid.NewGuid():N}{ext}";
            var fullPath = Path.Combine(uploadPath, storedName);

            await using var stream = new FileStream(fullPath, FileMode.Create, FileAccess.Write);
            await file.CopyToAsync(stream);

            _logger.LogInformation("Saved upload: {Original} -> {Stored} ({Bytes} bytes)",
                originalName, storedName, file.Length);

            results.Add(new UploadedFileInfo
            {
                FileName = originalName,
                StoredFileName = storedName,
                SizeBytes = file.Length,
                ContentType = file.ContentType,
                UploadedAt = DateTime.UtcNow,
                Url = $"/uploads/{storedName}",
            });
        }

        return results;
    }
}

public class FileUploadOptions
{
    public const string Section = "FileUpload";

    public long MaxFileSizeBytes { get; set; } = 50 * 1024 * 1024; // 50 MB
    public int MaxFileCount { get; set; } = 10;
    public string StoragePath { get; set; } = "uploads";
}
