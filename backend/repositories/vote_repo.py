import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from core.database import get_db
from repositories.student_repo import get_student_by_email_or_id
from repositories.club_repo import get_club_by_id
from repositories.candidate_repo import get_candidate_by_id


def has_student_voted_in_club(student_id: str, club_id: str) -> bool:
    """
    Check if student has already voted in a particular club election.
    """
    with get_db() as conn:
        row = conn.execute("""
            SELECT 1 FROM votes v
            JOIN candidates c ON v.candidate_id = c.id
            WHERE LOWER(v.student_id) = LOWER(?) AND c.club_id = ?
        """, (student_id.strip(), club_id.strip())).fetchone()
        return bool(row)


def cast_multi_votes(student_identifier: str, vote_selections: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Atomically cast multiple club selections in one seamless submission.
    Validates:
      1. Student exists and identifies their registered campus.
      2. Every selected club and candidate belongs to the student's registered campus.
      3. Student has not already voted in any of the selected clubs.
      4. Single atomic SQLite transaction increments counters and records vote logs.
    """
    student = get_student_by_email_or_id(student_identifier)
    if not student:
        raise ValueError(f"STUDENT_NOT_FOUND: Student '{student_identifier}' is not registered in the system.")

    if not vote_selections or len(vote_selections) == 0:
        raise ValueError("NO_VOTES: No club candidate selections were provided.")

    student_campus = student["campus"].strip()
    student_enrollment = student["enrollment_id"]
    now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Step 1: Pre-validation of all selections
    validated_votes = []
    seen_clubs = set()

    for item in vote_selections:
        club_id = item.get("club_id")
        candidate_id = item.get("candidate_id")

        if not club_id or not candidate_id:
            raise ValueError("INVALID_PAYLOAD: Each vote must specify both club_id and candidate_id.")

        if club_id in seen_clubs:
            raise ValueError(f"DUPLICATE_SELECTION: Multiple candidate selections submitted for club '{club_id}'.")
        seen_clubs.add(club_id)

        club = get_club_by_id(club_id)
        if not club:
            raise ValueError(f"CLUB_NOT_FOUND: Club '{club_id}' does not exist.")

        # STRICT CAMPUS ACCESS CHECK
        if club["campus"].strip().lower() != student_campus.lower():
            raise ValueError(
                f"CAMPUS_ACCESS_DENIED: Student '{student['name']}' belongs to '{student_campus}', "
                f"but club '{club['name']}' is restricted to '{club['campus']}'."
            )

        candidate = get_candidate_by_id(candidate_id)
        if not candidate:
            raise ValueError(f"CANDIDATE_NOT_FOUND: Candidate '{candidate_id}' does not exist.")

        if candidate["club_id"] != club_id:
            raise ValueError(f"CANDIDATE_MISMATCH: Candidate '{candidate['student_name']}' does not belong to club '{club['name']}'.")

        # Duplicate Vote check
        if has_student_voted_in_club(student_enrollment, club_id):
            raise ValueError(f"DUPLICATE_VOTE: You have already cast a ballot for '{club['name']}'.")

        validated_votes.append({
            "club_id": club_id,
            "club_name": club["name"],
            "candidate_id": candidate_id,
            "candidate_name": candidate["student_name"],
            "candidate_department": candidate["student_department"]
        })

    # Step 2: Atomic SQLite Transaction
    receipt_codes = []
    ballot_details = []

    with get_db() as conn:
        for v in validated_votes:
            vote_id = f"VOTE-{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:6].upper()}"
            conn.execute("""
                INSERT INTO votes (id, student_id, candidate_id, created_at)
                VALUES (?, ?, ?, ?)
            """, (vote_id, student_enrollment, v["candidate_id"], now_iso))

            conn.execute("""
                UPDATE candidates
                SET votes_count = votes_count + 1
                WHERE id = ?
            """, (v["candidate_id"],))

            receipt_codes.append(vote_id)
            ballot_details.append({
                "vote_id": vote_id,
                "student_id": student_enrollment,
                "student_name": student["name"],
                "student_email": student["email"],
                "student_campus": student_campus,
                "club_id": v["club_id"],
                "club_name": v["club_name"],
                "candidate_id": v["candidate_id"],
                "candidate_name": v["candidate_name"],
                "candidate_department": v["candidate_department"],
                "timestamp": now_iso
            })

        conn.commit()

    master_receipt_id = f"BATCH-{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:4].upper()}"

    return {
        "master_receipt_id": master_receipt_id,
        "student_id": student_enrollment,
        "student_name": student["name"],
        "student_email": student["email"],
        "student_campus": student_campus,
        "total_clubs_voted": len(ballot_details),
        "timestamp": now_iso,
        "ballots": ballot_details
    }


def cast_vote(student_id: str, candidate_id: str) -> Dict[str, Any]:
    """
    Single-club vote helper (delegates to multi-vote flow for strict campus validation).
    """
    candidate = get_candidate_by_id(candidate_id)
    if not candidate:
        raise ValueError(f"CANDIDATE_NOT_FOUND: Candidate '{candidate_id}' does not exist.")
    
    multi_res = cast_multi_votes(
        student_identifier=student_id,
        vote_selections=[{"club_id": candidate["club_id"], "candidate_id": candidate_id}]
    )
    return multi_res["ballots"][0]


def get_all_votes_with_details(campus: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Fetch comprehensive audit logs with voter and candidate details, optionally filtered by campus.
    """
    with get_db() as conn:
        query = """
            SELECT 
                v.id AS vote_id,
                v.student_id,
                s.name AS student_name,
                s.email AS student_email,
                s.department AS student_department,
                s.campus AS student_campus,
                c.club_id,
                cl.name AS club_name,
                cl.campus AS club_campus,
                c.id AS candidate_id,
                cand_s.name AS candidate_name,
                v.created_at AS voted_at
            FROM votes v
            JOIN students s ON v.student_id = s.enrollment_id
            JOIN candidates c ON v.candidate_id = c.id
            JOIN students cand_s ON c.student_id = cand_s.enrollment_id
            JOIN clubs cl ON c.club_id = cl.id
        """
        params = []
        if campus:
            query += " WHERE LOWER(cl.campus) = LOWER(?) OR LOWER(s.campus) = LOWER(?)"
            params.extend([campus.strip(), campus.strip()])
        query += " ORDER BY v.created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]


def get_total_votes_count(campus: Optional[str] = None) -> int:
    """
    Fetch total votes count, optionally filtered by campus.
    """
    with get_db() as conn:
        if campus:
            row = conn.execute("""
                SELECT COUNT(*) AS count FROM votes v
                JOIN candidates c ON v.candidate_id = c.id
                JOIN clubs cl ON c.club_id = cl.id
                WHERE LOWER(cl.campus) = LOWER(?)
            """, (campus.strip(),)).fetchone()
        else:
            row = conn.execute("SELECT COUNT(*) AS count FROM votes").fetchone()
        return row["count"] if row else 0
