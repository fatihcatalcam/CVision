"""
Cover letter router — generate and retrieve cover letters.

Endpoints:
    POST /cover-letter/     - Generate cover letter for cv_id + jd_id (costs credits)
    GET  /cover-letter/{id} - Retrieve a saved cover letter (free: already paid for)
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_db, get_current_user, charge
from app.services.credit_service import CreditService
from app.models.user import User
from app.models.cover_letter import CoverLetter
from app.services.jd_service import get_jd
from app.services.cv_service import CVService
from app.services.ai_service import ai_generate_cover_letter, is_ai_enabled
from app.utils.hashids import encode_id, decode_id

logger = logging.getLogger("cvision.routers.cover_letter")

router = APIRouter(prefix="/cover-letter", tags=["Cover Letter"])




# ── Schemas ──────────────────────────────────────────────────────────────────

class CoverLetterRequest(BaseModel):
    cv_id: str
    jd_id: str


class CoverLetterResponse(BaseModel):
    id: str
    cv_id: str
    jd_id: str
    content: str
    created_at: datetime


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/", response_model=CoverLetterResponse, status_code=201, summary="Generate a cover letter")
def generate_cover_letter(
    body: CoverLetterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate an AI cover letter from a CV and job description. Costs credits."""

    if not is_ai_enabled():
        raise HTTPException(status_code=503, detail="AI servisi şu an kullanılamıyor.")

    cv_db_id = decode_id(body.cv_id)
    jd_db_id = decode_id(body.jd_id)

    cv = CVService.get_cv(cv_db_id, current_user, db)
    if cv is None:
        raise HTTPException(status_code=404, detail="CV bulunamadı.")

    if not cv.extracted_text:
        raise HTTPException(status_code=400, detail="CV metni henüz çıkarılmadı.")

    jd = get_jd(jd_db_id, current_user.id, db)
    if jd is None:
        raise HTTPException(status_code=404, detail="İş ilanı bulunamadı.")

    # Charged after validation, refunded if the model gives us nothing - the
    # user pays for a letter, not for an attempt.
    charge(
        db, current_user, settings.CREDIT_COVER_LETTER, "spend_cover_letter",
        ref_id=str(cv_db_id),
    )

    content = ai_generate_cover_letter(cv.extracted_text, jd.raw_text)
    if not content:
        CreditService.refund(
            db, current_user, settings.CREDIT_COVER_LETTER,
            "refund_failed_cover_letter", ref_id=str(cv_db_id),
        )
        db.commit()
        raise HTTPException(status_code=502, detail="Ön yazı oluşturulamadı. Tekrar deneyin.")

    letter = CoverLetter(
        cv_id=cv_db_id,
        jd_id=jd_db_id,
        content=content,
    )
    db.add(letter)
    db.commit()
    db.refresh(letter)

    logger.info(f"Cover letter created: id={letter.id}, cv_id={cv_db_id}, jd_id={jd_db_id}")
    return CoverLetterResponse(
        id=encode_id(letter.id),
        cv_id=encode_id(letter.cv_id),
        jd_id=encode_id(letter.jd_id),
        content=letter.content,
        created_at=letter.created_at,
    )


@router.get("/{letter_id}", response_model=CoverLetterResponse, summary="Get cover letter")
def get_cover_letter(
    letter_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve a previously generated cover letter."""

    db_id = decode_id(letter_id)
    letter = db.query(CoverLetter).filter(CoverLetter.id == db_id).first()

    if letter is None:
        raise HTTPException(status_code=404, detail="Ön yazı bulunamadı.")

    cv = CVService.get_cv(letter.cv_id, current_user, db)
    if cv is None:
        raise HTTPException(status_code=403, detail="Bu ön yazıya erişim yetkiniz yok.")

    return CoverLetterResponse(
        id=encode_id(letter.id),
        cv_id=encode_id(letter.cv_id),
        jd_id=encode_id(letter.jd_id),
        content=letter.content,
        created_at=letter.created_at,
    )
