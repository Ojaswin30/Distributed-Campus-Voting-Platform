#!/usr/bin/env python3
"""
Campus Digital Voting Platform - Unified Runner
Starts both the FastAPI backend and Vite frontend concurrently with unified logging.
Press Ctrl+C to cleanly stop both services.
"""

import os
import sys
import subprocess
import threading
import signal
import time

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

# Virtual environment detection
VENV_PYTHON = os.path.join(ROOT_DIR, ".venv", "Scripts", "python.exe") if sys.platform == "win32" else os.path.join(ROOT_DIR, ".venv", "bin", "python")
PYTHON_EXEC = VENV_PYTHON if os.path.exists(VENV_PYTHON) else sys.executable

processes = []

def stream_logs(process, prefix, color_code):
    reset = "\033[0m"
    for line in iter(process.stdout.readline, ""):
        if not line:
            break
        print(f"{color_code}[{prefix}]{reset} {line.rstrip()}")
    process.stdout.close()

def shutdown(signum=None, frame=None):
    print("\n\033[1;33m[SHUTDOWN] Stopping frontend and backend services...\033[0m")
    for p in processes:
        try:
            if sys.platform == "win32":
                subprocess.call(["taskkill", "/F", "/T", "/PID", str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                p.terminate()
        except Exception:
            pass
    print("\033[1;32m[SHUTDOWN] All services stopped cleanly. Goodbye!\033[0m")
    sys.exit(0)

def main():
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    print("\033[1;36m========================================================\033[0m")
    print("\033[1;36m  Campus Digital Voting Platform - Unified Runner       \033[0m")
    print("\033[1;36m========================================================\033[0m")
    print(f"Python interpreter: {PYTHON_EXEC}")
    print(f"Backend directory : {BACKEND_DIR}")
    print(f"Frontend directory: {FRONTEND_DIR}\n")

    # Start FastAPI Backend
    backend_cmd = [PYTHON_EXEC, "-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append(backend_proc)

    # Start Vite Frontend (Main Portal on port 5173)
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        shell=(sys.platform == "win32")
    )
    processes.append(frontend_proc)

    # Start Superadmin Management Portal (on port 5174)
    superadmin_proc = subprocess.Popen(
        [npm_cmd, "run", "superadmin"],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        shell=(sys.platform == "win32")
    )
    processes.append(superadmin_proc)

    # Stream logs in background threads
    t_backend = threading.Thread(target=stream_logs, args=(backend_proc, "BACKEND", "\033[1;34m"), daemon=True)
    t_frontend = threading.Thread(target=stream_logs, args=(frontend_proc, "FRONTEND", "\033[1;32m"), daemon=True)
    t_superadmin = threading.Thread(target=stream_logs, args=(superadmin_proc, "SUPERADMIN", "\033[1;35m"), daemon=True)
    t_backend.start()
    t_frontend.start()
    t_superadmin.start()

    print("\033[1;32m[READY] Services launched:\033[0m")
    print("  -> Backend API        : http://127.0.0.1:8000")
    print("  -> API Docs           : http://127.0.0.1:8000/docs")
    print("  -> Main Election App  : http://localhost:5173")
    print("  -> Superadmin Portal  : http://localhost:5174")
    print("\n\033[90m(Press Ctrl+C at any time to terminate all services)\033[0m\n")

    while True:
        time.sleep(1)
        if backend_proc.poll() is not None or frontend_proc.poll() is not None or superadmin_proc.poll() is not None:
            shutdown()

if __name__ == "__main__":
    main()
