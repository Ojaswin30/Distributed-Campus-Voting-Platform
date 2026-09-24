from typing import Optional, Dict, Any
from core.database import get_db


def authenticate_admin(admin_id_or_username: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Authenticate election admin credentials (Admin ID or Username & Password) against SQLite database.
    """
    if not admin_id_or_username or not password:
        return None
    with get_db() as conn:
        row = conn.execute(
            """SELECT id, username, full_name, role FROM admins 
               WHERE (LOWER(username) = LOWER(?) OR LOWER(id) = LOWER(?)) 
               AND password_hash = ?""", 
            (admin_id_or_username.strip(), admin_id_or_username.strip(), password.strip())
        ).fetchone()
        return dict(row) if row else None
