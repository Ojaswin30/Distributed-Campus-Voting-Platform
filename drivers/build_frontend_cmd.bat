@echo off
setlocal enabledelayedexpansion

REM ==============================================================================
REM Campus Digital Voting Platform - Automated Build & Packaging (Native CMD Driver)
REM Pure Windows Command Prompt execution. ZERO PowerShell dependency.
REM
REM Usage:
REM   build_frontend_cmd.bat                     (Default: Mode 1 Direct build)
REM   build_frontend_cmd.bat -ObfuscationMode 0  (Mode 0 Obfuscated build)
REM   build_frontend_cmd.bat --mode 1            (Mode 1 Direct build)
REM ==============================================================================

set "DRIVERS_DIR=%~dp0"
pushd "%DRIVERS_DIR%.."
set "ROOT_DIR=%CD%"
popd
cd /d "%ROOT_DIR%"

set "OBF_MODE=1"

:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="-ObfuscationMode" (
    set "OBF_MODE=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--ObfuscationMode" (
    set "OBF_MODE=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--mode" (
    set "OBF_MODE=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-m" (
    set "OBF_MODE=%~2"
    shift
    shift
    goto :parse_args
)
if "%~1"=="0" (
    set "OBF_MODE=0"
    shift
    goto :parse_args
)
if "%~1"=="1" (
    set "OBF_MODE=1"
    shift
    goto :parse_args
)
shift
goto :parse_args
:args_done

echo ================================================================
echo    Campus Digital Voting Platform - Build ^& Packaging
echo                       (CMD Driver)                       
echo ================================================================
if "%OBF_MODE%"=="0" (
    echo  Build Mode: [0] OBFUSCATED (PyArmor + PyInstaller)
) else (
    echo  Build Mode: [1] DIRECT / UNOBFUSCATED (PyInstaller only)
)
echo ================================================================

set "PYINSTALLER=%ROOT_DIR%\.venv\Scripts\pyinstaller.exe"
set "PYARMOR=%ROOT_DIR%\.venv\Scripts\pyarmor.exe"

if not exist "%PYINSTALLER%" (
    echo.
    echo [ERROR] PyInstaller not found at %PYINSTALLER%
    echo Please make sure .venv is configured.
    goto :error
)

REM 1. Build React SPA
echo.
echo [1/5] Compiling React Multi-Portal (npm run build)...
pushd "%ROOT_DIR%\frontend"
call npm run build
if !ERRORLEVEL! NEQ 0 (
    popd
    echo [ERROR] npm run build failed.
    goto :error
)
popd

REM 2. Clean & synchronize dist_frontend
echo.
echo [2/5] Refreshing dist_frontend with latest compiled assets...
set "DIST_FRONTEND=%ROOT_DIR%\dist_frontend"
if not exist "%DIST_FRONTEND%" mkdir "%DIST_FRONTEND%"
del /s /q "%DIST_FRONTEND%\*" >nul 2>&1
xcopy /s /e /y /q "%ROOT_DIR%\frontend\dist\*" "%DIST_FRONTEND%\" >nul

REM 3. Clean build_obf
echo.
echo [3/5] Cleaning build_obf directory...
set "BUILD_OBF=%ROOT_DIR%\build_obf"
if exist "%BUILD_OBF%" rd /s /q "%BUILD_OBF%" >nul 2>&1

REM 4. Obfuscate app_launcher.py via PyArmor if Mode 0 and available
if "%OBF_MODE%"=="0" (
    if exist "%PYARMOR%" (
        echo.
        echo [4/5] Obfuscating app_launcher.py via PyArmor...
        "%PYARMOR%" gen -O "%BUILD_OBF%" "%ROOT_DIR%\app_launcher.py"
        if !ERRORLEVEL! NEQ 0 (
            echo [ERROR] PyArmor obfuscation failed. Falling back.
        )
    ) else (
        echo.
        echo [4/5] PyArmor not found. Proceeding with Mode 1 direct build.
    )
) else (
    echo.
    echo [4/5] PyArmor obfuscation skipped (Mode 1: Direct build)
)

REM 5. Build standalone executable with PyInstaller
set "DIST_FOLDER=%ROOT_DIR%\dist"
if not exist "%DIST_FOLDER%" mkdir "%DIST_FOLDER%"

echo.
echo [5/5] Building standalone Desktop Executable with PyInstaller...
"%PYINSTALLER%" "%ROOT_DIR%\CampusVotingPlatform.spec" --distpath "%DIST_FOLDER%" --noconfirm
if !ERRORLEVEL! NEQ 0 (
    echo [ERROR] PyInstaller build failed.
    goto :error
)

set "EXE_PATH=%DIST_FOLDER%\Campus-Voting-Platform.exe"
if exist "%EXE_PATH%" (
    echo.
    echo ================================================================
    echo  SUCCESS: Single Executable Application Built Successfully!
    echo  Executable: %EXE_PATH%
    echo ================================================================
    echo.
    exit /b 0
) else (
    echo.
    echo [WARNING] Build finished but could not locate %EXE_PATH%
    exit /b 0
)

:error
echo.
echo [BUILD FAILED via CMD]
exit /b 1
