"""
AdminLog model — tracks administrative events and system errors.
Maps to FR17, FR18.
"""

from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AdminLog(Base):
    __tablename__ = "admin_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "user_registered", "analysis_completed", "analysis_failed", "error", "admin_action"
    message: Mapped[str] = mapped_column(Text, nullable=False)
    related_user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<AdminLog(id={self.id}, type='{self.event_type}')>"
