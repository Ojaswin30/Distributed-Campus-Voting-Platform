from datetime import datetime
from typing import Optional, List, Dict, Any
from core.database import get_db
from repositories.student_repo import get_student_by_id
from repositories.club_repo import get_club_by_id


def get_candidates_by_club(club_id: str) -> List[Dict[str, Any]]:
    """
    Fetch all candidates running in a specific club election with candidate student details.
    """
    with get_db() as conn:
        rows = conn.execute("""
            SELECT 
                c.id,
                c.student_id,
                s.name AS student_name,
                s.email AS student_email,
                s.department AS student_department,
                s.campus AS student_campus,
                c.club_id,
                cl.name AS club_name,
                cl.campus AS club_campus,
                c.votes_count,
                c.created_at
            FROM candidates c
            JOIN students s ON c.student_id = s.enrollment_id
            JOIN clubs cl ON c.club_id = cl.id
            WHERE c.club_id = ?
            ORDER BY c.votes_count DESC, s.name ASC
        """, (club_id,)).fetchall()
        return [dict(row) for row in rows]


def get_candidate_by_id(candidate_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch a single candidate with detailed information.
    """
    with get_db() as conn:
        row = conn.execute("""
            SELECT 
                c.id,
                c.student_id,
                s.name AS student_name,
                s.email AS student_email,
                s.department AS student_department,
                s.campus AS student_campus,
                c.club_id,
                cl.name AS club_name,
                cl.campus AS club_campus,
                c.votes_count,
                c.created_at
            FROM candidates c
            JOIN students s ON c.student_id = s.enrollment_id
            JOIN clubs cl ON c.club_id = cl.id
            WHERE c.id = ?
        """, (candidate_id,)).fetchone()
        return dict(row) if row else None


def add_candidate(student_id: str, club_id: str, candidate_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Assign a registered student as a candidate in a club, verifying campus integrity.
    """
    student = get_student_by_id(student_id)
    if not student:
        raise ValueError(f"Student with ID '{student_id}' does not exist in student registry.")
    
    club = get_club_by_id(club_id)
    if not club:
        raise ValueError(f"Club with ID '{club_id}' does not exist.")

    # Campus cross-check: Candidate student must belong to the same campus as the club
    if student["campus"].strip().lower() != club["campus"].strip().lower():
        raise ValueError(f"CAMPUS_MISMATCH: Student '{student['name']}' is enrolled in '{student['campus']}' but club '{club['name']}' is assigned to '{club['campus']}'. Candidate and club must belong to the same campus.")

    cand_id = candidate_id or f"cand-{int(datetime.now().timestamp() * 1000)}"
    with get_db() as conn:
        conn.execute("""
            INSERT INTO candidates (id, student_id, club_id, votes_count)
            VALUES (?, ?, ?, 0)
        """, (cand_id, student_id.strip(), club_id.strip()))
        conn.commit()
    return get_candidate_by_id(cand_id)


def delete_candidate(candidate_id: str) -> bool:
    """
    Remove a candidate by ID.
    """
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM candidates WHERE id = ?", (candidate_id,))
        conn.commit()
        return cursor.rowcount > 0
