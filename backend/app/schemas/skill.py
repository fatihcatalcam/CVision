"""
Skill schemas — response validation for skills and extracted skills.
"""

from pydantic import BaseModel


class SkillResponse(BaseModel):
    """Skill from the master skills table."""
    id: int
    name: str
    category: str

    model_config = {"from_attributes": True}


class ExtractedSkillResponse(BaseModel):
    """Skill extracted from a CV analysis with confidence score."""
    skill_name: str
    skill_category: str
    confidence_score: float

    model_config = {"from_attributes": True}
