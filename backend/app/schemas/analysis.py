"""
Analysis schemas — response validation for analysis results.
"""

from datetime import datetime
from pydantic import BaseModel

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
    category: str
    priority: str
    message: str
    rewrite_hint: str = ""


class AnalysisResponse(BaseModel):
    """Complete analysis result returned to the user."""
    id: int
    cv_id: int
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
    ai_suggestions: list[AISuggestion] = []
    ai_enhanced: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalysisSummaryResponse(BaseModel):
    """Lightweight analysis summary for dashboard/history views."""
    id: int
    cv_id: int
    cv_filename: str
    overall_score: float
    ats_score: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
