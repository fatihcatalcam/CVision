"""
CoverLetter model — stores AI-generated cover letters.
"""

from datetime import datetime
from sqlalchemy import Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CoverLetter(Base):
    __tablename__ = "cover_letters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cv_id: Mapped[int] = mapped_column(Integer, ForeignKey("cvs.id"), nullable=False, index=True)
    jd_id: Mapped[int] = mapped_column(Integer, ForeignKey("job_descriptions.id"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    cv: Mapped["CV"] = relationship("CV")
    job_description: Mapped["JobDescription"] = relationship(
        "JobDescription", back_populates="cover_letters"
    )

    def __repr__(self) -> str:
        return f"<CoverLetter(id={self.id}, cv_id={self.cv_id})>"
