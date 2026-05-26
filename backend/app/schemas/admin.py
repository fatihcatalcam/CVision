"""
Admin schemas - response validation for system-wide analytics and admin actions.
"""

from typing import List
from pydantic import BaseModel
from datetime import datetime
from app.schemas.user import UserResponse


class DailyActivity(BaseModel):
    date: str
    analyses: int
    signups: int


class ScoreDistribution(BaseModel):
    low: int
    medium: int
    high: int


class DomainStat(BaseModel):
    domain: str
    count: int


class AdminOverviewResponse(BaseModel):
    total_users: int
    total_cvs: int
    total_analyses: int
    average_system_score: float | None
    free_users: int
    premium_users: int
    new_users_this_week: int
    new_analyses_this_week: int
    ai_enhanced_count: int
    score_distribution: ScoreDistribution
    top_domains: List[DomainStat]
    daily_activity: List[DailyActivity]
    recent_activities: List["RecentActivity"]


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

class AdminCVContent(BaseModel):
    """CV content details for admin viewer."""
    cv_id: int
    original_filename: str
    file_type: str
    file_size: int
    target_domain: str | None
    extracted_text: str | None
    uploaded_at: datetime
    user_name: str
    user_email: str

    model_config = {"from_attributes": True}


class AdminAnalysisListItem(BaseModel):
    """Summary of a specific analysis for the Admin content list."""
    id: int
    cv_id: int
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
