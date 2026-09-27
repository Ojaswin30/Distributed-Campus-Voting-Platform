@echo off
setlocal enabledelayedexpansion

REM ==============================================================================
REM Campus Digital Voting Platform - Automated Full Build (Native CMD Driver)
REM Pure Windows Command Prompt execution. ZERO PowerShell dependency.
REM ==============================================================================

set "DRIVERS_DIR=%~dp0"
pushd "%DRIVERS_DIR%.."
set "ROOT_DIR=%CD%"
popd
cd /d "%ROOT_DIR%"

echo ==================================================================
echo    Campus Digital Voting Platform - Full Application Build        
echo               Single Unified Standalone Executable                
echo                      (Native CMD Driver)                          
echo ==================================================================
echo.

set "PY_EXE=%ROOT_DIR%\.venv\Scripts\python.exe"
set "PYINSTALLER=%ROOT_DIR%\.venv\Scripts\pyinstaller.exe"

if not exist "%PY_EXE%" (
    set "PY_EXE=python"
)

if not exist "%PYINSTALLER%" (
    echo [1/4] Installing PyInstaller into Python environment...
    "%PY_EXE%" -m pip install pyinstaller
)

echo.
echo [2/4] Building React Frontend Multi-Portal (Vite)...
cd /d "%ROOT_DIR%\frontend"
call npm.cmd run build
if !ERRORLEVEL! NEQ 0 (
    echo [ERROR] Frontend build failed.
    cd /d "%ROOT_DIR%"
    exit /b 1
)
cd /d "%ROOT_DIR%"

echo.
echo [3/4] Packaging Standalone Executable via PyInstaller...
set "DIST_DIR=%ROOT_DIR%\dist"
set "WORK_DIR=%ROOT_DIR%\build\app"

if not exist "%DIST_DIR%" mkdir "%DIST_DIR%"
if not exist "%WORK_DIR%" mkdir "%WORK_DIR%"

"%PYINSTALLER%" "%ROOT_DIR%\CampusVotingPlatform.spec" --distpath "%DIST_DIR%" --workpath "%WORK_DIR%" --noconfirm
if !ERRORLEVEL! NEQ 0 (
    echo [ERROR] PyInstaller packaging failed.
    exit /b 1
)

echo.
echo [4/4] Verifying generated executable...
set "TARGET_EXE=%DIST_DIR%\Campus-Voting-Platform.exe"
set "ALT_EXE=%DIST_DIR%\CampusVotingPlatform.exe"

if not exist "%TARGET_EXE%" (
    if exist "%ALT_EXE%" (
        move /y "%ALT_EXE%" "%TARGET_EXE%" >nul
    )
)

if exist "%TARGET_EXE%" (
    echo.
    echo ==================================================================
    echo  SUCCESS: Single Executable Application Built Successfully!
    echo ==================================================================
    echo   * Final Executable : %TARGET_EXE%
    echo   * Embedded Layers  : React Frontend + FastAPI Backend + SQLite
    echo ==================================================================
    echo.
    exit /b 0
) else (
    echo [ERROR] Executable was not found at %TARGET_EXE%
    exit /b 1
)
