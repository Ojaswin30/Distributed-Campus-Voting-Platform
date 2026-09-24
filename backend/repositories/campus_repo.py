from datetime import datetime
from typing import Optional, List, Dict, Any
from core.database import get_db


def normalize_campus_name(raw_campus: Optional[str], default_campus: str = "Bengaluru Campus") -> str:
    """
    Normalizes messy or abbreviated campus names against database campuses and fallback aliases.
    """
    if not raw_campus or not str(raw_campus).strip():
        return default_campus
    raw = str(raw_campus).strip()
    raw_clean = raw.lower().replace("campus", "").replace("center", "").strip()

    # Query all existing campuses from database
    try:
        with get_db() as conn:
            campuses = conn.execute("SELECT name, code FROM campuses").fetchall()
            for c in campuses:
                c_name = c["name"]
                c_clean = c_name.lower().replace("campus", "").replace("center", "").strip()
                c_code = c["code"].lower()
                
                # Check exact or cleaned matches
                if raw.lower() == c_name.lower() or raw.lower() == c_code:
                    return c_name
                if raw_clean and (raw_clean == c_clean or raw_clean in c_clean or c_clean in raw_clean):
                    return c_name
    except Exception:
        pass

    # Hardcoded aliases as fallback
    raw_lower = raw.lower()
    if "bengaluru" in raw_lower or "bangalore" in raw_lower or raw_lower == "blr":
        return "Bengaluru Campus"
    elif "noida" in raw_lower or raw_lower == "noi":
        return "Noida Campus"
    elif "lucknow" in raw_lower or raw_lower == "lko":
        return "Lucknow Campus"
    elif "pune" in raw_lower or raw_lower == "pun":
        return "Pune Campus"
    elif "patna" in raw_lower or raw_lower == "pat" or raw_lower == "pta":
        return "Patna Campus"
    elif "delhi" in raw_lower or raw_lower == "dli" or raw_lower == "del":
        return "Delhi Campus"
    elif "indore" in raw_lower or raw_lower == "ind":
        return "Indore Campus"

    if not raw.lower().endswith("campus"):
        return f"{raw} Campus"

    return raw


def get_campuses(active_only: bool = False) -> List[Dict[str, Any]]:
    """
    List all campuses with aggregated counts for students, clubs, candidates, and votes.
    """
    with get_db() as conn:
        query = "SELECT * FROM campuses"
        if active_only:
            query += " WHERE is_active = 1"
        query += " ORDER BY name ASC"
        rows = conn.execute(query).fetchall()
        
        results = []
        for r in rows:
            c = dict(r)
            s_count = conn.execute(
                "SELECT COUNT(*) AS count FROM students WHERE LOWER(campus) = LOWER(?)", 
                (c["name"],)
            ).fetchone()["count"]
            cl_count = conn.execute(
                "SELECT COUNT(*) AS count FROM clubs WHERE LOWER(campus) = LOWER(?)", 
                (c["name"],)
            ).fetchone()["count"]
            cand_count = conn.execute("""
                SELECT COUNT(*) AS count FROM candidates cand
                JOIN clubs cl ON cand.club_id = cl.id
                WHERE LOWER(cl.campus) = LOWER(?)
            """, (c["name"],)).fetchone()["count"]
            v_count = conn.execute("""
                SELECT COUNT(*) AS count FROM votes v
                JOIN candidates cand ON v.candidate_id = cand.id
                JOIN clubs cl ON cand.club_id = cl.id
                WHERE LOWER(cl.campus) = LOWER(?)
            """, (c["name"],)).fetchone()["count"]
            
            c["students_count"] = s_count
            c["clubs_count"] = cl_count
            c["candidates_count"] = cand_count
            c["votes_count"] = v_count
            results.append(c)
        return results


def get_campus_by_id(campus_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch a campus by its UUID or case-insensitive name.
    """
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM campuses WHERE id = ? OR LOWER(name) = LOWER(?)", 
            (campus_id, campus_id)
        ).fetchone()
        return dict(row) if row else None


def add_campus(name: str, code: str, location: Optional[str] = None, description: Optional[str] = None) -> Dict[str, Any]:
    """
    Create a new campus record and initialize standard clubs.
    """
    from repositories.club_repo import ensure_campus_clubs
    cid = f"campus-{int(datetime.now().timestamp() * 1000)}"
    clean_name = name.strip()
    with get_db() as conn:
        conn.execute("""
            INSERT INTO campuses (id, name, code, location, description, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
        """, (cid, clean_name, code.strip().upper(), location.strip() if location else None, description.strip() if description else None))
        conn.commit()
    ensure_campus_clubs(clean_name)
    return get_campus_by_id(cid)


def update_campus(campus_id: str, name: Optional[str] = None, code: Optional[str] = None, 
                  location: Optional[str] = None, description: Optional[str] = None, 
                  is_active: Optional[int] = None) -> Optional[Dict[str, Any]]:
    """
    Update campus details. If name changed, cascades update to linked students and clubs.
    """
    campus = get_campus_by_id(campus_id)
    if not campus:
        return None
    old_name = campus["name"]
    new_name = name.strip() if name else campus["name"]
    new_code = code.strip().upper() if code else campus["code"]
    new_loc = location.strip() if location is not None else campus["location"]
    new_desc = description.strip() if description is not None else campus["description"]
    new_active = is_active if is_active is not None else campus["is_active"]

    with get_db() as conn:
        conn.execute("""
            UPDATE campuses 
            SET name = ?, code = ?, location = ?, description = ?, is_active = ?
            WHERE id = ?
        """, (new_name, new_code, new_loc, new_desc, new_active, campus["id"]))

        # If campus name changed, update linked students and clubs
        if new_name != old_name:
            conn.execute("UPDATE students SET campus = ? WHERE LOWER(campus) = LOWER(?)", (new_name, old_name))
            conn.execute("UPDATE clubs SET campus = ? WHERE LOWER(campus) = LOWER(?)", (new_name, old_name))

        conn.commit()
    return get_campus_by_id(campus["id"])


def delete_campus(campus_id: str, force: bool = False) -> bool:
    """
    Delete a campus. Automatically cleans up associated clubs and candidates.
    If students are still enrolled, requires force=True or explicit student reassignment.
    """
    campus = get_campus_by_id(campus_id)
    if not campus:
        return False
    c_name = campus["name"]
    with get_db() as conn:
        has_students = conn.execute("SELECT 1 FROM students WHERE LOWER(campus) = LOWER(?)", (c_name,)).fetchone()
        if has_students and not force:
            raise ValueError(f"Cannot delete campus '{c_name}' because registered students are assigned to it. Please delete or reassign students first.")
        
        # Cascade remove candidates in this campus
        conn.execute("""
            DELETE FROM candidates 
            WHERE club_id IN (SELECT id FROM clubs WHERE LOWER(campus) = LOWER(?))
        """, (c_name,))

        # Cascade remove clubs in this campus
        conn.execute("DELETE FROM clubs WHERE LOWER(campus) = LOWER(?)", (c_name,))

        # If force is true, also remove students
        if force and has_students:
            conn.execute("DELETE FROM students WHERE LOWER(campus) = LOWER(?)", (c_name,))

        cursor = conn.execute("DELETE FROM campuses WHERE id = ?", (campus["id"],))
        conn.commit()
        return cursor.rowcount > 0
