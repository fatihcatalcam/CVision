"""
Analysis router - triggers CV analysis and returns results.
All endpoints require authentication.

Endpoints:
    POST /analysis/{cv_id}          - Trigger analysis for a CV
    GET  /analysis/{cv_id}/results  - Get analysis results

Implements FR8, FR9, FR10, FR11, FR20.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.analysis import (
    AnalysisResponse,
    AnalysisScores,
    AISuggestion,
    LayoutXrayResponse,
    XrayFinding,
)
from app.schemas.suggestion import SuggestionResponse
from app.schemas.skill import ExtractedSkillResponse
from app.schemas.career_recommendation import CareerRecommendationResponse
from app.models.cv import CV
from app.models.analysis import AnalysisResult
from app.services.cv_service import CVService
from app.services.analysis_service import AnalysisService
from app.utils.hashids import decode_id

logger = logging.getLogger("cvision.routers.analysis")

router = APIRouter(prefix="/analysis", tags=["Analysis"])


# (This schema can be defined inline here for simplicity)
class AnalysisStatusResponse(BaseModel):
    cv_id: int
    status: str
    error_message: str | None = None

@router.get(
    "/{cv_id}/status",
    response_model=AnalysisStatusResponse,
    summary="Get background analysis status",
)
def get_analysis_status(
    cv_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Check the current status of an uploaded CV's analysis process.
    Expected statuses: 'pending', 'processing', 'completed', 'failed'.
    """
    db_cv_id = decode_id(cv_id)
    cv = CVService.get_cv(db_cv_id, current_user, db)
    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CV with id {cv_id} not found",
        )

    return AnalysisStatusResponse(
        cv_id=cv.id,
        status=cv.status,
    )


@router.get(
    "/{cv_id}/results",
    response_model=AnalysisResponse,
    summary="Get analysis results",
)
def get_analysis_results(
    cv_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve the analysis results for a specific CV.
    Includes scores, suggestions, extracted skills, and career recommendations.
    Users can only access analysis for their own CVs.
    """
    db_cv_id = decode_id(cv_id)
    # Verify CV exists and belongs to user
    cv = CVService.get_cv(db_cv_id, current_user, db)
    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CV with id {cv_id} not found",
        )

    analysis = AnalysisService.get_analysis(db_cv_id, db)
    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No analysis found for CV {cv_id}. Trigger analysis first.",
        )

    return _build_analysis_response(analysis, current_user)


@router.post(
    "/{cv_id}/unlock",
    response_model=AnalysisResponse,
    summary="Unlock the full report for this analysis",
)
def unlock_analysis(
    cv_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Spend credits to unlock one report, and return it unlocked.

    Charging here rather than at upload is what makes the first step cheap: a
    user pays one credit to see the score and the teasers, and only pays the
    rest once they have decided the answer is worth having.
    """
    from app.config import settings
    from app.services.credit_service import CreditService, InsufficientCredits

    db_cv_id = decode_id(cv_id)
    cv = CVService.get_cv(db_cv_id, current_user, db)
    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CV with id {cv_id} not found",
        )

    analysis = AnalysisService.get_analysis(db_cv_id, db)
    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No analysis found for CV {cv_id}.",
        )

    # Idempotent: a double-click, a retry or a stale tab must not charge twice.
    if analysis.is_unlocked:
        return _build_analysis_response(analysis, current_user)

    try:
        CreditService.spend(
            db, current_user, settings.CREDIT_UNLOCK, "spend_unlock",
            ref_id=str(db_cv_id),
        )
    except InsufficientCredits as exc:
        raise HTTPException(
            status_code=402,
            detail=(
                f"Not enough credits: unlocking costs {exc.needed}, "
                f"you have {exc.available}."
            ),
        )

    analysis.is_unlocked = True
    db.commit()
    db.refresh(analysis)

    return _build_analysis_response(analysis, current_user)


def _suggestion_teaser(message: str | None, max_words: int = 6, max_chars: int = 55) -> str | None:
    """First few words of a locked suggestion — enough to entice, not to give
    away the advice. Used for the blurred preview on gated results."""
    if not message:
        return None
    snippet = " ".join(message.split()[:max_words])
    if len(snippet) > max_chars:
        snippet = snippet[:max_chars].rstrip()
    return snippet + "…"


def _build_xray_response(layout_xray: dict | None, is_free: bool) -> LayoutXrayResponse | None:
    """Gate the stored X-Ray JSON for the response. Locked results get a
    <=200-char robot-view teaser and only the first finding - the full
    simulation never leaves the server (mirrors _suggestion_teaser)."""
    if not layout_xray:
        return None
    if not layout_xray.get("available"):
        return LayoutXrayResponse(
            available=False, reason=layout_xray.get("reason"),
        )

    findings = [
        XrayFinding(type=f.get("type", ""), severity=f.get("severity", "info"),
                    page=f.get("page", 1))
        for f in layout_xray.get("findings", [])
        if isinstance(f, dict)
    ]
    robot_lines = [
        {"t": l.get("t", ""), "m": bool(l.get("m"))}
        for l in layout_xray.get("robot_lines", [])
        if isinstance(l, dict)
    ]

    if not is_free:
        return LayoutXrayResponse(
            available=True, findings=findings, findings_total=len(findings),
            robot_lines=robot_lines, is_locked=False,
        )

    teaser: list[dict] = []
    chars = 0
    for line in robot_lines:
        if chars >= 200:
            break
        remaining = 200 - chars
        text = line["t"][:remaining]
        teaser.append({"t": text, "m": line["m"]})
        chars += len(text)

    return LayoutXrayResponse(
        available=True, findings=findings[:1], findings_total=len(findings),
        robot_lines=teaser, is_locked=True,
    )


def _build_analysis_response(analysis, current_user: User | None = None, force_locked: bool = False) -> AnalysisResponse:
    """Build the response model from an AnalysisResult ORM instance."""
    # Locking is now a property of the report, not of the viewer. Under the old
    # rule a lapsed subscription silently re-locked results the user had already
    # paid for; unlocking is a purchase, so it sticks to what was bought.
    #
    # An admin is not gated on SOMEONE ELSE'S report: the HQ panel links
    # straight here to review a user's analysis and a half-locked view defeats
    # the point. On their own reports an admin pays like anyone else.
    #
    # It used to be any admin, on any report. That made the founder's account
    # the one account that could never see what a paying user sees - which is
    # how "Normal shows the whole Pro report" survived unnoticed. The person
    # most likely to test the product was structurally blind to the bug.
    #
    # The anonymous /try path passes force_locked with no user at all.
    owner_id = analysis.cv.user_id if analysis.cv else None
    is_admin_reviewing = (
        current_user is not None
        and current_user.role == "admin"
        and owner_id != current_user.id
    )
    is_free = force_locked or (not is_admin_reviewing and not analysis.is_unlocked)

    # Parse AI suggestions from JSON if present
    raw_ai_suggestions = analysis.ai_suggestions or []
    ai_suggestions = []
    
    for i, s in enumerate(raw_ai_suggestions):
        if not isinstance(s, dict):
            continue
            
        if is_free and i > 0:
            # Lock everything after the 1st suggestion. Send only a short teaser
            # (first few words) so the UI can show a blurred preview — the full
            # message and rewrite hint never leave the server.
            ai_suggestions.append(
                AISuggestion(
                    category=s.get("category", "general"),
                    priority=s.get("priority", "medium"),
                    message=None,
                    rewrite_hint=None,
                    is_locked=True,
                    teaser=_suggestion_teaser(s.get("message")),
                )
            )
        else:
            # First suggestion or premium user
            ai_suggestions.append(
                AISuggestion(
                    category=s.get("category", "general"),
                    priority=s.get("priority", "medium"),
                    message=s.get("message", ""),
                    rewrite_hint=None if is_free else s.get("rewrite_hint", ""),
                    is_locked=False
                )
            )

    ai_summary = getattr(analysis, 'ai_summary', None)
    is_summary_locked = False
    
    if is_free and ai_summary:
        is_summary_locked = True
        ai_summary = ai_summary[:120] + "..."

    return AnalysisResponse(
        id=analysis.id,
        cv_id=analysis.cv_id,
        extracted_text=analysis.cv.extracted_text,
        scores=AnalysisScores(
            overall_score=analysis.overall_score,
            ats_score=analysis.ats_score,
            keyword_score=analysis.keyword_score,
            completeness_score=analysis.completeness_score,
            experience_score=analysis.experience_score,
        ),
        summary=analysis.summary,
        strengths=analysis.strengths or [],
        weaknesses=analysis.weaknesses or [],
        detected_sections=analysis.detected_sections or {},
        suggestions=[
            SuggestionResponse(
                id=s.id,
                category=s.category,
                priority=s.priority,
                message=s.message,
                snippets=s.snippets or [],
            )
            for s in analysis.suggestions
        ],
        extracted_skills=[
            ExtractedSkillResponse(
                skill_name=es.skill.name,
                skill_category=es.skill.category,
                confidence_score=es.confidence_score,
            )
            for es in analysis.extracted_skills
        ],
        career_recommendations=[
            CareerRecommendationResponse(
                role_title=cr.role_profile.title,
                match_score=cr.match_score,
                explanation=cr.explanation,
            )
            for cr in analysis.career_recommendations
        ],
        ai_summary=ai_summary,
        is_summary_locked=is_summary_locked,
        ai_suggestions=ai_suggestions,
        ai_enhanced=bool(getattr(analysis, 'ai_enhanced', 0)),
        layout_xray=_build_xray_response(getattr(analysis, 'layout_xray', None), is_free),
        created_at=analysis.created_at,
    )


# ---- Rewrite Bullet Endpoint ----

class RewriteRequest(BaseModel):
    bullet_text: str
    cv_context: str = ""
    target_role: str | None = None

class RewriteResponse(BaseModel):
    original: str
    rewritten: str | None
    success: bool


@router.post(
    "/rewrite-bullet",
    response_model=RewriteResponse,
    summary="AI rewrite of a single CV bullet point",
)
def rewrite_bullet(
    body: RewriteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Use GPT to rewrite a single CV bullet point to be more impactful.
    Costs credits; requires AI to be enabled.
    """
    from app.config import settings
    from app.dependencies import charge
    from app.services.ai_service import ai_rewrite_bullet, is_ai_enabled
    from app.services.credit_service import CreditService

    if not is_ai_enabled():
        raise HTTPException(
            status_code=503,
            detail="AI service is not available. Please try again later."
        )

    charge(db, current_user, settings.CREDIT_REWRITE, "spend_rewrite")

    rewritten = ai_rewrite_bullet(
        bullet_text=body.bullet_text,
        cv_context=body.cv_context,
        target_role=body.target_role,
    )
    if rewritten is None:
        CreditService.refund(
            db, current_user, settings.CREDIT_REWRITE, "refund_failed_rewrite"
        )
        db.commit()

    return RewriteResponse(
        original=body.bullet_text,
        rewritten=rewritten,
        success=rewritten is not None,
    )
