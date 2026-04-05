# VaultApi — .NET Core MVC 8.0

File upload API backend for the Vault React frontend.

## Requirements

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

## Run

```bash
cd VaultApi
dotnet run
# API available at http://localhost:5000
# Swagger UI at http://localhost:5000/swagger
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload` | Upload one or more files (`multipart/form-data`, field: `files`) |
| GET | `/api/upload/ping` | Health check |
| GET | `/uploads/{filename}` | Serve a previously uploaded file |

## Configuration — appsettings.json

```json
"FileUpload": {
  "MaxFileSizeBytes": 52428800,   // 50 MB per file
  "MaxFileCount": 10,             // max files per request
  "StoragePath": "uploads"        // folder relative to project root
},
"Cors": {
  "AllowedOrigins": [
    "http://localhost:5173",       // Vite dev server
    "http://localhost:3000"
  ]
}
```

## Project structure

```
VaultApi/
├── Controllers/
│   └── UploadController.cs     # POST /api/upload, GET /api/upload/ping
├── Models/
│   └── UploadModels.cs         # UploadResponse, UploadedFileInfo, ErrorResponse
├── Services/
│   └── FileUploadService.cs    # Validation + disk storage logic
├── Program.cs                  # App bootstrap (CORS, static files, Swagger)
├── appsettings.json
└── VaultApi.csproj
```

## Connecting a real storage backend

`FileUploadService.SaveFilesAsync` writes files to local disk by default.
To swap in Azure Blob Storage, S3, etc., implement `IFileUploadService` and
register your implementation in `Program.cs`:

```csharp
builder.Services.AddScoped<IFileUploadService, AzureBlobUploadService>();
```
