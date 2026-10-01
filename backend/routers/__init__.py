from .admin import router as admin_router
from .voter import router as voter_router
from .auth import router as auth_router

__all__ = ["admin_router", "voter_router", "auth_router"]

