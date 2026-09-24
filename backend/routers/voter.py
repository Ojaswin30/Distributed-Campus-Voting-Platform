from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query

from models.voter_models import (
    GoogleAuthRequest,
    EligibilityCheckRequest,
    CastMultiVoteRequest,
    CastVoteRequest,
)
import repositories as db
from services.google_auth_service import verify_google_id_token
from services.ballot_service import build_student_ballot_payload

router = APIRouter(prefix="/api/voter", tags=["Voter"])


# ============================================================================
# VOTER AUTHENTICATION & BALLOT GENERATION
# ============================================================================

@router.post("/google-login")
def google_login_endpoint(req: GoogleAuthRequest):
    """
    Authenticate student via verified Google OAuth2 ID token, look up campus, and restrict access to their campus ballot.
    STRICT ACCESS: Only pre-registered students in the SQLite database are allowed access.
    """
    token_payload = verify_google_id_token(req.id_token)
    verified_email = token_payload.get("email", "").strip().lower()
    
    if not verified_email:
        raise HTTPException(status_code=401, detail="Google token did not contain a valid email address.")

    student = db.get_student_by_email(verified_email)

    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: The Google account '{verified_email}' is not registered in the student database. Only pre-registered students authorized by the election administrator can vote."
        )

    return build_student_ballot_payload(student, extra_profile=token_payload)


@router.post("/check-eligibility")
def check_eligibility(req: EligibilityCheckRequest):
    """
    Check student eligibility and return full campus-restricted ballot and voting history in one step.
    STRICT ACCESS: Rejects any student not pre-registered in SQLite.
    """
    identifier = (req.email or req.student_id or "").strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="College email or Student ID is required for verification.")

    student = db.get_student_by_email_or_id(identifier)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: '{identifier}' is not registered in the student database. Please contact your campus election officer to get registered."
        )

    return build_student_ballot_payload(student)


@router.get("/campus-ballot")
def get_campus_ballot(identifier: str = Query(..., description="Student Email or Enrollment ID")):
    """
    Fetch seamless campus-specific ballot for a verified student.
    """
    student = db.get_student_by_email_or_id(identifier)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    return build_student_ballot_payload(student)


@router.get("/clubs")
def get_voter_clubs(campus: Optional[str] = None):
    """
    Fetch active election clubs with candidate lists and real-time live turnout metrics, optionally filtered by campus.
    """
    try:
        clubs = db.get_clubs(active_only=True, campus=campus)
        total_votes = db.get_total_votes_count(campus=campus)

        results = []
        for club in clubs:
            candidates = db.get_candidates_by_club(club["id"])
            club_votes = sum(c["votes_count"] for c in candidates)
            results.append({
                "id": club["id"],
                "name": club["name"],
                "campus": club["campus"],
                "description": club["description"],
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

        return {
            "success": True,
            "campus_filter": campus,
            "total_votes_cast": total_votes,
            "clubs": results
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============================================================================
# BALLOT CASTING ENDPOINTS
# ============================================================================

@router.post("/cast-multi-vote")
def cast_multi_vote_endpoint(req: CastMultiVoteRequest):
    """
    Seamless multi-club voting endpoint:
    Allows students to submit all their club candidate choices in one single atomic transaction.
    Enforces strict campus boundary and duplicate vote prevention.
    """
    identifier = (req.email or req.student_id or "").strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Student email or ID is required.")
    
    if not req.votes or len(req.votes) == 0:
        raise HTTPException(status_code=400, detail="No candidate selections provided.")

    try:
        vote_payload = [{"club_id": v.club_id, "candidate_id": v.candidate_id} for v in req.votes]
        result = db.cast_multi_votes(
            student_identifier=identifier,
            vote_selections=vote_payload
        )

        return {
            "success": True,
            "message": f"Successfully cast and recorded {result['total_clubs_voted']} votes across your campus clubs!",
            "receipt": result
        }
    except ValueError as ve:
        err_msg = str(ve)
        if "DUPLICATE_VOTE" in err_msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=err_msg)
        elif "CAMPUS_ACCESS_DENIED" in err_msg:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=err_msg)
        elif "STUDENT_NOT_FOUND" in err_msg or "CANDIDATE_NOT_FOUND" in err_msg or "CLUB_NOT_FOUND" in err_msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err_msg)
        else:
            raise HTTPException(status_code=400, detail=err_msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database transaction error: {str(e)}")


@router.post("/cast-vote")
def cast_vote_endpoint(req: CastVoteRequest):
    """
    Cast a single club vote (delegates to multi-vote validation internally).
    """
    identifier = (req.email or req.student_id or "").strip()
    if not req.club_id or not identifier or not req.candidate_id:
        raise HTTPException(
            status_code=400,
            detail="club_id, Gmail / student_id, and candidate_id are required to cast a vote."
        )

    try:
        vote_result = db.cast_vote(
            student_id=identifier,
            candidate_id=req.candidate_id
        )

        return {
            "success": True,
            "message": "Vote successfully cast and recorded in SQLite database!",
            "vote_details": {
                "receipt_id": vote_result["vote_id"],
                "voter_email": vote_result["student_email"] or identifier,
                "club_name": vote_result["club_name"],
                "candidate_name": vote_result["candidate_name"],
                "timestamp": vote_result["timestamp"]
            }
        }
    except ValueError as ve:
        err_msg = str(ve)
        if "DUPLICATE_VOTE" in err_msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=err_msg)
        elif "CAMPUS_ACCESS_DENIED" in err_msg:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=err_msg)
        elif "STUDENT_NOT_FOUND" in err_msg or "CANDIDATE_NOT_FOUND" in err_msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err_msg)
        else:
            raise HTTPException(status_code=400, detail=err_msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database transaction error: {str(e)}")
