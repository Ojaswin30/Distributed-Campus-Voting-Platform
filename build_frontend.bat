@echo off
setlocal enabledelayedexpansion

REM ==============================================================================
REM Campus Digital Voting Platform - Automated Build & Packaging (Universal Root Launcher)
REM
REM Configurable Driver Execution:
REM   Option 1 / ps1 / ps / powershell : Run via PowerShell driver
REM   Option 2 / cmd / bat             : Run via native CMD driver (Zero PowerShell)
REM   Option 3 / py  / python          : Run via Python driver (Zero PowerShell)
REM   Default (no option)              : Auto cascading (PowerShell -> CMD -> Python)
REM
REM Usage:
REM   build_frontend.bat                     (Auto cascading, Mode 1 Direct)
REM   build_frontend.bat 1                   (Force PowerShell)
REM   build_frontend.bat 2                   (Force CMD)
REM   build_frontend.bat 3                   (Force Python)
REM   build_frontend.bat cmd                 (Force CMD)
REM   build_frontend.bat py                  (Force Python)
REM   build_frontend.bat 2 -ObfuscationMode 0
REM   build_frontend.bat py --mode 1
REM ==============================================================================

cd /d "%~dp0"

set "SELECTED_DRIVER=auto"
set "FORWARD_ARGS="

:parse_loop
if "%~1"=="" goto parse_done

set "ARG=%~1"

REM Named driver flags
if /i "%ARG%"=="--driver" (
    set "DRIVER_VAL=%~2"
    shift
    shift
    goto set_driver
)
if /i "%ARG%"=="-driver" (
    set "DRIVER_VAL=%~2"
    shift
    shift
    goto set_driver
)
if /i "%ARG%"=="-d" (
    set "DRIVER_VAL=%~2"
    shift
    shift
    goto set_driver
)

REM Positional driver options
if "%ARG%"=="1" ( set "SELECTED_DRIVER=ps1" & shift & goto parse_loop )
if /i "%ARG%"=="ps1" ( set "SELECTED_DRIVER=ps1" & shift & goto parse_loop )
if /i "%ARG%"=="ps" ( set "SELECTED_DRIVER=ps1" & shift & goto parse_loop )
if /i "%ARG%"=="powershell" ( set "SELECTED_DRIVER=ps1" & shift & goto parse_loop )

if "%ARG%"=="2" ( set "SELECTED_DRIVER=cmd" & shift & goto parse_loop )
if /i "%ARG%"=="cmd" ( set "SELECTED_DRIVER=cmd" & shift & goto parse_loop )
if /i "%ARG%"=="bat" ( set "SELECTED_DRIVER=cmd" & shift & goto parse_loop )

if "%ARG%"=="3" ( set "SELECTED_DRIVER=py" & shift & goto parse_loop )
if /i "%ARG%"=="py" ( set "SELECTED_DRIVER=py" & shift & goto parse_loop )
if /i "%ARG%"=="python" ( set "SELECTED_DRIVER=py" & shift & goto parse_loop )

if "%ARG%"=="0" ( set "SELECTED_DRIVER=auto" & shift & goto parse_loop )
if /i "%ARG%"=="auto" ( set "SELECTED_DRIVER=auto" & shift & goto parse_loop )

REM Collect any other arguments (e.g. -ObfuscationMode 0, --mode 1)
set "FORWARD_ARGS=!FORWARD_ARGS! %1"
shift
goto parse_loop

:set_driver
if "%DRIVER_VAL%"=="1" set "SELECTED_DRIVER=ps1"
if /i "%DRIVER_VAL%"=="ps1" set "SELECTED_DRIVER=ps1"
if /i "%DRIVER_VAL%"=="ps" set "SELECTED_DRIVER=ps1"
if /i "%DRIVER_VAL%"=="powershell" set "SELECTED_DRIVER=ps1"

if "%DRIVER_VAL%"=="2" set "SELECTED_DRIVER=cmd"
if /i "%DRIVER_VAL%"=="cmd" set "SELECTED_DRIVER=cmd"
if /i "%DRIVER_VAL%"=="bat" set "SELECTED_DRIVER=cmd"

if "%DRIVER_VAL%"=="3" set "SELECTED_DRIVER=py"
if /i "%DRIVER_VAL%"=="py" set "SELECTED_DRIVER=py"
if /i "%DRIVER_VAL%"=="python" set "SELECTED_DRIVER=py"

if "%DRIVER_VAL%"=="0" set "SELECTED_DRIVER=auto"
if /i "%DRIVER_VAL%"=="auto" set "SELECTED_DRIVER=auto"
goto parse_loop

:parse_done

echo ================================================================
echo    Campus Digital Voting Platform - Build ^& Packaging
echo ================================================================

REM Helper to detect Python for Python driver
set "PY_CMD="
if exist "%~dp0.venv\Scripts\python.exe" (
    set PY_CMD="%~dp0.venv\Scripts\python.exe"
) else (
    py -3.12 --version >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        set "PY_CMD=py -3.12"
    ) else (
        py -3 --version >nul 2>&1
        if !ERRORLEVEL! EQU 0 (
            set "PY_CMD=py -3"
        ) else (
            python --version >nul 2>&1
            if !ERRORLEVEL! EQU 0 set "PY_CMD=python"
        )
    )
)

REM --- Dispatch based on SELECTED_DRIVER ---

if "%SELECTED_DRIVER%"=="ps1" goto run_ps1_direct
if "%SELECTED_DRIVER%"=="cmd" goto run_cmd_direct
if "%SELECTED_DRIVER%"=="py"  goto run_py_direct
goto run_auto_cascade

REM ==============================================================================
REM DIRECT EXECUTION BRANCHES
REM ==============================================================================

:run_ps1_direct
echo Execution Mode: [DIRECT] PowerShell Driver (1/ps1)
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0drivers\build_frontend.ps1" %FORWARD_ARGS%
exit /b %ERRORLEVEL%

:run_cmd_direct
echo Execution Mode: [DIRECT] Native CMD Driver (2/cmd)
echo.
call "%~dp0drivers\build_frontend_cmd.bat" %FORWARD_ARGS%
exit /b %ERRORLEVEL%

:run_py_direct
echo Execution Mode: [DIRECT] Python Driver (3/py)
echo.
if not defined PY_CMD (
    echo [ERROR] No Python interpreter found on PATH or .venv!
    exit /b 1
)
%PY_CMD% "%~dp0drivers\build_frontend.py" %FORWARD_ARGS%
exit /b %ERRORLEVEL%

REM ==============================================================================
REM AUTO CASCADING BRANCH (Default)
REM ==============================================================================

:run_auto_cascade
echo Execution Mode: [AUTO] Cascading (PowerShell -^> CMD -^> Python)
echo.

REM --- Step 1: PowerShell ---
echo [Step 1/3] Trying PowerShell driver...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0drivers\build_frontend.ps1" %FORWARD_ARGS%
if %ERRORLEVEL% EQU 0 exit /b 0

echo.
echo [NOTICE] PowerShell driver was blocked or failed (Exit code: %ERRORLEVEL%).
echo [NOTICE] Falling back to Step 2: Native CMD driver...
echo.

REM --- Step 2: Native CMD ---
echo [Step 2/3] Running native CMD driver...
call "%~dp0drivers\build_frontend_cmd.bat" %FORWARD_ARGS%
if %ERRORLEVEL% EQU 0 exit /b 0

echo.
echo [NOTICE] CMD build driver encountered an error (Exit code: %ERRORLEVEL%).
echo [NOTICE] Falling back to Step 3: Python driver...
echo.

REM --- Step 3: Python ---
echo [Step 3/3] Running Python driver...
if not defined PY_CMD (
    echo [ERROR] No Python interpreter found to execute fallback driver.
    exit /b 1
)
%PY_CMD% "%~dp0drivers\build_frontend.py" %FORWARD_ARGS%
exit /b %ERRORLEVEL%
