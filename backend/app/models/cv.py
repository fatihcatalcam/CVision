"""
CV model - represents an uploaded CV file and its extracted text.
Status lifecycle: pending → processing → completed → failed
Maps to FR4, FR5, FR6, FR7, FR19, FR21, FR22.
"""

from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, func, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CV(Base):
    __tablename__ = "cvs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)  # "pdf" or "txt"
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)  # bytes
    file_content: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)  # raw bytes stored for persistence
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_domain: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending, processing, completed, failed
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # ---- Job recovery (Track 2) ----
    # Set to now() when the background task transitions the CV to "processing";
    # used by the startup sweep to detect interrupted runs.
    processing_started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Times the startup sweep has re-queued this CV. Capped by MAX_JOB_RETRIES.
    retry_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="cvs")
    analysis_result: Mapped["AnalysisResult | None"] = relationship(
        "AnalysisResult", back_populates="cv", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<CV(id={self.id}, filename='{self.original_filename}', status='{self.status}')>"
