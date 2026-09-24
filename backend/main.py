import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.voter import router as voter_router
from routers.admin import router as admin_router
from routers.superadmin import router as superadmin_router
import database as db

app = FastAPI(
    title="Election Voting App API",
    description="Secure Election Voting Web Application with Role-Based Portals & Real-Time SQLite Database",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(voter_router)
app.include_router(admin_router)
app.include_router(superadmin_router)


@app.get("/")
def root_endpoint():
    return {
        "status": "online",
        "app": "Campus Multi-Club Digital Voting Backend (FastAPI)",
        "version": "2.1.0",
        "endpoints": {
            "voter_clubs": "/api/voter/clubs",
            "voter_check": "/api/voter/check-eligibility",
            "voter_campus_ballot": "/api/voter/campus-ballot",
            "voter_cast_multi": "/api/voter/cast-multi-vote",
            "voter_cast": "/api/voter/cast-vote",
            "admin_login": "/api/admin/login",
            "admin_campuses": "/api/admin/campuses",
            "admin_dashboard": "/api/admin/dashboard-data"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

