"""
Authentication router — handles user registration, login, and profile management.
Endpoints:
    POST  /auth/register            — Create a new user (unverified)
    POST  /auth/verify-email        — Verify email with 5-digit code
    POST  /auth/resend-verification — Resend verification code
    POST  /auth/login               — Authenticate and receive JWT
    GET   /auth/me                  — Get current user profile
    PATCH /auth/me                  — Update display name
    POST  /auth/me/password         — Change password
"""

import re
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from datetime import datetime

from app.dependencies import get_db, get_current_user
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.models.user import User
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.limiter import limiter

logger = logging.getLogger("cvision.routers.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])

MAX_VERIFICATION_ATTEMPTS = 5


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


class VerifyEmailRequest(BaseModel):
    email: str
    code: str


class ResendVerificationRequest(BaseModel):
    email: str


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
@limiter.limit("5/minute")
def register(request: Request, user_data: UserRegister, db: Session = Depends(get_db)):
    from app.services.email_service import generate_verification_code, get_code_expiry, send_verification_email

    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        if not existing.is_verified:
            # Resend code to unverified account
            code = generate_verification_code()
            existing.verification_code = code
            existing.verification_code_expires_at = get_code_expiry()
            existing.verification_attempts = 0
            db.commit()
            send_verification_email(existing.email, code, existing.full_name)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="UNVERIFIED_EXISTS",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    code = generate_verification_code()
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role="user",
        is_verified=False,
        verification_code=code,
        verification_code_expires_at=get_code_expiry(),
        verification_attempts=0,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    sent = send_verification_email(new_user.email, code, new_user.full_name)
    if not sent:
        logger.warning("Email could not be sent for user %s — code: %s", new_user.email, code)

    return new_user


@router.post(
    "/verify-email",
    summary="Verify email address with 5-digit code",
)
@limiter.limit("10/minute")
def verify_email(request: Request, body: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        return {"message": "Email already verified"}

    if user.verification_attempts >= MAX_VERIFICATION_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Too many attempts. Please request a new code.",
        )

    now = datetime.utcnow()
    if not user.verification_code_expires_at or user.verification_code_expires_at < now:
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

    user.verification_attempts += 1
    db.commit()

    if user.verification_code != body.code.strip():
        remaining = MAX_VERIFICATION_ATTEMPTS - user.verification_attempts
        raise HTTPException(
            status_code=400,
            detail=f"Invalid code. {remaining} attempt(s) remaining.",
        )

    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires_at = None
    user.verification_attempts = 0
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "message": "Email verified successfully",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "plan_type": user.plan_type,
            "analysis_count": user.analysis_count,
            "quota_reset_at": user.quota_reset_at.isoformat() if user.quota_reset_at else None,
            "subscription_end_at": user.subscription_end_at.isoformat() if user.subscription_end_at else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
    }


@router.post(
    "/resend-verification",
    summary="Resend verification code",
)
@limiter.limit("3/minute")
def resend_verification(request: Request, body: ResendVerificationRequest, db: Session = Depends(get_db)):
    from app.services.email_service import generate_verification_code, get_code_expiry, send_verification_email

    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        # Don't reveal if email exists
        return {"message": "If that email exists, a new code has been sent."}

    if user.is_verified:
        return {"message": "Email already verified"}

    code = generate_verification_code()
    user.verification_code = code
    user.verification_code_expires_at = get_code_expiry()
    user.verification_attempts = 0
    db.commit()

    send_verification_email(user.email, code, user.full_name)
    return {"message": "A new verification code has been sent to your email."}


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

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="EMAIL_NOT_VERIFIED",
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
def get_me(current_user: User = Depends(get_current_user)):
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
