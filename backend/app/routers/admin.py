"""
Admin router — admin-only endpoints for monitoring and management.
Will be fully implemented in Phase 9.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/admin", tags=["Admin"])


# Placeholder — Phase 9 will add:
# GET /admin/stats   — Get platform statistics
# GET /admin/users   — Get all users
# GET /admin/logs    — Get admin logs
