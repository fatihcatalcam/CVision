"""
Admin schemas — response validation for admin dashboard endpoints.
"""

from datetime import datetime
from pydantic import BaseModel


class AdminStatsResponse(BaseModel):
    """Summary statistics for the admin dashboard."""
    total_users: int
    total_cvs: int
    total_analyses: int
    avg_score: float | None = None
    recent_registrations: int  # Last 7 days
    recent_analyses: int  # Last 7 days


class AdminLogResponse(BaseModel):
    """Admin log entry."""
    id: int
    event_type: str
    message: str
    related_user_id: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserResponse(BaseModel):
    """User info visible to admin."""
    id: int
    full_name: str
    email: str
    role: str
    cv_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DashboardSummaryResponse(BaseModel):
    """User dashboard summary data."""
    total_cvs: int
    total_analyses: int
    avg_score: float | None = None
    latest_score: float | None = None
    latest_cv_filename: str | None = None
