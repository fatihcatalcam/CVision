"""
User model — represents registered users of the platform.
Supports 'user' and 'admin' roles.
Maps to FR1, FR2, FR3, FR16, FR25.
"""

from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="user")  # "user" or "admin"
    plan_type: Mapped[str] = mapped_column(String(20), nullable=False, default="free")
    analysis_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    quota_reset_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    subscription_end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    verification_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    verification_code_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    verification_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reset_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    reset_code_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    reset_code_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    password_changed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    password_history: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    cvs: Mapped[list["CV"]] = relationship("CV", back_populates="owner", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"
