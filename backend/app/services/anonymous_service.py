"""
Anonymous CV analysis business logic (the public /try flow).

Keeps the public router thin: per-IP rate accounting, anonymous CV creation,
claim-on-signup, and cleanup of unclaimed rows all live here.
"""

import logging
import secrets
from datetime import datetime, timezone, timedelta

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.cv import CV
from app.models.user import User
from app.services.cv_service import CVService

logger = logging.getLogger("cvision.services.anonymous")


class AnonymousService:
    """Business logic for the no-auth /try analysis flow."""

    @staticmethod
    def count_recent_anon_by_ip(db: Session, client_ip: str, hours: int = 24) -> int:
        """How many anonymous CVs this IP has created within the last `hours`."""
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        return (
            db.query(CV)
            .filter(CV.user_id.is_(None))
            .filter(CV.client_ip == client_ip)
            .filter(CV.uploaded_at >= since)
            .count()
        )

    @staticmethod
    async def create_anonymous_cv(
        file: UploadFile,
        target_domain: str,
        client_ip: str,
        db: Session,
    ) -> CV:
        """Validate + save an uploaded file and create an ownerless CV row."""
        original_filename, extension = CVService.validate_file(file)
        stored_filename, file_path, file_size, file_content = await CVService.save_file(
            file, extension
        )

        cv = CV(
            user_id=None,
            original_filename=original_filename,
            stored_filename=stored_filename,
            file_path=str(file_path),
            file_type=extension,
            file_size=file_size,
            file_content=file_content,
            status="pending",
            target_domain=target_domain,
            session_token=secrets.token_urlsafe(32),
            client_ip=client_ip,
        )
        db.add(cv)
        db.commit()
        db.refresh(cv)
        logger.info(f"Anonymous CV created: id={cv.id} ip={client_ip}")
        return cv

    @staticmethod
    def get_by_token(db: Session, token: str) -> CV | None:
        """Fetch an anonymous CV by its session token (owned or not)."""
        if not token:
            return None
        return db.query(CV).filter(CV.session_token == token).first()

    @staticmethod
    def claim(db: Session, token: str, user: User) -> CV | None:
        """Attach an unclaimed anonymous CV to `user`. Returns the CV or None."""
        cv = (
            db.query(CV)
            .filter(CV.session_token == token)
            .filter(CV.user_id.is_(None))
            .first()
        )
        if cv is None:
            return None
        cv.user_id = user.id
        cv.session_token = None
        cv.client_ip = None
        db.commit()
        db.refresh(cv)
        logger.info(f"Anonymous CV {cv.id} claimed by user {user.id}")
        return cv

    @staticmethod
    def cleanup_unclaimed(db: Session, older_than_days: int = 7) -> int:
        """Delete unclaimed anonymous CVs older than `older_than_days`. Returns count."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=older_than_days)
        stale = (
            db.query(CV)
            .filter(CV.user_id.is_(None))
            .filter(CV.uploaded_at < cutoff)
            .all()
        )
        for cv in stale:
            db.delete(cv)  # cascades to analysis_result and its children
        if stale:
            db.commit()
        logger.info(f"Anonymous cleanup removed {len(stale)} unclaimed CV(s).")
        return len(stale)
