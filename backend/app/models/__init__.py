"""
Central model registry — imports all models so SQLAlchemy and Alembic
can discover them through Base.metadata.

Import this module wherever you need all models registered
(e.g., in main.py or alembic/env.py).
"""

from app.models.user import User
from app.models.cv import CV
from app.models.analysis import AnalysisResult
from app.models.suggestion import Suggestion
from app.models.skill import Skill
from app.models.extracted_skill import ExtractedSkill
from app.models.role_profile import RoleProfile
from app.models.career_recommendation import CareerRecommendation
from app.models.admin_log import AdminLog

__all__ = [
    "User",
    "CV",
    "AnalysisResult",
    "Suggestion",
    "Skill",
    "ExtractedSkill",
    "RoleProfile",
    "CareerRecommendation",
    "AdminLog",
]
