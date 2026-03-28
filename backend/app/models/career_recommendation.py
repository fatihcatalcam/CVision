"""
CareerRecommendation model — links an analysis result to a matching role profile.
Includes match score and explanation.
Maps to FR13.
"""

from sqlalchemy import Integer, Float, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CareerRecommendation(Base):
    __tablename__ = "career_recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    analysis_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("analysis_results.id"), nullable=False, index=True
    )
    role_profile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("role_profiles.id"), nullable=False, index=True
    )
    match_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)  # 0.0 to 100.0
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    analysis: Mapped["AnalysisResult"] = relationship(
        "AnalysisResult", back_populates="career_recommendations"
    )
    role_profile: Mapped["RoleProfile"] = relationship(
        "RoleProfile", back_populates="career_recommendations"
    )

    def __repr__(self) -> str:
        return f"<CareerRecommendation(analysis_id={self.analysis_id}, role='{self.role_profile_id}', score={self.match_score})>"
