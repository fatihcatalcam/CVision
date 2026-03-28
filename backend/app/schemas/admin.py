"""
Admin schemas — response validation for system-wide analytics and admin actions.
"""

from typing import List
from pydantic import BaseModel
from datetime import datetime
from app.schemas.user import UserResponse


class AdminStatsResponse(BaseModel):
    """System-wide metrics for the admin dashboard."""
    total_users: int
    total_cvs: int
    total_analyses: int
    average_system_score: float | None

    model_config = {"from_attributes": True}


class AdminUsersListResponse(BaseModel):
    """Paginated list of all users."""
    users: List[UserResponse]
    total: int

    model_config = {"from_attributes": True}
