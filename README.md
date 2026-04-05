# Vault — Production File Upload & Analysis System

A full-stack application for uploading CSV/Excel files, analysing production data, and sending daily summaries to Microsoft Teams.
[Link]([https://1drv.ms/v/c/a0d8154fcc783135/IQAZj4anPsKESZ1S-4WMa5AwAUV1DZi--LaT84-7sK0T-yU?e=lEKcZh])
---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (.NET API)](#backend-setup-net-api)
  - [Frontend Setup (React)](#frontend-setup-react)
- [Configuration](#configuration)
- [Features](#features)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Overview

Vault allows plant operators to:

1. **Log in** with their credentials
2. **Upload** CSV or Excel production files
3. **Analyse** the file — viewing a table of machine targets vs actuals with on-target / not-on-target indicators
4. **Filter** the table by Date, Machine, or Status
5. **Send** a formatted daily summary card to a Microsoft Teams channel

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 (JSX), Vite 4 |
| Backend | .NET 8, ASP.NET Core MVC |
| Excel parsing | EPPlus 8 |
| CSV parsing | CsvHelper 33 |
| Notifications | Microsoft Teams Incoming Webhook (Adaptive Cards) |

---

## Project Structure

```
/
├── VaultApi/                            .NET 8 backend
│   ├── Controllers/
│   │   ├── UploadController.cs          POST /api/upload
│   │   ├── AnalysisController.cs        POST /api/analysis
│   │   └── NotifyController.cs          POST /api/notify/teams
│   ├── Models/
│   │   ├── UploadModels.cs
│   │   └── AnalysisModels.cs
│   ├── Services/
│   │   ├── FileUploadService.cs         File validation + disk storage
│   │   ├── FileAnalysisService.cs       CSV + Excel parsing
│   │   └── TeamsNotificationService.cs  Adaptive Card builder + sender
│   ├── Program.cs
│   ├── appsettings.json
│   └── VaultApi.csproj
│
└── vault-app-jsx/                       React frontend
    ├── src/
    │   ├── components/
    │   │   ├── Logo.jsx
    │   │   ├── InputField.jsx
    │   │   ├── FileItem.jsx
    │   │   └── AnalysisResult.jsx       Table + filters + Teams button
    │   ├── hooks/
    │   │   ├── useUpload.js             File upload state + XHR progress
    │   │   ├── useAnalysis.js           File analysis API call
    │   │   └── useTeamsNotify.js        Teams notification API call
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   └── UploadPage.jsx
    │   └── App.jsx
    ├── .env.example
    └── package.json
```

---

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/) and npm
- Visual Studio 2022

---

### Backend Setup (.NET API)

1. Open `VaultApi/VaultApi.csproj` in Visual Studio 2022
2. Visual Studio will automatically restore NuGet packages (EPPlus, CsvHelper)
3. Open `appsettings.json` and update settings (see Configuration below)
4. Select the **http** profile from the run button dropdown
5. Press **Ctrl+F5** to start

The API port will be shown in the Visual Studio Output window.

> Make sure `UseHttpsRedirection` is commented out in `Program.cs`:
> ```csharp
> // app.UseHttpsRedirection();
> ```

---

### Frontend Setup (React)

1. Navigate to the `vault-app-jsx` folder in a terminal
2. Copy the env file and set your API port:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:YOUR_PORT
```

3. Install and run:

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Configuration

All backend settings live in `VaultApi/appsettings.json`.

**CORS** — add your frontend origin:
```json
"Cors": {
  "AllowedOrigins": ["http://localhost:5173"]
}
```

**File upload limits:**
```json
"FileUpload": {
  "MaxFileSizeBytes": 52428800,
  "MaxFileCount": 10,
  "StoragePath": "uploads"
}
```

**Teams webhook:**
```json
"Teams": {
  "WebhookUrl": "https://yourcompany.webhook.office.com/webhookb2/..."
}
```

To get your webhook URL: Teams channel → **...** → **Manage channel** → **Connectors** → **Incoming Webhook** → **Add** → copy the URL.

> Incoming Webhooks require a Microsoft 365 organisational account. Personal Microsoft accounts are not supported.

---

## Features

### Login
- Email and password with client-side validation
- Demo user mode for quick access

### File Upload
- Drag and drop or browse to select files
- Real upload progress bar
- Supported: CSV, XLSX, XLS, PDF, images, Word, ZIP (up to 50 MB each)

### File Analysis
- Parses CSV and Excel files (all sheets)
- Paginated table — 50 rows per page, up to 1000 rows per sheet
- Auto-detects Target and Actual columns and adds:
  - **Status column** — On target / Not on target
  - **Indicator column** — green or red badge
- **Filters** on Date and Machine — dropdown selection + text search
- Active filter count with one-click clear all

### Teams Notification
- "Send summary to Teams" button after analysis
- Sends an Adaptive Card with:
  - Summary stats: Total Machines, On Target, Not on Target
  - Full machine table with Date, Target, Actual, Status
  - Timestamp

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/upload/ping` | Health check |
| POST | `/api/upload` | Upload files (`multipart/form-data`, field: `files`) |
| GET | `/uploads/{filename}` | Retrieve a stored file |
| POST | `/api/analysis` | Analyse CSV/Excel (`multipart/form-data`, field: `file`) |
| POST | `/api/notify/teams` | Send analysis summary to Teams (`application/json`) |

Swagger UI is available at `/swagger` when running in Development mode.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Network error. Is the server running?" | Check the port in `.env` matches the API. Visit `/api/upload/ping` in browser to confirm. |
| CORS error in browser | Add `http://localhost:5173` to `Cors.AllowedOrigins` in `appsettings.json` |
| HTTPS redirect breaking requests | Comment out `app.UseHttpsRedirection()` in `Program.cs`. Use the **http** launch profile. |
| "Failed to fetch" on analysis | Ensure `VITE_API_URL` in `.env` is correct. Restart Vite after any `.env` change. |
| EPPlus licence error | Add to `Program.cs`: `OfficeOpenXml.ExcelPackage.License.SetNonCommercialPersonal("YourName");` |
| Teams message not sending | Verify the webhook URL in `appsettings.json`. Test via Swagger at `/swagger`. |
