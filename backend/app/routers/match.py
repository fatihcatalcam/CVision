"""
Match router — trigger and retrieve CV vs JD match results.

Endpoints:
    POST /match/     - Run AI match for cv_id + jd_id (costs credits)
    GET  /match/{id} - Retrieve a saved match result (free: already paid for)
"""

import logging
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_db, get_current_user, charge
from app.services.credit_service import CreditService
from app.models.user import User
from app.models.cv_jd_match import CVJDMatch
from app.services.jd_service import get_jd
from app.services.cv_service import CVService
from app.services.ai_service import ai_match_cv_jd, is_ai_enabled
from app.utils.hashids import encode_id, decode_id

logger = logging.getLogger("cvision.routers.match")

router = APIRouter(prefix="/match", tags=["JD Matching"])




# ── Schemas ──────────────────────────────────────────────────────────────────

class GapItemResponse(BaseModel):
    category: Literal["skills", "experience", "education", "keywords", "other"]
    priority: Literal["high", "medium", "low"]
    description: str
    suggestion: str


class MatchRequest(BaseModel):
    cv_id: str
    jd_id: str


class MatchResponse(BaseModel):
    id: str
    cv_id: str
    jd_id: str
    match_score: int
    summary: str | None
    matched_keywords: list[str]
    missing_keywords: list[str]
    gap_analysis: list[GapItemResponse]
    created_at: datetime


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/", response_model=MatchResponse, status_code=201, summary="Run CV vs JD match")
def create_match(
    body: MatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run AI-powered CV vs job description matching. Costs credits."""

    if not is_ai_enabled():
        raise HTTPException(status_code=503, detail="AI servisi şu an kullanılamıyor.")

    cv_db_id = decode_id(body.cv_id)
    jd_db_id = decode_id(body.jd_id)

    cv = CVService.get_cv(cv_db_id, current_user, db)
    if cv is None:
        raise HTTPException(status_code=404, detail="CV bulunamadı.")

    if not cv.extracted_text:
        raise HTTPException(status_code=400, detail="CV metni henüz çıkarılmadı. Lütfen bekleyin.")

    jd = get_jd(jd_db_id, current_user.id, db)
    if jd is None:
        raise HTTPException(status_code=404, detail="İş ilanı bulunamadı.")

    # Charged after validation, before the AI call: a bad request must not cost
    # anything, and neither must a failure on our side - hence the refund below
    # rather than charging only on success, which would leave a window where the
    # work is done and unpaid.
    charge(db, current_user, settings.CREDIT_MATCH, "spend_match", ref_id=str(cv_db_id))

    result = ai_match_cv_jd(cv.extracted_text, jd.raw_text)
    if not result:
        CreditService.refund(
            db, current_user, settings.CREDIT_MATCH, "refund_failed_match",
            ref_id=str(cv_db_id),
        )
        db.commit()
        raise HTTPException(status_code=502, detail="Eşleştirme tamamlanamadı. Tekrar deneyin.")

    match = CVJDMatch(
        cv_id=cv_db_id,
        jd_id=jd_db_id,
        match_score=result.get("match_score", 0),
        summary=result.get("summary"),
        matched_keywords=result.get("matched_keywords", []),
        missing_keywords=result.get("missing_keywords", []),
        gap_analysis=result.get("gap_analysis", []),
    )
    db.add(match)
    db.commit()
    db.refresh(match)

    return _build_response(match)


@router.get("/{match_id}", response_model=MatchResponse, summary="Get match result")
def get_match(
    match_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve a previously computed match result."""

    db_id = decode_id(match_id)
    match = db.query(CVJDMatch).filter(CVJDMatch.id == db_id).first()

    if match is None:
        raise HTTPException(status_code=404, detail="Eşleştirme bulunamadı.")

    # Ownership check via CV
    cv = CVService.get_cv(match.cv_id, current_user, db)
    if cv is None:
        raise HTTPException(status_code=403, detail="Bu eşleştirmeye erişim yetkiniz yok.")

    return _build_response(match)


def _build_response(match: CVJDMatch) -> MatchResponse:
    gap_items = []
    for g in (match.gap_analysis or []):
        if isinstance(g, dict):
            gap_items.append(GapItemResponse(
                category=g.get("category", "other"),
                priority=g.get("priority", "medium"),
                description=g.get("description", ""),
                suggestion=g.get("suggestion", ""),
            ))
    return MatchResponse(
        id=encode_id(match.id),
        cv_id=encode_id(match.cv_id),
        jd_id=encode_id(match.jd_id),
        match_score=match.match_score,
        summary=match.summary,
        matched_keywords=match.matched_keywords or [],
        missing_keywords=match.missing_keywords or [],
        gap_analysis=gap_items,
        created_at=match.created_at,
    )
