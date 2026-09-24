import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from core.database import get_db

STANDARD_CLUBS = [
    ("Tech Club", "Software development, artificial intelligence, competitive programming, web & app tech, cybersecurity, and open source hackathons."),
    ("Cultural Club", "Music, classical and modern dance, theater, fine arts, photography, drama productions, and annual campus cultural fests."),
    ("Content Club", "Digital media, technical writing, journalism, video production, campus podcasts, and storytelling."),
    ("Business Club", "Entrepreneurship, startup incubation, finance simulations, business case studies, and investing."),
    ("Robotics Club", "Autonomous robots, drones, IoT hardware, mechatronics, sensors, and embedded systems."),
    ("Sports Club", "Athletics, football, cricket, badminton, basketball championships, and fitness tournaments.")
]


def ensure_campus_clubs(campus_name: str):
    """
    Ensures that the 6 standard clubs exist for the given campus.
    """
    if not campus_name or not str(campus_name).strip():
        return
    c_name = str(campus_name).strip()
    with get_db() as conn:
        for club_name, club_desc in STANDARD_CLUBS:
            existing = conn.execute(
                "SELECT 1 FROM clubs WHERE LOWER(campus) = LOWER(?) AND LOWER(name) = LOWER(?)",
                (c_name, club_name)
            ).fetchone()
            if not existing:
                cid = f"club-{uuid.uuid4().hex[:8]}"
                conn.execute("""
                    INSERT INTO clubs (id, name, campus, description, is_active)
                    VALUES (?, ?, ?, ?, 1)
                """, (cid, club_name, c_name, club_desc))
        conn.commit()


def get_clubs(active_only: bool = True, campus: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Fetch all clubs, optionally filtered by active status and campus.
    """
    with get_db() as conn:
        query = "SELECT * FROM clubs WHERE 1=1"
        params = []
        if active_only:
            query += " AND is_active = 1"
        if campus:
            query += " AND LOWER(campus) = LOWER(?)"
            params.append(campus.strip())
        query += " ORDER BY name ASC"
        rows = conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]


def get_club_by_id(club_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch club details by ID.
    """
    with get_db() as conn:
        row = conn.execute("SELECT * FROM clubs WHERE id = ?", (club_id,)).fetchone()
        return dict(row) if row else None


def add_club(name: str, campus: str, description: Optional[str] = None, club_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Register a new club assigned to a specific campus.
    """
    cid = club_id or f"club-{int(datetime.now().timestamp() * 1000)}"
    with get_db() as conn:
        conn.execute("""
            INSERT INTO clubs (id, name, campus, description, is_active)
            VALUES (?, ?, ?, ?, 1)
        """, (cid, name.strip(), campus.strip(), description.strip() if description else None))
        conn.commit()
    return get_club_by_id(cid)


def update_club(club_id: str, name: Optional[str] = None, campus: Optional[str] = None, 
                description: Optional[str] = None, is_active: Optional[int] = None) -> Optional[Dict[str, Any]]:
    """
    Update club metadata and active status.
    """
    club = get_club_by_id(club_id)
    if not club:
        return None
    new_name = name.strip() if name else club["name"]
    new_campus = campus.strip() if campus else club["campus"]
    new_desc = description.strip() if description is not None else club["description"]
    new_active = is_active if is_active is not None else club["is_active"]

    with get_db() as conn:
        conn.execute("""
            UPDATE clubs 
            SET name = ?, campus = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (new_name, new_campus, new_desc, new_active, club_id))
        conn.commit()
    return get_club_by_id(club_id)


def toggle_club_status(club_id: str, is_active: Optional[int] = None) -> Optional[Dict[str, Any]]:
    """
    Toggle or set club connected / active status (1 = enabled/connected, 0 = disabled/disconnected).
    """
    club = get_club_by_id(club_id)
    if not club:
        return None
    new_active = is_active if is_active is not None else (0 if club["is_active"] == 1 else 1)
    with get_db() as conn:
        conn.execute("""
            UPDATE clubs 
            SET is_active = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        """, (new_active, club_id))
        conn.commit()
    return get_club_by_id(club_id)


def delete_club(club_id: str) -> bool:
    """
    Delete a club and its associated candidates.
    """
    club = get_club_by_id(club_id)
    if not club:
        return False
    with get_db() as conn:
        # Delete candidates linked to this club
        conn.execute("DELETE FROM candidates WHERE club_id = ?", (club_id,))
        cursor = conn.execute("DELETE FROM clubs WHERE id = ?", (club_id,))
        conn.commit()
        return cursor.rowcount > 0
