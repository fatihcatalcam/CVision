"""
RoleProfile schemas — response validation for career role profiles.
"""

from pydantic import BaseModel


class RoleProfileResponse(BaseModel):
    """Career role profile."""
    id: int
    title: str
    description: str | None = None
    expected_keywords: list[str] = []
    expected_skills: list[str] = []

    model_config = {"from_attributes": True}
