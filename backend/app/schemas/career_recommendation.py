"""
CareerRecommendation schemas — response validation for career recommendations.
"""

from pydantic import BaseModel


class CareerRecommendationResponse(BaseModel):
    """Individual career recommendation with match score."""
    role_title: str
    match_score: float
    explanation: str | None = None

    model_config = {"from_attributes": True}
