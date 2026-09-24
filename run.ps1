# Campus Digital Voting Platform - PowerShell Launcher
$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Campus Digital Voting Platform - Service Launcher    " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Determine Python Executable
$VenvPython = Join-Path $RootDir ".venv\Scripts\python.exe"
if (Test-Path $VenvPython) {
    $PythonExe = $VenvPython
    Write-Host "[OK] Using Python Virtual Environment: .venv\Scripts\python.exe" -ForegroundColor Green
} else {
    $PythonExe = "python"
    Write-Host "[INFO] Virtual Environment not detected, using system Python." -ForegroundColor Yellow
}

# 1. Start Backend in separate window
Write-Host "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootDir\backend'; & '$PythonExe' -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

# 2. Start Frontend in separate window
Write-Host "[2/2] Starting Vite Frontend on http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootDir\frontend'; npm run dev"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  All services have been started in separate windows!   " -ForegroundColor Green
Write-Host ""
Write-Host "  * Backend API:    http://127.0.0.1:8000               " -ForegroundColor White
Write-Host "  * API Docs:       http://127.0.0.1:8000/docs          " -ForegroundColor White
Write-Host "  * Frontend UI:    http://localhost:5173               " -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
