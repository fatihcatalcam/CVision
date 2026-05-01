"""
Shared FastAPI dependencies used across routers.
- get_db: Provides a database session per request.
- get_current_user: Extracts and validates JWT token from request.
- require_admin: Ensures the current user has admin role.
"""

from typing import Generator
from datetime import datetime
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.auth.jwt_handler import verify_access_token
from app.models.user import User

# OAuth2 scheme — tells Swagger UI to show the "Authorize" button
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_db() -> Generator[Session, None, None]:
    """
    Yields a database session for the duration of a request.
    Ensures the session is closed after the request completes,
    even if an exception occurs.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Validates the JWT token and returns the corresponding User object.
    Raises 401 if the token is invalid or the user doesn't exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: int | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    # Invalidate tokens issued before the last password change
    if user.password_changed_at:
        iat = payload.get("iat")
        if iat:
            from datetime import timezone as tz
            token_issued_at = datetime.fromtimestamp(iat, tz=tz.utc) if isinstance(iat, (int, float)) else iat
            changed_at = user.password_changed_at.replace(tzinfo=tz.utc) if user.password_changed_at.tzinfo is None else user.password_changed_at
            if token_issued_at < changed_at:
                raise credentials_exception

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Ensures the current user has the 'admin' role.
    Raises 403 if the user is not an admin.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
