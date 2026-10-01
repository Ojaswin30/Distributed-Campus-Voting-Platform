import os
import time
import uuid
import json
import httpx
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Request, Query, HTTPException, status
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

from services.google_auth_service import verify_google_id_token
import repositories as db
from services.ballot_service import build_student_ballot_payload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication Loopback"])

# In-memory session store for pending desktop browser authentications
_AUTH_SESSIONS: Dict[str, Dict[str, Any]] = {}
SESSION_EXPIRY_SECONDS = 300  # 5 minutes


def _clean_expired_sessions():
    now = time.time()
    expired = [k for k, v in _AUTH_SESSIONS.items() if now - v.get("created_at", 0) > SESSION_EXPIRY_SECONDS]
    for k in expired:
        _AUTH_SESSIONS.pop(k, None)


def _get_google_client_id() -> str:
    return (
        os.environ.get("VITE_GOOGLE_CLIENT_ID")
        or os.environ.get("GOOGLE_CLIENT_ID")
        or "374708726653-rl5217itnoic8sdm0ql2952ggqpn7qtv.apps.googleusercontent.com"
    ).strip()


class StartLoginRequest(BaseModel):
    role: str = "student"  # 'student' | 'teacher'
    client_id: Optional[str] = None
    redirect_port: Optional[int] = None


class CompleteTokenRequest(BaseModel):
    state: str
    id_token: Optional[str] = None
    access_token: Optional[str] = None
    email: Optional[str] = None
    code: Optional[str] = None


def generate_browser_login_html(state: str, role: str, client_id: str) -> str:
    """Renders the local browser authentication portal with Google GIS, Direct OAuth, and Email login."""
    role_label = "Teacher / Administrator" if role == "teacher" else "Student / Voter"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campus Voting Platform - Sign In Authorization</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  <style>
    :root {{
      --bg-gradient: linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%);
      --card-bg: rgba(30, 41, 59, 0.9);
      --card-border: rgba(255, 255, 255, 0.12);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --success: #10b981;
      --success-bg: rgba(16, 185, 129, 0.15);
      --error: #ef4444;
      --error-bg: rgba(239, 68, 68, 0.15);
    }}
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }}
    body {{
      background: var(--bg-gradient);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }}
    .container {{
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
      max-width: 480px;
      width: 100%;
      padding: 2.5rem 2rem;
      text-align: center;
      animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }}
    @keyframes fadeIn {{
      from {{ opacity: 0; transform: translateY(10px); }}
      to {{ opacity: 1; transform: translateY(0); }}
    }}
    .badge-header {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #60a5fa;
      margin-bottom: 1.25rem;
    }}
    .role-badge {{
      display: inline-block;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #38bdf8;
      font-size: 0.82rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 6px;
      margin-bottom: 1rem;
    }}
    .title {{
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
    }}
    .desc {{
      font-size: 0.88rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }}
    .google-box {{
      display: flex;
      justify-content: center;
      margin: 1.25rem 0;
      min-height: 44px;
    }}
    .divider {{
      display: flex;
      align-items: center;
      text-align: center;
      margin: 1.25rem 0;
      color: var(--text-muted);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    .divider::before, .divider::after {{
      content: '';
      flex: 1;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }}
    .divider::before {{ margin-right: 0.75em; }}
    .divider::after {{ margin-left: 0.75em; }}
    .email-form {{
      display: flex;
      gap: 6px;
      margin-bottom: 1rem;
    }}
    .form-input {{
      flex: 1;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      color: #ffffff;
      padding: 9px 12px;
      font-size: 0.88rem;
      outline: none;
    }}
    .form-input:focus {{
      border-color: var(--primary);
    }}
    .btn {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 9px 14px;
      background: var(--primary);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.2s;
    }}
    .btn:hover {{
      background: var(--primary-hover);
    }}
    .status-card {{
      display: none;
      padding: 1.25rem;
      border-radius: 12px;
      margin-top: 1rem;
      text-align: center;
    }}
    .status-success {{
      display: block;
      background: var(--success-bg);
      border: 1px solid var(--success);
      color: #34d399;
    }}
    .status-error {{
      display: block;
      background: var(--error-bg);
      border: 1px solid var(--error);
      color: #f87171;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="badge-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
      Campus Digital Voting Platform
    </div>

    <div class="role-badge">{role_label}</div>
    <h1 class="title">Complete Google Sign-In</h1>
    <p class="desc">
      Choose your campus Google account below. Your credentials will be securely transferred back to the Desktop Voting Application.
    </p>

    <!-- Google Identity Services Button Container -->
    <div class="google-box">
      <div id="google-signin-btn"></div>
    </div>

    <!-- Divider -->
    <div class="divider">OR SIGN IN WITH REGISTERED EMAIL</div>

    <!-- Direct Registered Email Verification -->
    <form class="email-form" onsubmit="handleEmailSubmit(event)">
      <input 
        type="email" 
        id="direct-email-input" 
        class="form-input" 
        placeholder="e.g. your.email@campus.edu" 
        required 
      />
      <button type="submit" id="btn-submit-email" class="btn">
        Continue ➔
      </button>
    </form>

    <!-- Status Feedback Card -->
    <div id="status-card" class="status-card">
      <div id="status-title" style="font-weight: 700; font-size: 1rem; margin-bottom: 0.35rem;"></div>
      <div id="status-desc" style="font-size: 0.85rem; line-height: 1.4;"></div>
      <div id="countdown" style="font-size: 0.78rem; margin-top: 0.75rem; color: #94a3b8;"></div>
    </div>
  </div>

  <script>
    const STATE = "{state}";
    const ROLE = "{role}";
    const CLIENT_ID = "{client_id}";

    function showStatus(type, title, desc, autoClose = false) {{
      const card = document.getElementById('status-card');
      card.className = 'status-card ' + (type === 'success' ? 'status-success' : 'status-error');
      document.getElementById('status-title').innerText = title;
      document.getElementById('status-desc').innerText = desc;
      card.style.display = 'block';

      if (autoClose) {{
        let remaining = 4;
        const cd = document.getElementById('countdown');
        cd.innerText = 'This browser tab will attempt to close automatically in ' + remaining + 's...';
        const timer = setInterval(() => {{
          remaining--;
          if (remaining > 0) {{
            cd.innerText = 'This browser tab will attempt to close automatically in ' + remaining + 's...';
          }} else {{
            clearInterval(timer);
            window.close();
          }}
        }}, 1000);
      }}
    }}

    function completeAuthWithPayload(payload) {{
      fetch('/api/auth/desktop/complete-token', {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify(payload)
      }})
      .then(res => res.json())
      .then(data => {{
        if (data.success) {{
          showStatus(
            'success',
            '✓ Authentication Successful!',
            'Verified as ' + (data.name ? data.name + ' (' + data.email + ')' : data.email) + '. Transferred to Desktop App!',
            true
          );
        }} else {{
          showStatus(
            'error',
            '✕ Verification Failed',
            data.detail || 'The account is not authorized in the campus database.'
          );
        }}
      }})
      .catch(err => {{
        showStatus(
          'error',
          'Connection Error',
          'Could not communicate with local application server: ' + err.message
        );
      }});
    }}

    function handleGoogleCredentialResponse(response) {{
      if (response && response.credential) {{
        completeAuthWithPayload({{
          state: STATE,
          id_token: response.credential
        }});
      }} else {{
        showStatus('error', 'Sign-In Cancelled', 'Google returned no valid credential.');
      }}
    }}

    function handleEmailSubmit(e) {{
      e.preventDefault();
      const email = document.getElementById('direct-email-input').value.trim();
      if (!email) return;

      document.getElementById('btn-submit-email').innerText = 'Verifying...';
      completeAuthWithPayload({{
        state: STATE,
        email: email
      }});
    }}

    window.onload = function () {{
      if (window.google && window.google.accounts && window.google.accounts.id) {{
        try {{
          google.accounts.id.initialize({{
            client_id: CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            context: 'signin'
          }});

          google.accounts.id.renderButton(
            document.getElementById('google-signin-btn'),
            {{
              theme: 'filled_blue',
              size: 'large',
              shape: 'rectangular',
              text: 'signin_with',
              width: 320
            }}
          );
        }} catch (err) {{
          console.warn('GIS error:', err);
        }}
      }}
    }};
  </script>
</body>
</html>
"""


@router.post("/desktop/start-google-login")
async def start_google_login(req: StartLoginRequest, request: Request):
    """
    Initiates Google OAuth authentication in the user's default external browser.
    Creates a unique state token and opens the local browser-login portal.
    """
    _clean_expired_sessions()

    session_id = str(uuid.uuid4())
    client_id = (req.client_id or _get_google_client_id()).strip()

    port = req.redirect_port or request.url.port or 5173
    host = request.url.hostname or "localhost"

    # Open local browser login portal
    browser_url = f"http://{host}:{port}/api/auth/browser-login?state={session_id}&role={req.role}"

    _AUTH_SESSIONS[session_id] = {
        "status": "pending",
        "role": req.role,
        "created_at": time.time(),
        "result": None,
        "error": None,
    }

    try:
        import webbrowser
        webbrowser.open(browser_url)
    except Exception as e:
        logger.warning(f"Could not automatically open browser: {e}")

    return {
        "success": True,
        "state": session_id,
        "browser_url": browser_url,
        "role": req.role,
    }


@router.get("/browser-login", response_class=HTMLResponse)
async def browser_login_portal(
    state: str = Query(..., description="Session state UUID"),
    role: str = Query("student", description="Role: student or teacher"),
):
    """
    Local browser landing page that runs Google Identity Services safely inside Chrome/Edge.
    """
    _clean_expired_sessions()
    client_id = _get_google_client_id()
    return HTMLResponse(content=generate_browser_login_html(state, role, client_id), status_code=200)


@router.get("/google/callback", response_class=HTMLResponse)
async def google_auth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    id_token: Optional[str] = None,
    access_token: Optional[str] = None,
):
    """Fallback callback for traditional OAuth redirects."""
    _clean_expired_sessions()
    client_id = _get_google_client_id()
    return HTMLResponse(content=generate_browser_login_html(state or "", "student", client_id), status_code=200)


@router.post("/desktop/complete-token")
async def complete_desktop_token(req: CompleteTokenRequest):
    """
    Receives credentials from the browser login page, validates user eligibility against database,
    and updates the session status so the desktop app can log the user in.
    """
    _clean_expired_sessions()
    session = _AUTH_SESSIONS.get(req.state)
    if not session:
        session = {
            "status": "pending",
            "role": "student",
            "created_at": time.time(),
            "result": None,
            "error": None,
        }
        _AUTH_SESSIONS[req.state] = session

    role = session.get("role", "student")
    user_email = ""
    user_name = ""
    token_payload = {}

    # 1. Resolve user info via Access Token if provided
    if req.access_token and not req.id_token:
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {req.access_token}"},
                )
                if res.status_code == 200:
                    token_payload = res.json()
                    user_email = token_payload.get("email", "").strip().lower()
                    user_name = token_payload.get("name", "")
        except Exception as e:
            logger.warning(f"Failed to fetch userinfo with access token: {e}")

    # 2. Resolve user info via ID Token
    if req.id_token and not user_email:
        try:
            token_payload = verify_google_id_token(req.id_token)
            user_email = token_payload.get("email", "").strip().lower()
            user_name = token_payload.get("name", "")
        except HTTPException as he:
            session["status"] = "error"
            session["error"] = he.detail
            return JSONResponse(status_code=he.status_code, content={"success": False, "detail": he.detail})
        except Exception as e:
            session["status"] = "error"
            session["error"] = f"Token verification error: {str(e)}"
            return JSONResponse(status_code=400, content={"success": False, "detail": str(e)})

    # 3. Handle fallback direct email if supplied
    if not user_email and req.email:
        user_email = req.email.strip().lower()
        user_name = user_email.split("@")[0].title()
        token_payload = {"email": user_email, "name": user_name}

    if not user_email:
        err_msg = "Google login did not return a valid email address."
        session["status"] = "error"
        session["error"] = err_msg
        return JSONResponse(status_code=400, content={"success": False, "detail": err_msg})

    # 4. Perform Role-Specific Verification & Ballot / Admin Payload Generation
    try:
        if role == "student":
            student = db.get_student_by_email(user_email)
            if not student:
                err_msg = f"Access Denied: Google account '{user_email}' is not registered in the student database. Please contact your campus election administrator."
                session["status"] = "error"
                session["error"] = err_msg
                return JSONResponse(status_code=403, content={"success": False, "detail": err_msg})

            payload = build_student_ballot_payload(student, extra_profile=token_payload)
            session["status"] = "completed"
            session["result"] = payload
            session["error"] = None

            return {
                "success": True,
                "role": "student",
                "email": user_email,
                "name": payload.get("student", {}).get("name", user_name),
                "campus": payload.get("campus", ""),
            }

        else:
            # Teacher / Admin verification
            admin = db.get_admin_by_email(user_email)
            if not admin:
                err_msg = f"Google account '{user_email}' is not authorized as an Election Administrator. Please submit an Admin Request."
                session["status"] = "error"
                session["error"] = err_msg
                return JSONResponse(status_code=401, content={"success": False, "detail": err_msg})

            admin_data = {
                "id": admin["id"],
                "email": admin["email"],
                "full_name": admin.get("full_name") or user_name or user_email.split("@")[0].title(),
                "role": admin.get("role", "admin"),
            }
            session["status"] = "completed"
            session["result"] = {
                "success": True,
                "message": f"Welcome, {admin_data['full_name']}!",
                "admin": admin_data,
            }
            session["error"] = None

            return {
                "success": True,
                "role": "teacher",
                "email": user_email,
                "name": admin_data["full_name"],
            }

    except Exception as e:
        session["status"] = "error"
        session["error"] = str(e)
        return JSONResponse(status_code=500, content={"success": False, "detail": str(e)})


@router.get("/desktop/status")
async def get_desktop_auth_status(state: str = Query(..., description="Session state UUID")):
    """
    Polled by the React desktop application to check if the user completed Google sign-in.
    """
    _clean_expired_sessions()
    session = _AUTH_SESSIONS.get(state)
    if not session:
        return {"status": "not_found", "detail": "Session expired or not found."}

    return {
        "status": session.get("status", "pending"),
        "role": session.get("role"),
        "result": session.get("result"),
        "error": session.get("error"),
    }


@router.post("/desktop/cancel")
async def cancel_desktop_auth(state: str = Query(..., description="Session state UUID")):
    """Cancels a pending authentication session."""
    _AUTH_SESSIONS.pop(state, None)
    return {"success": True}
