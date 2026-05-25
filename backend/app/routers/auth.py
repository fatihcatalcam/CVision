"""
Authentication router - handles user registration, login, and profile management.
Endpoints:
    POST  /auth/register          - Create a new user
    POST  /auth/login             - Authenticate and receive JWT
    GET   /auth/me                - Get current user profile
    PATCH /auth/me                - Update display name
    POST  /auth/me/password       - Change password
    POST  /auth/forgot-password   - Request password reset code
    POST  /auth/verify-reset-code - Verify reset code
    POST  /auth/reset-password    - Set new password
"""

import re
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.models.user import User
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.limiter import limiter

logger = logging.getLogger("cvision.routers.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])

MAX_RESET_ATTEMPTS = 5


class ForgotPasswordRequest(BaseModel):
    email: str


class VerifyResetCodeRequest(BaseModel):
    email: str
    code: str


class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v


class UserUpdateRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator('new_password')
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
@limiter.limit("5/minute")
def register(request: Request, user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role="user",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive JWT token",
)
@limiter.limit("5/minute")
def login(request: Request, credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Return the profile of the currently authenticated user.

    Performs a lazy quota reset: if the weekly window has expired since the last
    upload, analysis_count is zeroed out here so the dashboard always shows
    accurate remaining quota — not the stale value from when the window was active.
    """
    now = datetime.now(timezone.utc)
    quota_reset = current_user.quota_reset_at

    if quota_reset:
        if quota_reset.tzinfo is None:
            quota_reset = quota_reset.replace(tzinfo=timezone.utc)
        if quota_reset < now:
            # Window expired: reset count so frontend shows correct remaining quota.
            # Keep quota_reset_at as-is (null would be set on next upload anyway).
            current_user.analysis_count = 0
            current_user.quota_reset_at = None  # cleared — next upload starts fresh window
            db.commit()
            db.refresh(current_user)

    return current_user


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update user display name",
)
def update_profile(
    body: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the authenticated user's display name."""
    current_user.full_name = body.full_name.strip()
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post(
    "/me/password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Change user password",
)
def change_password(
    body: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change the authenticated user's password after verifying the current one."""
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )

    current_user.password_hash = hash_password(body.new_password)
    db.commit()
    return None


@router.post("/forgot-password", summary="Request password reset code")
@limiter.limit("3/minute")
def forgot_password(request: Request, body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    from app.services.email_service import generate_reset_code, get_reset_code_expiry, send_reset_password_email

    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        return {"message": "If that email exists, a reset code has been sent."}

    code = generate_reset_code()
    user.reset_code = code
    user.reset_code_expires_at = get_reset_code_expiry()
    user.reset_code_attempts = 0
    db.commit()

    send_reset_password_email(user.email, code, user.full_name)
    return {"message": "If that email exists, a reset code has been sent."}


@router.post("/verify-reset-code", summary="Verify password reset code")
@limiter.limit("10/minute")
def verify_reset_code(request: Request, body: VerifyResetCodeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.reset_code:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    if user.reset_code_attempts >= MAX_RESET_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many attempts. Please request a new code.")

    now = datetime.utcnow()
    if not user.reset_code_expires_at or user.reset_code_expires_at < now:
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")

    user.reset_code_attempts += 1
    db.commit()

    if user.reset_code != body.code.strip():
        remaining = MAX_RESET_ATTEMPTS - user.reset_code_attempts
        raise HTTPException(status_code=400, detail=f"Invalid code. {remaining} attempt(s) remaining.")

    return {"message": "Code verified.", "valid": True}


@router.post("/reset-password", summary="Set new password after code verification")
@limiter.limit("5/minute")
def reset_password(request: Request, body: ResetPasswordRequest, db: Session = Depends(get_db)):
    from app.auth.hashing import check_password_history, update_password_history

    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.reset_code:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    if user.reset_code_attempts >= MAX_RESET_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many attempts. Please request a new code.")

    now = datetime.utcnow()
    if not user.reset_code_expires_at or user.reset_code_expires_at < now:
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")

    if user.reset_code != body.code.strip():
        user.reset_code_attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid code.")

    if check_password_history(body.new_password, user.password_history):
        raise HTTPException(status_code=400, detail="You cannot reuse one of your last 3 passwords.")

    user.password_history = update_password_history(user.password_hash, user.password_history)
    user.password_hash = hash_password(body.new_password)
    user.password_changed_at = now
    user.reset_code = None
    user.reset_code_expires_at = None
    user.reset_code_attempts = 0
    db.commit()

    return {"message": "Password updated successfully. Please log in with your new password."}
