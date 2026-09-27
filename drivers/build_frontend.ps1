<#
.SYNOPSIS
    Campus Digital Voting Platform - Automated Frontend & Desktop Packaging (PowerShell Driver)
.DESCRIPTION
    Compiles React frontend multi-portal, packages into a standalone PyWebView native desktop executable.
.PARAMETER ObfuscationMode
    0 = Obfuscated (PyArmor + PyInstaller), 1 = Direct (PyInstaller only, default)
#>

[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [ValidateSet(0, 1)]
    [int]$ObfuscationMode = 1
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
Set-Location $RootDir

Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "   Campus Digital Voting Platform - Frontend & Desktop Build   " -ForegroundColor Magenta
Write-Host "              Single Unified Standalone Executable              " -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
if ($ObfuscationMode -eq 0) {
    Write-Host " Build Mode: [0] OBFUSCATED (PyArmor + PyInstaller)" -ForegroundColor Yellow
} else {
    Write-Host " Build Mode: [1] DIRECT / UNOBFUSCATED (PyInstaller only)" -ForegroundColor Cyan
}
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""

$VenvScripts = Join-Path $RootDir ".venv\Scripts"
$PyInstaller = Join-Path $VenvScripts "pyinstaller.exe"
$PyArmor = Join-Path $VenvScripts "pyarmor.exe"
$Python = Join-Path $VenvScripts "python.exe"

if (-not (Test-Path $Python)) {
    $Python = (Get-Command python -ErrorAction SilentlyContinue).Source
}

if (-not (Test-Path $PyInstaller)) {
    Write-Host "[1/5] Installing PyInstaller..." -ForegroundColor Cyan
    & $Python -m pip install pyinstaller
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install PyInstaller"
        exit 1
    }
}

# 1. Compile React SPA
Write-Host "[1/5] Compiling React Multi-Portal (npm run build)..." -ForegroundColor Cyan
$FrontendDir = Join-Path $RootDir "frontend"
Push-Location $FrontendDir
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "npm run build failed with exit code $LASTEXITCODE"
    }
} finally {
    Pop-Location
}

# 2. Sync dist_frontend
Write-Host "[2/5] Refreshing dist_frontend folder..." -ForegroundColor Cyan
$DistFrontend = Join-Path $RootDir "dist_frontend"
$FrontendDist = Join-Path $RootDir "frontend\dist"
if (Test-Path $DistFrontend) {
    Remove-Item -Recurse -Force $DistFrontend
}
New-Item -ItemType Directory -Path $DistFrontend -Force | Out-Null
Copy-Item -Recurse -Force "$FrontendDist\*" $DistFrontend

# 3. Clean build_obf
Write-Host "[3/5] Cleaning build_obf folder..." -ForegroundColor Cyan
$BuildObf = Join-Path $RootDir "build_obf"
if (Test-Path $BuildObf) {
    Remove-Item -Recurse -Force $BuildObf
}

# 4. PyArmor Obfuscation
if ($ObfuscationMode -eq 0 -and (Test-Path $PyArmor)) {
    Write-Host "[4/5] Obfuscating app_launcher.py via PyArmor..." -ForegroundColor Cyan
    $EntryScript = Join-Path $RootDir "app_launcher.py"
    & $PyArmor gen -O $BuildObf $EntryScript
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "PyArmor obfuscation encountered an error. Proceeding directly."
    }
} else {
    Write-Host "[4/5] [SKIPPED] PyArmor obfuscation skipped (Mode 1: Direct build)" -ForegroundColor Yellow
}

# 5. PyInstaller Packaging
Write-Host "[5/5] Building standalone Desktop Executable with PyInstaller..." -ForegroundColor Cyan
$DistFolder = Join-Path $RootDir "dist"
$SpecFile = Join-Path $RootDir "CampusVotingPlatform.spec"
if (-not (Test-Path $DistFolder)) {
    New-Item -ItemType Directory -Path $DistFolder -Force | Out-Null
}

& $PyInstaller $SpecFile --distpath $DistFolder --noconfirm
if ($LASTEXITCODE -ne 0) {
    Write-Error "PyInstaller build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

$ExePath = Join-Path $DistFolder "Campus-Voting-Platform.exe"
if (Test-Path $ExePath) {
    $SizeMB = [Math]::Round((Get-Item $ExePath).Length / 1MB, 2)
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host " SUCCESS: Desktop Native Executable Built Successfully!        " -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "  * Executable : $ExePath ($SizeMB MB)" -ForegroundColor Green
    Write-Host "  * Native UI  : PyWebView Window (Zero Browser Spawns)" -ForegroundColor Green
    Write-Host "  * Networking : Remote HTTP Proxy (Zero Local Database)" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Warning "Build completed but target executable not found at $ExePath"
}
