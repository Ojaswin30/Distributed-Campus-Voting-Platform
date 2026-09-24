from typing import Optional, Dict, Any
from repositories import (
    get_campus_by_id,
    get_clubs,
    has_student_voted_in_club,
    get_candidates_by_club,
)


def build_student_ballot_payload(student: Dict[str, Any], extra_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Assembles campus-specific clubs, candidates, and real-time voting status for a student.
    Strictly filters out other campuses' data.
    """
    student_campus = student["campus"]
    campus_info = get_campus_by_id(student_campus)
    
    # Strictly fetch clubs belonging to this student's campus
    campus_clubs = get_clubs(active_only=True, campus=student_campus)
    
    clubs_ballot = []
    voted_club_ids = []
    
    for club in campus_clubs:
        has_voted = has_student_voted_in_club(student["enrollment_id"], club["id"])
        if has_voted:
            voted_club_ids.append(club["id"])
            
        candidates = get_candidates_by_club(club["id"])
        
        clubs_ballot.append({
            "id": club["id"],
            "name": club["name"],
            "campus": club["campus"],
            "description": club["description"],
            "has_voted": has_voted,
            "votes_cast": sum(c["votes_count"] for c in candidates),
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

    all_campus_voted = (len(campus_clubs) > 0 and len(voted_club_ids) == len(campus_clubs))

    return {
        "success": True,
        "is_eligible": True,
        "student": {
            "enrollment_id": student["enrollment_id"],
            "name": extra_profile.get("name") if extra_profile and extra_profile.get("name") else student["name"],
            "email": student["email"],
            "department": student["department"],
            "campus": student_campus,
            "campus_code": campus_info.get("code") if campus_info else "CAMPUS",
            "campus_location": campus_info.get("location") if campus_info else None,
            "picture": extra_profile.get("picture") if extra_profile else None
        },
        "campus": student_campus,
        "campus_clubs_count": len(campus_clubs),
        "voted_club_ids": voted_club_ids,
        "all_campus_voted": all_campus_voted,
        "ballot_clubs": clubs_ballot,
        "message": f"Welcome, {student['name']}! Restricted to {student_campus} ballot."
    }
