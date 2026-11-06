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
        """How many anonymous analyses this IP has spent within the last `hours`.

        Failed uploads are excluded: if we could not produce an analysis, the
        visitor did not get what the daily allowance is for. Before this, an
        image-only CV burned the single free run and the visitor could not
        retry even after fixing it - they were pushed into signing up instead.

        Pending/processing rows still count, so a single IP cannot flood the
        service with parallel uploads while none have finished.
        """
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        return (
            db.query(CV)
            .filter(CV.user_id.is_(None))
            .filter(CV.client_ip == client_ip)
            .filter(CV.uploaded_at >= since)
            .filter(~CV.status.like("failed%"))
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
            # A failed upload has nothing to hand over. Claiming one opened the
            # brand-new account on the analysis page's error screen - and, for
            # an image-only PDF, told the user a credit was refunded that they
            # had never spent. Same rule as count_recent_anon_by_ip.
            .filter(~CV.status.like("failed%"))
            .first()
        )
        if cv is None:
            return None
        cv.user_id = user.id
        cv.session_token = None
        cv.client_ip = None

        # Hand over the full report with the CV - try it, sign up, read the
        # answer is the funnel this flow exists for - paid for out of the
        # signup credits, like any other report.
        #
        # It used to be opened free, on top of the signup credits, so a /try
        # visitor who signed up held two full reports on day one. With 412
        # users and no sale, that free supply was the reason nobody ever needed
        # to buy. Now the unlock costs CREDIT_UNLOCK and leaves the rest of the
        # opening balance, and a report the balance cannot cover stays locked
        # with its unlock button, as everywhere else.
        #
        # Still only for an account with nothing else, as before.
        from app.config import settings
        from app.models.analysis import AnalysisResult
        from app.services.analysis_service import AnalysisService
        from app.services.credit_service import CreditService, InsufficientCredits

        if AnalysisService._is_users_first_analysis(cv, db):
            analysis = (
                db.query(AnalysisResult).filter(AnalysisResult.cv_id == cv.id).first()
            )
            if analysis is not None and not analysis.is_unlocked:
                try:
                    CreditService.spend(
                        db, user, settings.CREDIT_UNLOCK, "spend_unlock", ref_id=str(cv.id),
                    )
                    analysis.is_unlocked = True
                except InsufficientCredits:
                    pass

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
