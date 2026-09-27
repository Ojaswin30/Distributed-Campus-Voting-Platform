#!/usr/bin/env python3
"""
Campus Digital Voting Platform - Desktop Application Launcher
Native Desktop Application (PyWebView + Edge Chromium / WebKit).

- Serves the compiled React frontend from bundled assets.
- ZERO local database: Proxies all `/api/*` calls over HTTP to the centralized online backend server.
- Opens in a native desktop window (NO web browser tabs).
"""

from __future__ import annotations

import os
import sys
import time
import socket
import argparse
import threading
from pathlib import Path
from contextlib import asynccontextmanager

import httpx
import uvicorn
import webview
from fastapi import FastAPI, Request, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Default Online / Remote Backend URL (configurable via environment variable or CLI)
DEFAULT_BACKEND_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:8000")
FRONTEND_HOST = "127.0.0.1"


def _resource_root() -> Path:
    """Directory containing bundled resources."""
    if getattr(sys, "frozen", False):
        return Path(getattr(sys, "_MEIPASS", os.path.dirname(sys.executable)))
    return Path(__file__).resolve().parent


def _find_dist_dir() -> Path:
    """Locates the compiled frontend distribution folder."""
    root = _resource_root()
    script_dir = Path(__file__).resolve().parent
    for candidate in (
        root / "dist_frontend",
        root / "frontend_dist",
        root / "frontend" / "dist",
        script_dir / "frontend" / "dist",
        script_dir.parent / "frontend" / "dist",
    ):
        if candidate.is_dir() and (candidate / "index.html").is_file():
            return candidate
    raise RuntimeError(
        "Could not locate the compiled frontend (dist/index.html). "
        "Run `npm --prefix frontend run build` before launching or packaging."
    )


def _find_free_port() -> int:
    """Finds an available local port for the internal proxy server."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]


def _build_desktop_app(backend_url: str) -> FastAPI:
    """Configures the internal desktop app with proxying to the remote backend server."""
    dist_dir = _find_dist_dir()
    index_html = dist_dir / "index.html"
    superadmin_html = dist_dir / "superadmin.html"

    # HTTP client proxy to the central server
    client = httpx.AsyncClient(base_url=backend_url, timeout=30.0)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        yield
        await client.aclose()

    app = FastAPI(title="Campus Voting Platform Client", docs_url=None, redoc_url=None, lifespan=lifespan)

    # Standard hop-by-hop headers to strip during proxying
    _HOP_BY_HOP = {
        "connection",
        "keep-alive",
        "proxy-authenticate",
        "proxy-authorization",
        "te",
        "trailers",
        "transfer-encoding",
        "upgrade",
        "host",
        "content-length",
    }

    # Proxy all API requests to the online/remote backend server
    @app.api_route(
        "/api/{path:path}",
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    )
    async def api_proxy(path: str, request: Request) -> Response:
        url = f"/api/{path}"
        headers = {k: v for k, v in request.headers.items() if k.lower() not in _HOP_BY_HOP}
        body = await request.body()
        try:
            upstream = await client.request(
                request.method,
                url,
                params=request.query_params,
                headers=headers,
                content=body,
            )
        except httpx.ConnectError:
            return Response(
                content=(
                    f'{{"success": false, "detail": "Cannot connect to central server at {backend_url}. Please ensure the server is online."}}'.encode("utf-8")
                ),
                status_code=503,
                media_type="application/json",
            )
        except Exception as e:
            return Response(
                content=(
                    f'{{"success": false, "detail": "Proxy error communicating with server: {str(e)}"}}'.encode("utf-8")
                ),
                status_code=502,
                media_type="application/json",
            )

        resp_headers = {k: v for k, v in upstream.headers.items() if k.lower() not in _HOP_BY_HOP}
        return Response(
            content=upstream.content,
            status_code=upstream.status_code,
            headers=resp_headers,
            media_type=upstream.headers.get("content-type"),
        )

    # Serve static assets (JS, CSS, SVGs, Fonts)
    assets_dir = dist_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # Serve Standalone Superadmin Management Portal
    @app.get("/superadmin")
    @app.get("/superadmin/")
    @app.get("/superadmin.html")
    async def serve_superadmin():
        if superadmin_html.exists():
            return FileResponse(str(superadmin_html))
        return FileResponse(str(index_html))

    # Serve Main Voter / Admin Portal and SPA Catch-all
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str) -> FileResponse:
        candidate = dist_dir / full_path
        if full_path and candidate.is_file() and candidate.exists():
            return FileResponse(str(candidate))
        return FileResponse(str(index_html))

    return app


def _wait_until_ready(url: str, timeout: float = 15.0) -> None:
    """Waits until the internal static server is responding."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with httpx.Client(timeout=0.5) as c:
                res = c.get(url)
                if res.status_code == 200:
                    return
        except Exception:
            time.sleep(0.15)


def _ensure_std_streams() -> None:
    """Prevents crashing in windowed (console=False) mode when stdout/stderr are None."""
    if sys.stdout is None:
        sys.stdout = open(os.devnull, "w", buffering=1)
    if sys.stderr is None:
        sys.stderr = open(os.devnull, "w", buffering=1)


def _run_server(app: FastAPI, port: int) -> None:
    """Runs internal Uvicorn ASGI server silently in background thread."""
    config = uvicorn.Config(
        app,
        host=FRONTEND_HOST,
        port=port,
        log_level="error",
        log_config=None,
        access_log=False,
    )
    uvicorn.Server(config).run()


def main():
    _ensure_std_streams()

    parser = argparse.ArgumentParser(description="Campus Digital Voting Platform - Native Desktop Application")
    parser.add_argument("--server", "-s", default=DEFAULT_BACKEND_URL, help=f"Remote Central Server URL (default: {DEFAULT_BACKEND_URL})")
    parser.add_argument("--superadmin", action="store_true", help="Launch directly into Superadmin Management Portal")
    parser.add_argument("--width", type=int, default=1280, help="Window initial width (default: 1280)")
    parser.add_argument("--height", type=int, default=820, help="Window initial height (default: 820)")
    args = parser.parse_args()

    backend_url = args.server.rstrip("/")
    port = _find_free_port()
    app = _build_desktop_app(backend_url)

    # Start internal server in background thread
    server_thread = threading.Thread(target=_run_server, args=(app, port), daemon=True)
    server_thread.start()

    local_url = f"http://{FRONTEND_HOST}:{port}/"
    if args.superadmin:
        local_url = f"http://{FRONTEND_HOST}:{port}/superadmin"

    _wait_until_ready(local_url)

    # Enable native Webview settings
    webview.settings["ALLOW_DOWNLOADS"] = True

    # Open Native Desktop Window (Zero Browser Tabs)
    window_title = "Campus Digital Voting Platform - Superadmin Portal" if args.superadmin else "Campus Digital Voting Platform"
    webview.create_window(
        window_title,
        local_url,
        width=args.width,
        height=args.height,
        min_size=(960, 640),
        text_select=True,
    )
    webview.start()


if __name__ == "__main__":
    main()
