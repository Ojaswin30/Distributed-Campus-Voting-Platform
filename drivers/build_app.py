#!/usr/bin/env python3
"""
Campus Digital Voting Platform - Automated Application Build Script (Python Driver).
Zero PowerShell dependency. Can be run via:
    python drivers/build_app.py
or via root launcher:
    build.bat
"""

import sys
from pathlib import Path

# Redirect to build_frontend.py driver
script_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(script_dir))

from build_frontend import main

if __name__ == "__main__":
    main()
