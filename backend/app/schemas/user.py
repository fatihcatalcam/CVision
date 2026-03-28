"""
User schemas — request/response validation for auth and user endpoints.
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ---- Request Schemas ----

class UserRegister(BaseModel):
    """Registration request body."""
    full_name: str = Field(..., min_length=2, max_length=150, examples=["John Doe"])
    email: EmailStr = Field(..., examples=["john@example.com"])
    password: str = Field(..., min_length=8, max_length=128, examples=["SecurePass123!"])


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
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT token returned after successful login."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
