from typing import Optional, List
from pydantic import BaseModel


class GoogleAuthRequest(BaseModel):
    id_token: str


class CreateAdminRequestTicket(BaseModel):
    email: str
    name: str
    department: Optional[str] = None
    reason: Optional[str] = None


class AddAdminAccountRequest(BaseModel):
    email: str
    full_name: Optional[str] = None
    role: str = "admin"


class UpdateAdminAccountRequest(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[int] = None


class AddCampusRequest(BaseModel):
    name: str
    code: str
    location: Optional[str] = None
    description: Optional[str] = None


class UpdateCampusRequest(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[int] = None


class AddClubRequest(BaseModel):
    name: str
    campus: str
    description: Optional[str] = None


class UpdateClubRequest(BaseModel):
    name: Optional[str] = None
    campus: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[int] = None


class AddStudentRequest(BaseModel):
    enrollment_id: str
    name: str
    email: Optional[str] = None
    department: Optional[str] = None
    campus: str = "Bengaluru Campus"


class StudentUploadItem(BaseModel):
    enrollment_id: str
    name: str
    email: Optional[str] = None
    department: Optional[str] = None
    campus: Optional[str] = "Bengaluru Campus"


class BulkStudentUploadRequest(BaseModel):
    students: List[StudentUploadItem]


class AddCandidateRequest(BaseModel):
    student_id: str
    club_id: str
