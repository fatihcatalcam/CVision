"""
ExtractedSkill model — junction table linking analysis results to detected skills.
Includes confidence score for each detected skill.
Maps to FR11.
"""

from sqlalchemy import Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ExtractedSkill(Base):
    __tablename__ = "extracted_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    analysis_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("analysis_results.id"), nullable=False, index=True
    )
    skill_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("skills.id"), nullable=False, index=True
    )
    confidence_score: Mapped[float] = mapped_column(
        Float, nullable=False, default=1.0
    )  # 0.0 to 1.0

    # Relationships
    analysis: Mapped["AnalysisResult"] = relationship(
        "AnalysisResult", back_populates="extracted_skills"
    )
    skill: Mapped["Skill"] = relationship("Skill", back_populates="extracted_skills")

    def __repr__(self) -> str:
        return f"<ExtractedSkill(analysis_id={self.analysis_id}, skill_id={self.skill_id}, conf={self.confidence_score})>"
