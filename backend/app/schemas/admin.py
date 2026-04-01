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

class RecentActivity(BaseModel):
    """Unified activity log (User registrations, CV uploads)."""
    id: str | int
    type: str  # "user" | "analysis"
    title: str
    description: str
    timestamp: datetime

class AdminAnalysisListItem(BaseModel):
    """Summary of a specific analysis for the Admin content list."""
    id: int
    user_email: str
    user_name: str
    cv_filename: str
    role_profile: str
    score: int | float
    created_at: datetime
    
    model_config = {"from_attributes": True}

class AdminAnalysisListResponse(BaseModel):
    """Paginated list of all analyses."""
    items: List[AdminAnalysisListItem]
    total: int
    
    model_config = {"from_attributes": True}
