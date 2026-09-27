<#
.SYNOPSIS
    Campus Digital Voting Platform - Automated Full Application Build (PowerShell Driver)
.DESCRIPTION
    Builds the React frontend and packages the FastAPI backend into a single executable.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
Set-Location $RootDir

Write-Host "==================================================================" -ForegroundColor Magenta
Write-Host "   Campus Digital Voting Platform - Full Application Build        " -ForegroundColor Magenta
Write-Host "              Single Unified Standalone Executable                " -ForegroundColor Magenta
Write-Host "                     (PowerShell Driver)                          " -ForegroundColor Magenta
Write-Host "==================================================================" -ForegroundColor Magenta
Write-Host ""

# 1. Check prerequisites
Write-Host "[1/4] Checking environment prerequisites..." -ForegroundColor Cyan

$VenvPython = Join-Path $RootDir ".venv\Scripts\python.exe"
if (Test-Path $VenvPython) {
    $PythonExe = $VenvPython
} else {
    $PythonExe = "python"
}
Write-Host "  * Python interpreter: $PythonExe"

$VenvPyInstaller = Join-Path $RootDir ".venv\Scripts\pyinstaller.exe"
if (-not (Test-Path $VenvPyInstaller)) {
    Write-Host "  * PyInstaller not detected. Installing into virtualenv..." -ForegroundColor Yellow
    & $PythonExe -m pip install pyinstaller
}
$PyInstallerExe = $VenvPyInstaller
Write-Host "  * PyInstaller binary: $PyInstallerExe"

# 2. Build Frontend
Write-Host ""
Write-Host "[2/4] Building React Frontend Multi-Portal (Vite)..." -ForegroundColor Cyan
$FrontendDir = Join-Path $RootDir "frontend"
Push-Location $FrontendDir
try {
    npm.cmd run build
} finally {
    Pop-Location
}

$DistIndex = Join-Path $RootDir "frontend\dist\index.html"
$DistSuperadmin = Join-Path $RootDir "frontend\dist\superadmin.html"
if (-not (Test-Path $DistIndex) -or -not (Test-Path $DistSuperadmin)) {
    Write-Host "[ERROR] Frontend build artifacts missing." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Frontend compiled: index.html & superadmin.html in frontend/dist" -ForegroundColor Green

# 3. Package Executable
Write-Host ""
Write-Host "[3/4] Packaging Standalone Executable via PyInstaller..." -ForegroundColor Cyan
$SpecFile = Join-Path $RootDir "CampusVotingPlatform.spec"
$DistDir = Join-Path $RootDir "dist"
$WorkDir = Join-Path $RootDir "build\app"

if (-not (Test-Path $DistDir)) { New-Item -ItemType Directory -Path $DistDir | Out-Null }
if (-not (Test-Path $WorkDir)) { New-Item -ItemType Directory -Path $WorkDir | Out-Null }

& $PyInstallerExe $SpecFile --distpath $DistDir --workpath $WorkDir --noconfirm

# 4. Verify Output
Write-Host ""
Write-Host "[4/4] Verifying generated executable..." -ForegroundColor Cyan
$TargetExe = Join-Path $DistDir "Campus-Voting-Platform.exe"
$AltExe = Join-Path $DistDir "CampusVotingPlatform.exe"

if (-not (Test-Path $TargetExe) -and (Test-Path $AltExe)) {
    Rename-Item -Path $AltExe -NewName "Campus-Voting-Platform.exe"
}

if (Test-Path $TargetExe) {
    $FileSizeMb = [Math]::Round((Get-Item $TargetExe).Length / 1MB, 2)
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host " SUCCESS: Single Executable Application Built Successfully!       " -ForegroundColor Green
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host "  * Final Executable : $TargetExe" -ForegroundColor White
    Write-Host "  * Binary Size      : $FileSizeMb MB" -ForegroundColor White
    Write-Host "  * Embedded Layers  : React Frontend + FastAPI Backend + SQLite Engine" -ForegroundColor White
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host "[ERROR] Target executable not found at $TargetExe" -ForegroundColor Red
    exit 1
}
