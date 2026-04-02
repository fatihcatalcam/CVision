"""
Analysis schemas — response validation for analysis results.
"""

from datetime import datetime
from pydantic import BaseModel, field_validator
from app.utils.hashids import encode_id

from app.schemas.suggestion import SuggestionResponse
from app.schemas.skill import ExtractedSkillResponse
from app.schemas.career_recommendation import CareerRecommendationResponse


class AnalysisScores(BaseModel):
    """Score breakdown for an analysis."""
    overall_score: float
    ats_score: float
    keyword_score: float
    completeness_score: float
    experience_score: float


class AISuggestion(BaseModel):
    """An AI-generated suggestion with an optional rewrite hint."""
    category: str | None = None
    priority: str | None = None
    message: str | None = None
    rewrite_hint: str | None = None
    is_locked: bool = False


class AnalysisResponse(BaseModel):
    """Complete analysis result returned to the user."""
    id: str
    cv_id: str
    extracted_text: str | None = None
    scores: AnalysisScores
    summary: str | None = None
    strengths: list[str] = []
    weaknesses: list[str] = []
    detected_sections: dict[str, bool] = {}
    suggestions: list[SuggestionResponse] = []
    extracted_skills: list[ExtractedSkillResponse] = []
    career_recommendations: list[CareerRecommendationResponse] = []
    # AI-enhanced fields
    ai_summary: str | None = None
    is_summary_locked: bool = False
    ai_suggestions: list[AISuggestion] = []
    ai_enhanced: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator('id', 'cv_id', mode='before')
    @classmethod
    def encode_ids(cls, v):
        if isinstance(v, int):
            return encode_id(v)
        return v


class AnalysisSummaryResponse(BaseModel):
    """Lightweight analysis summary for dashboard/history views."""
    id: str
    cv_id: str
    cv_filename: str
    overall_score: float
    ats_score: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator('id', 'cv_id', mode='before')
    @classmethod
    def encode_ids(cls, v):
        if isinstance(v, int):
            return encode_id(v)
        return v
