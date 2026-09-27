#!/usr/bin/env python3
"""
Campus Digital Voting Platform - Automated Frontend & Standalone Application Build Script (Python Driver).

Zero PowerShell dependency. Can be run via:
    python drivers/build_frontend.py
    python drivers/build_frontend.py --mode 1   (Direct / Unobfuscated)
or via root launchers:
    build_frontend.bat
    build.bat
"""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

# Script is in drivers/, project root is parent of drivers/
ROOT_DIR = Path(__file__).resolve().parent.parent

# ANSI Colors
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner(mode: int):
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    if os.name == "nt":
        os.system("")

    print(f"{MAGENTA}{'=' * 66}{RESET}")
    print(f"{MAGENTA}{BOLD}   Campus Digital Voting Platform - Frontend & Desktop Build     {RESET}")
    print(f"{MAGENTA}{BOLD}              Single Unified Standalone Executable                {RESET}")
    print(f"{MAGENTA}{'=' * 66}{RESET}")
    if mode == 0:
        print(f"{YELLOW} Build Mode: [0] OBFUSCATED (PyArmor + PyInstaller){RESET}")
    else:
        print(f"{CYAN} Build Mode: [1] DIRECT / UNOBFUSCATED (PyInstaller only){RESET}")
    print(f"{MAGENTA}{'=' * 66}{RESET}\n")


def check_prerequisites(mode: int):
    print(f"{CYAN}[1/5] Checking environment prerequisites...{RESET}")

    venv_scripts = ROOT_DIR / ".venv" / ("Scripts" if os.name == "nt" else "bin")
    venv_python = venv_scripts / ("python.exe" if os.name == "nt" else "python")
    py_exec = venv_python if venv_python.exists() else Path(sys.executable)

    venv_pyinstaller = venv_scripts / ("pyinstaller.exe" if os.name == "nt" else "pyinstaller")
    pyinstaller_exec = venv_pyinstaller if venv_pyinstaller.exists() else shutil.which("pyinstaller")

    if not pyinstaller_exec or not Path(pyinstaller_exec).exists():
        print(f"{YELLOW}  * PyInstaller not found. Installing into virtualenv...{RESET}")
        res = subprocess.run([str(py_exec), "-m", "pip", "install", "pyinstaller"], cwd=ROOT_DIR)
        if res.returncode != 0:
            print(f"{RED}[ERROR] Failed to install PyInstaller.{RESET}")
            sys.exit(1)
        pyinstaller_exec = venv_pyinstaller

    pyarmor_exec = venv_scripts / ("pyarmor.exe" if os.name == "nt" else "pyarmor")
    if mode == 0 and not pyarmor_exec.exists():
        pyarmor_in_path = shutil.which("pyarmor")
        if pyarmor_in_path:
            pyarmor_exec = Path(pyarmor_in_path)
        else:
            print(f"{YELLOW}  * Notice: PyArmor not installed. Falling back to Mode 1 (Direct PyInstaller build)...{RESET}")
            mode = 1

    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    print(f"  * Python interpreter : {py_exec}")
    print(f"  * PyInstaller binary : {pyinstaller_exec}")
    print(f"  * Node Package Mgr   : {npm_cmd}")

    return py_exec, pyinstaller_exec, pyarmor_exec, npm_cmd, mode


def build_react_frontend(npm_cmd):
    print(f"\n{CYAN}[2/5] Compiling React Multi-Portal SPA (Vite)...{RESET}")
    frontend_dir = ROOT_DIR / "frontend"
    res = subprocess.run([npm_cmd, "run", "build"], cwd=frontend_dir, shell=(sys.platform == "win32"))
    if res.returncode != 0:
        print(f"{RED}[ERROR] Frontend build failed (npm run build exited with code {res.returncode}).{RESET}")
        sys.exit(res.returncode)

    dist_index = frontend_dir / "dist" / "index.html"
    dist_superadmin = frontend_dir / "dist" / "superadmin.html"
    if not dist_index.exists() or not dist_superadmin.exists():
        print(f"{RED}[ERROR] Expected dist HTML artifacts missing in {frontend_dir / 'dist'}.{RESET}")
        sys.exit(1)
    print(f"{GREEN}  [OK] Frontend multi-portal compiled successfully.{RESET}")


def sync_dist_frontend():
    print(f"\n{CYAN}[3/5] Synchronizing dist_frontend package folder...{RESET}")
    frontend_dist = ROOT_DIR / "frontend" / "dist"
    dist_frontend = ROOT_DIR / "dist_frontend"

    if dist_frontend.exists():
        shutil.rmtree(dist_frontend, ignore_errors=True)
    dist_frontend.mkdir(parents=True, exist_ok=True)

    if frontend_dist.exists():
        for item in frontend_dist.iterdir():
            dest = dist_frontend / item.name
            if item.is_dir():
                shutil.copytree(item, dest, dirs_exist_ok=True)
            else:
                shutil.copy2(item, dest)
    print(f"{GREEN}  [OK] Synced {dist_frontend}{RESET}")


def handle_obfuscation(mode: int, pyarmor_exec: Path):
    build_obf = ROOT_DIR / "build_obf"
    if build_obf.exists():
        shutil.rmtree(build_obf, ignore_errors=True)

    if mode == 0 and pyarmor_exec.exists():
        print(f"\n{CYAN}[4/5] Obfuscating app_launcher.py via PyArmor (Mode 0)...{RESET}")
        entry_script = str(ROOT_DIR / "app_launcher.py")
        res = subprocess.run([str(pyarmor_exec), "gen", "-O", str(build_obf), entry_script], cwd=ROOT_DIR)
        if res.returncode != 0:
            print(f"{RED}[ERROR] PyArmor obfuscation failed. Falling back to direct build.{RESET}")
        else:
            print(f"{GREEN}  [OK] Obfuscation complete.{RESET}")
    else:
        print(f"\n{YELLOW}[4/5] [SKIPPED] PyArmor obfuscation skipped (Mode 1: Direct Build){RESET}")


def package_executable(pyinstaller_exec: Path):
    print(f"\n{CYAN}[5/5] Building Standalone Windowed Desktop Executable with PyInstaller...{RESET}")
    dist_folder = ROOT_DIR / "dist"
    build_work_dir = ROOT_DIR / "build" / "app"

    dist_folder.mkdir(parents=True, exist_ok=True)
    build_work_dir.mkdir(parents=True, exist_ok=True)

    spec_file = ROOT_DIR / "CampusVotingPlatform.spec"
    cmd = [
        str(pyinstaller_exec),
        str(spec_file),
        "--distpath", str(dist_folder),
        "--workpath", str(build_work_dir),
        "--noconfirm",
    ]

    res = subprocess.run(cmd, cwd=ROOT_DIR)
    if res.returncode != 0:
        print(f"{RED}[ERROR] PyInstaller compilation failed with code {res.returncode}.{RESET}")
        sys.exit(res.returncode)

    exe_path = dist_folder / "Campus-Voting-Platform.exe"
    if exe_path.exists():
        size_mb = round(exe_path.stat().st_size / (1024 * 1024), 2)
        print(f"\n{GREEN}{'=' * 66}{RESET}")
        print(f"{GREEN}{BOLD} SUCCESS: Desktop Native Executable Built Successfully!        {RESET}")
        print(f"{GREEN}{'=' * 66}{RESET}")
        print(f"  * Final Executable : {BOLD}{exe_path}{RESET}")
        print(f"  * Binary Size      : {size_mb} MB")
        print(f"  * Native Window    : PyWebView (Chromium / WebKit - Zero Browser Spawns)")
        print(f"  * Database Mode    : Zero Local DB (Online HTTP Proxy to Central Backend)")
        print(f"  * Portals Bundled  : Voter / Admin Portal + Standalone Superadmin Portal")
        print(f"  * Launch Command   : {exe_path}")
        print(f"{GREEN}{'=' * 66}{RESET}\n")
    else:
        print(f"\n{YELLOW}[WARNING] Build finished but could not locate {exe_path}{RESET}")


def main():
    parser = argparse.ArgumentParser(description="Campus Digital Voting Platform Build & Packaging")
    parser.add_argument(
        "--mode",
        "-m",
        "--ObfuscationMode",
        "-ObfuscationMode",
        dest="mode",
        type=int,
        choices=[0, 1],
        default=1,
        help="0 = Obfuscated (PyArmor + PyInstaller), 1 = Direct (PyInstaller only, default)",
    )
    args = parser.parse_args()

    print_banner(args.mode)
    py_exec, pyinstaller_exec, pyarmor_exec, npm_cmd, mode = check_prerequisites(args.mode)
    build_react_frontend(npm_cmd)
    sync_dist_frontend()
    handle_obfuscation(mode, pyarmor_exec)
    package_executable(pyinstaller_exec)


if __name__ == "__main__":
    main()
