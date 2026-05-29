"""
JD Service — URL scraping and CRUD for JobDescription records.
"""

import logging
from sqlalchemy.orm import Session

from app.models.job_description import JobDescription

logger = logging.getLogger("cvision.services.jd")

# Domains blocked from URL scraping (require login / block bots)
BLOCKED_DOMAINS = {"linkedin.com", "glassdoor.com", "glassdoor.co.uk"}


def _is_blocked(url: str) -> bool:
    """Return True if the URL domain is on the blocked list."""
    try:
        from urllib.parse import urlparse
        host = urlparse(url).hostname or ""
        # Strip leading www.
        host = host.removeprefix("www.")
        return host in BLOCKED_DOMAINS
    except Exception:
        return False


def fetch_url_text(url: str) -> dict:
    """
    Fetch and extract plain text from a URL using trafilatura.

    Returns:
        {
            "supported": bool,
            "extracted_text": str | None,
            "message": str | None,   # user-facing error if supported=False or extraction failed
        }
    """
    if _is_blocked(url):
        return {
            "supported": False,
            "extracted_text": None,
            "message": "Bu siteden otomatik çekilemiyor. Lütfen ilan metnini kopyalayıp yapıştırın.",
        }

    try:
        import trafilatura
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            return {
                "supported": True,
                "extracted_text": None,
                "message": "İlan sayfası yüklenemedi. Lütfen metni manuel yapıştırın.",
            }

        text = trafilatura.extract(downloaded)
        if not text or len(text.strip()) < 100:
            return {
                "supported": True,
                "extracted_text": None,
                "message": "İlan metni çekilemedi. Lütfen metni manuel yapıştırın.",
            }

        return {
            "supported": True,
            "extracted_text": text.strip(),
            "message": None,
        }
    except Exception as e:
        logger.error(f"URL fetch failed: {e}")
        return {
            "supported": True,
            "extracted_text": None,
            "message": "İlan yüklenirken bir hata oluştu. Lütfen metni manuel yapıştırın.",
        }


def create_jd(
    user_id: int,
    raw_text: str,
    db: Session,
    url: str | None = None,
    title: str | None = None,
    company: str | None = None,
) -> JobDescription:
    """Save a new JobDescription record."""
    jd = JobDescription(
        user_id=user_id,
        raw_text=raw_text,
        url=url,
        title=title,
        company=company,
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)
    return jd


def list_user_jds(user_id: int, db: Session) -> list[JobDescription]:
    """Return all JDs belonging to the user, newest first."""
    return (
        db.query(JobDescription)
        .filter(JobDescription.user_id == user_id)
        .order_by(JobDescription.created_at.desc())
        .limit(50)
        .all()
    )


def get_jd(jd_id: int, user_id: int, db: Session) -> JobDescription | None:
    """Return a single JD if it belongs to the user."""
    return (
        db.query(JobDescription)
        .filter(JobDescription.id == jd_id, JobDescription.user_id == user_id)
        .first()
    )
