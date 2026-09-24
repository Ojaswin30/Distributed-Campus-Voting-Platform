from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query
from models.admin_models import (
    AddAdminAccountRequest,
    UpdateAdminAccountRequest,
    CreateAdminRequestTicket
)
import repositories as db

router = APIRouter(prefix="/api/superadmin", tags=["Superadmin"])


# ============================================================================
# ADMIN ACCESS REQUEST TICKETS ENDPOINTS
# ============================================================================

@router.post("/requests/create")
def submit_admin_request(req: CreateAdminRequestTicket):
    """
    Public/Faculty endpoint to raise an Admin Access Request ticket.
    """
    if not req.email or not req.email.strip():
        raise HTTPException(status_code=400, detail="Google Email is required.")
    if not req.name or not req.name.strip():
        raise HTTPException(status_code=400, detail="Full Name is required.")

    try:
        ticket = db.create_admin_request(
            email=req.email,
            name=req.name,
            department=req.department,
            reason=req.reason
        )
        return {
            "success": True,
            "message": "Admin access request ticket submitted successfully. An administrator will review your application.",
            "ticket": ticket
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/requests")
def list_admin_requests(status: Optional[str] = Query(None, description="Optional status filter ('pending', 'approved', 'rejected')")):
    """
    List all admin access request tickets for review.
    """
    try:
        tickets = db.get_all_admin_requests(status_filter=status)
        return {
            "success": True,
            "total": len(tickets),
            "tickets": tickets
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/requests/{ticket_id}/approve")
def approve_request(ticket_id: str):
    """
    Approve an access request: grants admin role and records approval.
    """
    try:
        ticket = db.approve_admin_request(ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Request ticket not found.")
        return {
            "success": True,
            "message": f"Approved access for '{ticket['email']}'. Google login is now active for this admin.",
            "ticket": ticket
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/requests/{ticket_id}/reject")
def reject_request(ticket_id: str):
    """
    Reject an access request ticket.
    """
    try:
        ticket = db.reject_admin_request(ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Request ticket not found.")
        return {
            "success": True,
            "message": f"Access request for '{ticket['email']}' has been rejected.",
            "ticket": ticket
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/requests/{ticket_id}")
def delete_request(ticket_id: str):
    """
    Delete an admin request ticket.
    """
    try:
        deleted = db.delete_admin_request(ticket_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Request ticket not found.")
        return {
            "success": True,
            "message": "Request ticket deleted successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ADMIN ACCOUNTS CRUD ENDPOINTS
# ============================================================================

@router.get("/admins")
def list_admins():
    """
    List all authorized administrator Google accounts in SQLite.
    """
    try:
        admins = db.get_all_admins()
        return {
            "success": True,
            "total": len(admins),
            "admins": admins
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admins")
def add_admin_account(req: AddAdminAccountRequest):
    """
    Register a new administrator Google email address directly.
    """
    if not req.email or not req.email.strip():
        raise HTTPException(status_code=400, detail="Google Email is required.")

    try:
        admin = db.add_admin(
            email=req.email,
            full_name=req.full_name,
            role=req.role
        )
        return {
            "success": True,
            "message": f"Administrator '{admin['email']}' registered successfully.",
            "admin": admin
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admins/{admin_id}")
def update_admin_account(admin_id: str, req: UpdateAdminAccountRequest):
    """
    Update administrator details or active status.
    """
    try:
        updated = db.update_admin(
            admin_id=admin_id,
            email=req.email,
            full_name=req.full_name,
            role=req.role,
            is_active=req.is_active
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Admin account not found.")
        return {
            "success": True,
            "message": f"Administrator '{updated['email']}' updated successfully.",
            "admin": updated
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admins/{admin_id}")
def delete_admin_account(admin_id: str):
    """
    Remove an administrator account.
    """
    try:
        deleted = db.delete_admin(admin_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Admin account not found.")
        return {
            "success": True,
            "message": "Administrator account removed successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
