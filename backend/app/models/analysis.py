"""
AnalysisResult model — stores the complete analysis output for a CV.
Contains sub-scores, summary, strengths, and weaknesses as JSON.
Maps to FR8, FR9, FR20.
"""

from datetime import datetime
from sqlalchemy import Integer, Float, Text, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cv_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("cvs.id"), nullable=False, unique=True, index=True
    )

    # Scores (0.0 to 100.0)
    overall_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    ats_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    keyword_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    completeness_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    experience_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Textual analysis
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    # JSON arrays — e.g. ["Strong technical skills", "Good formatting"]
    strengths: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=list)
    weaknesses: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=list)

    # Detected sections — e.g. {"education": true, "experience": true, "skills": false}
    detected_sections: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=dict)

    # AI-enhanced fields (populated after GPT call)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)  # AI executive summary
    ai_suggestions: Mapped[list | None] = mapped_column(JSON, nullable=True)  # [{category, priority, message, rewrite_hint}]
    ai_enhanced: Mapped[bool] = mapped_column(Integer, nullable=False, default=0)  # 1 if AI ran successfully

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    cv: Mapped["CV"] = relationship("CV", back_populates="analysis_result")
    suggestions: Mapped[list["Suggestion"]] = relationship(
        "Suggestion", back_populates="analysis", cascade="all, delete-orphan"
    )
    extracted_skills: Mapped[list["ExtractedSkill"]] = relationship(
        "ExtractedSkill", back_populates="analysis", cascade="all, delete-orphan"
    )
    career_recommendations: Mapped[list["CareerRecommendation"]] = relationship(
        "CareerRecommendation", back_populates="analysis", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<AnalysisResult(id={self.id}, cv_id={self.cv_id}, score={self.overall_score})>"
