from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query

from models.admin_models import (
    AdminLoginRequest,
    AddCampusRequest,
    UpdateCampusRequest,
    AddClubRequest,
    UpdateClubRequest,
    AddStudentRequest,
    BulkStudentUploadRequest,
    AddCandidateRequest,
)
import repositories as db

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ============================================================================
# ADMIN AUTHENTICATION
# ============================================================================

@router.post("/login")
def admin_login(req: AdminLoginRequest):
    """
    Authenticate election admin credentials against SQLite database.
    Strictly isolated from student logins.
    """
    if not req.username or not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin Officer ID / Username and password are required."
        )

    admin = db.authenticate_admin(req.username, req.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Admin ID or password. Access is strictly restricted to designated Election Officers."
        )

    return {
        "success": True,
        "message": f"Welcome, {admin['full_name'] or admin['username']}!",
        "admin": {
            "id": admin["id"],
            "username": admin["username"],
            "full_name": admin["full_name"],
            "role": admin["role"]
        }
    }


# ============================================================================
# CAMPUS MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/campuses")
def get_campuses_endpoint(active_only: bool = False):
    """
    List all university campuses with summary counts for students, clubs, and candidate registries.
    """
    try:
        campuses = db.get_campuses(active_only=active_only)
        return {
            "success": True,
            "total_campuses": len(campuses),
            "campuses": campuses
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add-campus")
def add_campus_endpoint(req: AddCampusRequest):
    """
    Register a new campus location in the SQLite database.
    """
    if not req.name or not req.name.strip():
        raise HTTPException(status_code=400, detail="Campus Name is required.")
    if not req.code or not req.code.strip():
        raise HTTPException(status_code=400, detail="Campus Code is required (e.g. MAIN, NORTH).")

    try:
        campus = db.add_campus(
            name=req.name,
            code=req.code,
            location=req.location,
            description=req.description
        )
        return {
            "success": True,
            "message": f"Campus '{campus['name']}' registered successfully.",
            "campus": campus
        }
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(status_code=409, detail="A campus with this name or code already exists.")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/update-campus/{campus_id}")
def update_campus_endpoint(campus_id: str, req: UpdateCampusRequest):
    """
    Update campus details or active status.
    """
    try:
        updated = db.update_campus(
            campus_id=campus_id,
            name=req.name,
            code=req.code,
            location=req.location,
            description=req.description,
            is_active=req.is_active
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Campus not found.")
        return {
            "success": True,
            "message": f"Campus '{updated['name']}' updated successfully.",
            "campus": updated
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete-campus/{campus_id}")
def delete_campus_endpoint(campus_id: str, force: bool = Query(False, description="Force delete campus and any enrolled students")):
    """
    Delete a campus and cleanly cascade-remove its associated clubs and candidates.
    """
    try:
        success = db.delete_campus(campus_id, force=force)
        if not success:
            raise HTTPException(status_code=404, detail="Campus not found.")
        return {
            "success": True,
            "message": "Campus and associated clubs deleted successfully."
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DASHBOARD OVERVIEW & ANALYTICS
# ============================================================================

@router.get("/dashboard-data")
def get_admin_dashboard_data(campus: Optional[str] = Query(None, description="Optional campus filter")):
    """
    Fetch comprehensive dashboard metrics, campuses list, active club leaderboards, registered students, and voter turnout records.
    """
    try:
        campuses = db.get_campuses(active_only=False)
        clubs = db.get_clubs(active_only=False, campus=campus)
        students = db.get_students(campus=campus)
        total_votes = db.get_total_votes_count(campus=campus)
        voter_logs = db.get_all_votes_with_details(campus=campus)

        clubs_with_candidates = []
        for club in clubs:
            candidates = db.get_candidates_by_club(club["id"])
            club_votes = sum(c["votes_count"] for c in candidates)
            clubs_with_candidates.append({
                "id": club["id"],
                "name": club["name"],
                "campus": club["campus"],
                "description": club["description"],
                "is_active": club["is_active"],
                "votes_cast": club_votes,
                "candidates": [
                    {
                        "id": c["id"],
                        "student_id": c["student_id"],
                        "name": c["student_name"],
                        "email": c["student_email"],
                        "department": c["student_department"],
                        "campus": c["student_campus"],
                        "votes": c["votes_count"]
                    }
                    for c in candidates
                ]
            })

        all_students_master = db.get_students()
        all_clubs_master = db.get_clubs(active_only=False)

        return {
            "success": True,
            "selected_campus_filter": campus,
            "total_votes": total_votes,
            "total_campuses": len(campuses),
            "total_students": len(students),
            "total_clubs": len(clubs),
            "campuses": campuses,
            "clubs": clubs_with_candidates,
            "students": students,
            "voter_logs": voter_logs,
            "all_campuses": campuses,
            "all_clubs": all_clubs_master,
            "all_students": all_students_master
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============================================================================
# ENTITY MANAGEMENT (CLUBS, CANDIDATES, STUDENTS)
# ============================================================================

@router.post("/add-club")
def add_club_endpoint(req: AddClubRequest):
    """
    Create a new election club in SQLite assigned to a specific campus.
    """
    if not req.name or not req.name.strip():
        raise HTTPException(status_code=400, detail="Club Name is required.")
    if not req.campus or not req.campus.strip():
        raise HTTPException(status_code=400, detail="Campus is required.")

    campus = db.get_campus_by_id(req.campus)
    campus_name = campus["name"] if campus else req.campus.strip()

    try:
        club = db.add_club(
            name=req.name,
            campus=campus_name,
            description=req.description
        )
        return {
            "success": True,
            "message": f"Club '{club['name']}' created successfully for {club['campus']}.",
            "club": club
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/update-club/{club_id}")
def update_club_endpoint(club_id: str, req: UpdateClubRequest):
    """
    Update club settings and active status.
    """
    try:
        updated = db.update_club(
            club_id=club_id,
            name=req.name,
            campus=req.campus,
            description=req.description,
            is_active=req.is_active
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Club not found.")
        return {
            "success": True,
            "message": f"Club '{updated['name']}' updated successfully.",
            "club": updated
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/toggle-club/{club_id}")
def toggle_club_endpoint(club_id: str, is_active: Optional[int] = Query(None)):
    """
    Toggle or set club connected / active status for its campus.
    """
    try:
        updated = db.toggle_club_status(club_id=club_id, is_active=is_active)
        if not updated:
            raise HTTPException(status_code=404, detail="Club not found.")
        status_text = "connected & active" if updated["is_active"] == 1 else "disabled & disconnected"
        return {
            "success": True,
            "message": f"Club '{updated['name']}' is now {status_text}.",
            "club": updated
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete-club/{club_id}")
def delete_club_endpoint(club_id: str):
    """
    Delete a specific club and its candidate associations.
    """
    try:
        deleted = db.delete_club(club_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Club not found.")
        return {
            "success": True,
            "message": "Club and candidate associations removed successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add-student")
def add_student_endpoint(req: AddStudentRequest):
    """
    Register a new student in the SQLite registry linked to a campus.
    """
    if not req.enrollment_id or not req.enrollment_id.strip():
        raise HTTPException(status_code=400, detail="Enrollment ID / Student ID is required.")
    if not req.name or not req.name.strip():
        raise HTTPException(status_code=400, detail="Student Name is required.")
    if not req.campus or not req.campus.strip():
        raise HTTPException(status_code=400, detail="Campus is required.")

    existing = db.get_student_by_id(req.enrollment_id)
    if existing:
        raise HTTPException(status_code=409, detail=f"Student ID '{req.enrollment_id}' already registered.")

    campus = db.get_campus_by_id(req.campus)
    campus_name = campus["name"] if campus else req.campus.strip()

    try:
        student = db.add_student(
            enrollment_id=req.enrollment_id,
            name=req.name,
            email=req.email,
            department=req.department,
            campus=campus_name
        )
        return {
            "success": True,
            "message": f"Student '{student['name']}' registered successfully at {student['campus']}.",
            "student": student
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk-upload-students")
def bulk_upload_students_endpoint(req: BulkStudentUploadRequest):
    """
    Bulk import multiple students directly into SQLite database.
    """
    if not req.students:
        raise HTTPException(status_code=400, detail="No student records provided.")
        
    students_data = [s.dict() for s in req.students]
    result = db.bulk_add_students(students_data)
    
    return {
        "success": True,
        "message": f"Successfully registered/updated {result['successful_records']} of {result['total_processed']} students.",
        "details": result
    }


@router.delete("/student/{enrollment_id}")
def delete_student_endpoint(enrollment_id: str):
    """
    Delete a specific student by enrollment ID.
    """
    deleted = db.delete_student(enrollment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Student not found.")
    return {
        "success": True,
        "message": f"Student '{enrollment_id}' deleted successfully."
    }


@router.post("/clear-students")
def clear_students_endpoint(campus: Optional[str] = Query(None, description="Optional campus filter")):
    """
    Delete all students (or students of a specific campus).
    """
    count = db.clear_all_students(campus=campus)
    target = campus if campus else "all campuses"
    return {
        "success": True,
        "message": f"Successfully deleted {count} student records from {target}.",
        "deleted_count": count
    }


@router.post("/add-candidate")
def add_candidate_endpoint(req: AddCandidateRequest):
    """
    Assign a registered student as a candidate for an election club within their campus.
    """
    if not req.student_id or not req.club_id:
        raise HTTPException(status_code=400, detail="Student ID and Club ID are required.")

    try:
        candidate = db.add_candidate(
            student_id=req.student_id,
            club_id=req.club_id
        )
        return {
            "success": True,
            "message": f"Candidate '{candidate['student_name']}' registered successfully for '{candidate['club_name']}'.",
            "candidate": candidate
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        if "UNIQUE constraint failed: candidates.student_id" in str(e):
            raise HTTPException(
                status_code=409, 
                detail=f"Student '{req.student_id}' is already registered as a candidate in an election."
            )
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete-candidate/{candidate_id}")
def delete_candidate_endpoint(candidate_id: str):
    """
    Remove a candidate from an election.
    """
    success = db.delete_candidate(candidate_id)
    if not success:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return {
        "success": True,
        "message": "Candidate removed successfully."
    }
