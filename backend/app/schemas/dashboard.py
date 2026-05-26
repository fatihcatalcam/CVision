"""
Dashboard schemas - response validation for user dashboard summaries.
"""

from datetime import datetime
from pydantic import BaseModel, field_validator
from typing import Optional
from app.utils.hashids import encode_id


class DashboardSummaryResponse(BaseModel):
    """Metrics for the user's dashboard."""
    total_cvs: int
    total_analyses: int
    average_score: float | None
    latest_score: float | None

    model_config = {"from_attributes": True}


class AnalysisHistoryItem(BaseModel):
    """Single CV + analysis row for history listing."""
    cv_id: str  # hashid-encoded
    original_filename: str
    target_domain: Optional[str]
    status: str
    uploaded_at: datetime
    overall_score: Optional[float] = None
    ats_score: Optional[float] = None
    keyword_score: Optional[float] = None
    analysis_id: Optional[int] = None

    model_config = {"from_attributes": True}

    @field_validator('cv_id', mode='before')
    @classmethod
    def encode_cv_id(cls, v):
        if isinstance(v, int):
            return encode_id(v)
        return v


class AnalysisHistoryResponse(BaseModel):
    """Paginated history of the user's CV analyses."""
    items: list[AnalysisHistoryItem]
    total: int

    model_config = {"from_attributes": True}
