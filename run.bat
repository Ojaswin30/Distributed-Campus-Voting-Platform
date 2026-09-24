@echo off
setlocal enabledelayedexpansion
title Campus Digital Voting System - Launcher

echo ========================================================
echo   Campus Digital Voting Platform - Launching Services
echo ========================================================
echo.

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

:: Check for virtual environment python
if exist "%ROOT_DIR%.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%ROOT_DIR%.venv\Scripts\python.exe"
    echo [OK] Using virtualenv Python: .venv\Scripts\python.exe
) else (
    set "PYTHON_EXE=python"
    echo [INFO] Virtualenv not found. Using system Python.
)

:: 1. Start Backend in new window
echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Voting Platform - Backend API (Port 8000)" cmd /k "cd /d "%ROOT_DIR%backend" && "%PYTHON_EXE%" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: 2. Start Main Election Frontend in new window
echo [2/3] Starting Main Election Portal on http://localhost:5173 ...
start "Voting Platform - Main Portal (Port 5173)" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run dev"

:: 3. Start Superadmin Portal in new window
echo [3/3] Starting Superadmin Portal on http://localhost:5174 ...
start "Voting Platform - Superadmin Portal (Port 5174)" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run superadmin"

echo.
echo ========================================================
echo   All services have been started successfully!
echo.
echo   * Backend API:        http://127.0.0.1:8000
echo   * Swagger Docs:       http://127.0.0.1:8000/docs
echo   * Main Election Web:  http://localhost:5173
echo   * Superadmin Portal:  http://localhost:5174
echo ========================================================
echo.
pause
