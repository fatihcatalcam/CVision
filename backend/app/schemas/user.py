"""
User schemas — request/response validation for auth and user endpoints.
"""

from datetime import datetime
import re
from pydantic import BaseModel, EmailStr, Field, field_validator


# ---- Request Schemas ----

class UserRegister(BaseModel):
    """Registration request body."""
    full_name: str = Field(..., min_length=2, max_length=150, examples=["John Doe"])
    email: EmailStr = Field(..., examples=["john@example.com"])
    password: str = Field(..., min_length=8, max_length=128, examples=["SecurePass123!"])

    @field_validator('password')
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v


class UserLogin(BaseModel):
    """Login request body."""
    email: EmailStr = Field(..., examples=["john@example.com"])
    password: str = Field(..., examples=["SecurePass123!"])


# ---- Response Schemas ----

class UserResponse(BaseModel):
    """Public user profile returned in API responses."""
    id: int
    full_name: str
    email: str
    role: str
    plan_type: str
    analysis_count: int
    quota_reset_at: datetime | None
    subscription_end_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT token returned after successful login."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
