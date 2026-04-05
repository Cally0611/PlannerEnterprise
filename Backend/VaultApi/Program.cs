using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.IO;
using VaultApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Required for EPPlus free licence

OfficeOpenXml.ExcelPackage.License.SetNonCommercialPersonal("Kalpana");
// ── Services ────────────────────────────────────────────────────────────────

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Vault Upload API", Version = "v1" });
});

// File upload options
var uploadOptions = builder.Configuration
    .GetSection(FileUploadOptions.Section)
    .Get<FileUploadOptions>() ?? new FileUploadOptions();

builder.Services.AddSingleton(uploadOptions);
builder.Services.AddScoped<IFileUploadService, FileUploadService>();
builder.Services.AddScoped<IFileAnalysisService, FileAnalysisService>();
//For Teams Alert
builder.Services.AddHttpClient<ITeamsNotificationService, TeamsNotificationService>();

// CORS — allow the Vite dev server and any configured origins
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("VaultFrontend", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Increase Kestrel limits to match our upload size cap
builder.WebHost.ConfigureKestrel(k =>
{
    k.Limits.MaxRequestBodySize = 500 * 1024 * 1024; // 500 MB
});

// ── App pipeline ────────────────────────────────────────────────────────────

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("VaultFrontend");
//app.UseHttpsRedirection();

// Serve uploaded files as static content from /uploads/*
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, uploadOptions.StoragePath);
Directory.CreateDirectory(uploadsPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads",
});

app.MapControllers();

app.Run();
