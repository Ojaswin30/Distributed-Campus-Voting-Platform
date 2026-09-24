import uuid
from typing import Optional, Dict, Any, List
from core.database import get_db


# ============================================================================
# ADMIN REPOSITORY (GOOGLE OAUTH ONLY)
# ============================================================================

def get_admin_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Find active admin account strictly matching Google email address.
    """
    if not email:
        return None
    clean_email = email.strip().lower()
    with get_db() as conn:
        row = conn.execute(
            """SELECT id, email, full_name, role, is_active, created_at 
               FROM admins 
               WHERE LOWER(COALESCE(email, '')) = ? AND is_active = 1""", 
            (clean_email,)
        ).fetchone()

        if row:
            return dict(row)

        return None


def get_all_admins() -> List[Dict[str, Any]]:
    """
    List all administrator Google email accounts for the separate Superadmin portal.
    """
    with get_db() as conn:
        rows = conn.execute(
            """SELECT id, email, full_name, role, is_active, created_at 
               FROM admins 
               ORDER BY created_at DESC"""
        ).fetchall()
        return [dict(r) for r in rows]


def add_admin(email: str, full_name: Optional[str] = None, role: str = "admin") -> Dict[str, Any]:
    """
    Register a new administrator by their verified Google email address.
    """
    if not email or not email.strip():
        raise ValueError("Google Email address is required.")
    
    clean_email = email.strip().lower()
    admin_id = f"ADM-{uuid.uuid4().hex[:8].upper()}"
    name = full_name.strip() if full_name and full_name.strip() else clean_email.split("@")[0].replace(".", " ").title()

    with get_db() as conn:
        # Check existing table columns
        cols = [r["name"] for r in conn.execute("PRAGMA table_info(admins)").fetchall()]
        
        # Check if already exists
        existing = conn.execute("SELECT id FROM admins WHERE LOWER(email) = ?", (clean_email,)).fetchone()
        if existing:
            conn.execute(
                """UPDATE admins SET full_name = ?, role = ?, is_active = 1 WHERE LOWER(email) = ?""",
                (name, role, clean_email)
            )
            admin_id = existing["id"]
        else:
            if "username" in cols and "password_hash" in cols:
                conn.execute(
                    """INSERT INTO admins (id, username, password_hash, email, full_name, role, is_active) 
                       VALUES (?, ?, 'oauth_managed', ?, ?, ?, 1)""",
                    (admin_id, clean_email.split('@')[0], clean_email, name, role)
                )
            else:
                conn.execute(
                    """INSERT INTO admins (id, email, full_name, role, is_active) VALUES (?, ?, ?, ?, 1)""",
                    (admin_id, clean_email, name, role)
                )
        conn.commit()

        row = conn.execute("SELECT id, email, full_name, role, is_active, created_at FROM admins WHERE id = ?", (admin_id,)).fetchone()
        return dict(row)


def update_admin(admin_id: str, email: Optional[str] = None, full_name: Optional[str] = None, role: Optional[str] = None, is_active: Optional[int] = None) -> Optional[Dict[str, Any]]:
    """
    Update administrator email, name, role, or active status.
    """
    with get_db() as conn:
        row = conn.execute("SELECT * FROM admins WHERE id = ?", (admin_id,)).fetchone()
        if not row:
            return None

        current = dict(row)
        new_email = email.strip().lower() if email is not None else current.get("email")
        new_name = full_name.strip() if full_name is not None else current.get("full_name")
        new_role = role.strip() if role is not None else current.get("role")
        new_active = int(is_active) if is_active is not None else current.get("is_active", 1)

        conn.execute(
            """UPDATE admins SET email = ?, full_name = ?, role = ?, is_active = ? WHERE id = ?""",
            (new_email, new_name, new_role, new_active, admin_id)
        )
        conn.commit()

        updated_row = conn.execute("SELECT id, email, full_name, role, is_active, created_at FROM admins WHERE id = ?", (admin_id,)).fetchone()
        return dict(updated_row)


def delete_admin(admin_id: str) -> bool:
    """
    Remove an administrator account from the database.
    """
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM admins WHERE id = ?", (admin_id,))
        conn.commit()
        return cursor.rowcount > 0


# ============================================================================
# ADMIN ACCESS REQUEST TICKETS REPOSITORY
# ============================================================================

def create_admin_request(email: str, name: str, department: Optional[str] = None, reason: Optional[str] = None) -> Dict[str, Any]:
    """
    Create an admin onboarding / access request ticket.
    """
    if not email or not email.strip():
        raise ValueError("Google Email address is required.")
    if not name or not name.strip():
        raise ValueError("Full Name is required.")

    ticket_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"
    clean_email = email.strip().lower()
    clean_name = name.strip()
    clean_dept = department.strip() if department else None
    clean_reason = reason.strip() if reason else None

    with get_db() as conn:
        conn.execute(
            """INSERT INTO admin_requests (id, email, name, department, reason, status) 
               VALUES (?, ?, ?, ?, ?, 'pending')""",
            (ticket_id, clean_email, clean_name, clean_dept, clean_reason)
        )
        conn.commit()

        row = conn.execute("SELECT * FROM admin_requests WHERE id = ?", (ticket_id,)).fetchone()
        return dict(row)


def get_all_admin_requests(status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Fetch all admin request tickets, optionally filtered by status ('pending', 'approved', 'rejected').
    """
    with get_db() as conn:
        if status_filter:
            rows = conn.execute(
                """SELECT * FROM admin_requests WHERE LOWER(status) = LOWER(?) ORDER BY created_at DESC""",
                (status_filter.strip(),)
            ).fetchall()
        else:
            rows = conn.execute(
                """SELECT * FROM admin_requests ORDER BY created_at DESC"""
            ).fetchall()
        return [dict(r) for r in rows]


def approve_admin_request(ticket_id: str) -> Optional[Dict[str, Any]]:
    """
    Approve an access request ticket: grants admin access and records the approval.
    """
    with get_db() as conn:
        row = conn.execute("SELECT * FROM admin_requests WHERE id = ?", (ticket_id,)).fetchone()
        if not row:
            return None

        ticket = dict(row)
        email = ticket["email"]
        name = ticket["name"]

        # Add or activate admin
        cols = [r["name"] for r in conn.execute("PRAGMA table_info(admins)").fetchall()]
        existing_admin = conn.execute("SELECT id FROM admins WHERE LOWER(email) = ?", (email.lower(),)).fetchone()
        if existing_admin:
            conn.execute("UPDATE admins SET full_name = ?, is_active = 1 WHERE id = ?", (name, existing_admin["id"]))
        else:
            admin_id = f"ADM-{uuid.uuid4().hex[:8].upper()}"
            if "username" in cols and "password_hash" in cols:
                conn.execute(
                    "INSERT INTO admins (id, username, password_hash, email, full_name, role, is_active) VALUES (?, ?, 'oauth_managed', ?, ?, 'admin', 1)",
                    (admin_id, email.lower().split('@')[0], email.lower(), name)
                )
            else:
                conn.execute(
                    "INSERT INTO admins (id, email, full_name, role, is_active) VALUES (?, ?, ?, 'admin', 1)",
                    (admin_id, email.lower(), name)
                )

        # Update ticket status
        conn.execute(
            "UPDATE admin_requests SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
            (ticket_id,)
        )
        conn.commit()

        updated_ticket = conn.execute("SELECT * FROM admin_requests WHERE id = ?", (ticket_id,)).fetchone()
        return dict(updated_ticket)


def reject_admin_request(ticket_id: str) -> Optional[Dict[str, Any]]:
    """
    Reject an access request ticket.
    """
    with get_db() as conn:
        row = conn.execute("SELECT * FROM admin_requests WHERE id = ?", (ticket_id,)).fetchone()
        if not row:
            return None

        conn.execute(
            "UPDATE admin_requests SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
            (ticket_id,)
        )
        conn.commit()

        updated_ticket = conn.execute("SELECT * FROM admin_requests WHERE id = ?", (ticket_id,)).fetchone()
        return dict(updated_ticket)


def delete_admin_request(ticket_id: str) -> bool:
    """
    Delete an admin request ticket.
    """
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM admin_requests WHERE id = ?", (ticket_id,))
        conn.commit()
        return cursor.rowcount > 0
