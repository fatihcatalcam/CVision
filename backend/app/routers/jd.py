"""
JD router — save and retrieve job descriptions.

Endpoints:
    POST /jd/fetch-url   - Extract text from a URL (no save)
    POST /jd/            - Save a job description
    GET  /jd/            - List user's saved JDs

All endpoints require Pro plan.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.jd_service import fetch_url_text, create_jd, list_user_jds
from app.utils.hashids import encode_id, decode_id

logger = logging.getLogger("cvision.routers.jd")

router = APIRouter(prefix="/jd", tags=["JD Matching"])


def _require_pro(user: User) -> None:
    if user.plan_type != "premium":
        raise HTTPException(status_code=403, detail="Bu özellik Pro kullanıcılara özeldir.")


# ── Schemas ──────────────────────────────────────────────────────────────────

class FetchUrlRequest(BaseModel):
    url: str


class FetchUrlResponse(BaseModel):
    supported: bool
    extracted_text: str | None = None
    message: str | None = None


class SaveJDRequest(BaseModel):
    raw_text: str
    url: str | None = None
    title: str | None = None
    company: str | None = None


class JDResponse(BaseModel):
    id: str
    title: str | None
    company: str | None
    url: str | None
    created_at: datetime


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/fetch-url", response_model=FetchUrlResponse, summary="Extract text from a job posting URL")
def fetch_url(
    body: FetchUrlRequest,
    current_user: User = Depends(get_current_user),
):
    """Fetch job description text from a URL. Does not save to database."""
    _require_pro(current_user)
    result = fetch_url_text(body.url)
    return FetchUrlResponse(**result)


@router.post("/", response_model=JDResponse, status_code=201, summary="Save a job description")
def save_jd(
    body: SaveJDRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a job description (text or URL-sourced) to the database."""
    _require_pro(current_user)

    if not body.raw_text or len(body.raw_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="İlan metni çok kısa (min 50 karakter).")

    jd = create_jd(
        user_id=current_user.id,
        raw_text=body.raw_text.strip(),
        db=db,
        url=body.url,
        title=body.title,
        company=body.company,
    )
    return JDResponse(
        id=encode_id(jd.id),
        title=jd.title,
        company=jd.company,
        url=jd.url,
        created_at=jd.created_at,
    )


@router.get("/", response_model=list[JDResponse], summary="List user's saved JDs")
def list_jds(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all job descriptions saved by the current user."""
    _require_pro(current_user)
    jds = list_user_jds(current_user.id, db)
    return [
        JDResponse(
            id=encode_id(jd.id),
            title=jd.title,
            company=jd.company,
            url=jd.url,
            created_at=jd.created_at,
        )
        for jd in jds
    ]
