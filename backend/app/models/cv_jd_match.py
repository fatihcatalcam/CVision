"""
CVJDMatch model — stores AI-powered CV vs job description match results.
"""

from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CVJDMatch(Base):
    __tablename__ = "cv_jd_matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cv_id: Mapped[int] = mapped_column(Integer, ForeignKey("cvs.id"), nullable=False, index=True)
    jd_id: Mapped[int] = mapped_column(Integer, ForeignKey("job_descriptions.id"), nullable=False, index=True)
    match_score: Mapped[int] = mapped_column(Integer, nullable=False)  # 0–100
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    matched_keywords: Mapped[list | None] = mapped_column(JSON, nullable=True)
    missing_keywords: Mapped[list | None] = mapped_column(JSON, nullable=True)
    gap_analysis: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    cv: Mapped["CV"] = relationship("CV")
    job_description: Mapped["JobDescription"] = relationship(
        "JobDescription", back_populates="matches"
    )

    def __repr__(self) -> str:
        return f"<CVJDMatch(id={self.id}, score={self.match_score})>"
