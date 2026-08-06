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
    # Credits. plan_type stopped meaning anything when credits arrived, so
    # "premium users" and the conversion rate built on it measure nothing; what
    # the panel needs instead is how much currency is outstanding and how fast
    # it is being spent.
    credits_in_circulation: int
    credits_spent_this_week: int
    paying_users: int
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
    """One upload attempt in the Admin content list.

    Covers failed uploads too, so image-only CVs rejected by the parser can be
    audited rather than vanishing. Those carry no analysis record, hence the
    nullable id and score; `status` says which outcome this row represents.
    """
    id: int | None          # analysis id; None when the upload never analysed
    cv_id: int              # raw id - the admin CV-file and CV-content routes take it
    cv_hash: str            # hashid form; /analysis/:id decodes this, so the
                            # panel needs it to link to the real report page
    user_email: str
    user_name: str
    cv_filename: str
    role_profile: str
    score: int | float | None
    status: str             # pending | processing | completed | failed | failed_no_text
    created_at: datetime

    model_config = {"from_attributes": True}

class AdminAnalysisListResponse(BaseModel):
    """Paginated list of all analyses."""
    items: List[AdminAnalysisListItem]
    total: int
    
    model_config = {"from_attributes": True}
