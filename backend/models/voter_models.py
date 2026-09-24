from typing import Optional, List
from pydantic import BaseModel


class GoogleAuthRequest(BaseModel):
    id_token: str


class EligibilityCheckRequest(BaseModel):
    email: Optional[str] = None
    student_id: Optional[str] = None


class SingleVoteSelection(BaseModel):
    club_id: str
    candidate_id: str


class CastMultiVoteRequest(BaseModel):
    email: Optional[str] = None
    student_id: Optional[str] = None
    votes: List[SingleVoteSelection]


class CastVoteRequest(BaseModel):
    club_id: str
    email: Optional[str] = None
    student_id: Optional[str] = None
    candidate_id: str
