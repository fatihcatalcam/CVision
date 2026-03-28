"""
Suggestion model — individual improvement suggestions tied to an analysis.
Each analysis generates at least 3 suggestions (FR10).
"""

from sqlalchemy import Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Suggestion(Base):
    __tablename__ = "suggestions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    analysis_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("analysis_results.id"), nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "formatting", "content", "skills", "ats", "experience"
    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default="medium"
    )  # "high", "medium", "low"
    message: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    analysis: Mapped["AnalysisResult"] = relationship(
        "AnalysisResult", back_populates="suggestions"
    )

    def __repr__(self) -> str:
        return f"<Suggestion(id={self.id}, category='{self.category}', priority='{self.priority}')>"
