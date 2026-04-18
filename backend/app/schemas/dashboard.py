"""
Dashboard schemas — response validation for user dashboard summaries.
"""

from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class DashboardSummaryResponse(BaseModel):
    """Metrics for the user's dashboard."""
    total_cvs: int
    total_analyses: int
    average_score: float | None
    latest_score: float | None

    model_config = {"from_attributes": True}


class AnalysisHistoryItem(BaseModel):
    """Single CV + analysis row for history listing."""
    cv_id: int
    original_filename: str
    target_domain: Optional[str]
    status: str
    uploaded_at: datetime
    overall_score: Optional[float] = None
    ats_score: Optional[float] = None
    keyword_score: Optional[float] = None
    analysis_id: Optional[int] = None

    model_config = {"from_attributes": True}


class AnalysisHistoryResponse(BaseModel):
    """Paginated history of the user's CV analyses."""
    items: list[AnalysisHistoryItem]
    total: int

    model_config = {"from_attributes": True}
