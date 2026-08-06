"""
Shared FastAPI dependencies used across routers.
- get_db: Provides a database session per request.
- get_current_user: Extracts and validates JWT token from request.
- require_admin: Ensures the current user has admin role.
"""

from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.auth.jwt_handler import verify_access_token
from app.models.user import User

# OAuth2 scheme - tells Swagger UI to show the "Authorize" button
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

    return user


def charge(db: Session, user: User, amount: int, reason: str, ref_id: str | None = None) -> int:
    """Spend credits for a request, or reject it with 402 Payment Required.

    The HTTP translation lives here rather than in CreditService so the service
    stays free of web concerns, and here rather than inline at each call site so
    every endpoint refuses in the same words - the frontend reads this message
    and offers a top-up, and it can only do that if the shape is predictable.

    402 rather than 403: an empty balance is a payment problem, not a
    permissions one, and the two need different buttons in the UI.
    """
    from app.services.credit_service import CreditService, InsufficientCredits

    # A price of zero means "free", not "charge nothing and write a ledger row
    # about it". Without this a price could never be tuned down to free from the
    # environment, because CreditService rightly refuses a zero-value spend.
    if amount == 0:
        return CreditService.balance(db, user)

    try:
        return CreditService.spend(db, user, amount, reason, ref_id)
    except InsufficientCredits as exc:
        raise HTTPException(
            status_code=402,
            detail=f"Not enough credits: this costs {exc.needed}, you have {exc.available}.",
        )


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
