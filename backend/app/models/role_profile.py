"""
RoleProfile model — predefined career role profiles used for recommendation matching.
Contains expected keywords and skills for each role.
Maps to FR12, FR13.
"""

from sqlalchemy import Integer, String, Text, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.database import Base


class RoleProfile(Base):
    __tablename__ = "role_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # JSON arrays of strings — e.g. ["python", "api", "backend", "database"]
    expected_keywords: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=list)

    # JSON arrays of skill names — e.g. ["Python", "SQL", "FastAPI"]
    expected_skills: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=list)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    career_recommendations: Mapped[list["CareerRecommendation"]] = relationship(
        "CareerRecommendation", back_populates="role_profile"
    )

    def __repr__(self) -> str:
        return f"<RoleProfile(id={self.id}, title='{self.title}')>"
