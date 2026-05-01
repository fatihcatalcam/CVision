"""
Analysis router — triggers CV analysis and returns results.
All endpoints require authentication.

Endpoints:
    POST /analysis/{cv_id}          — Trigger analysis for a CV
    GET  /analysis/{cv_id}/results  — Get analysis results

Implements FR8, FR9, FR10, FR11, FR20.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.analysis import AnalysisResponse, AnalysisScores, AISuggestion
from app.schemas.suggestion import SuggestionResponse
from app.schemas.skill import ExtractedSkillResponse
from app.schemas.career_recommendation import CareerRecommendationResponse
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
    db_cv_id = int(cv_id) if cv_id.isdigit() else decode_id(cv_id)
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
    db_cv_id = int(cv_id) if cv_id.isdigit() else decode_id(cv_id)
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


def _build_analysis_response(analysis, current_user: User | None = None) -> AnalysisResponse:
    """Build the response model from an AnalysisResult ORM instance."""
    is_free = current_user.plan_type == "free" if current_user else False

    # Parse AI suggestions from JSON if present
    raw_ai_suggestions = analysis.ai_suggestions or []
    ai_suggestions = []
    
    for i, s in enumerate(raw_ai_suggestions):
        if not isinstance(s, dict):
            continue
            
        if is_free and i > 0:
            # Lock everything after the 1st suggestion
            ai_suggestions.append(
                AISuggestion(
                    category=s.get("category", "general"),
                    priority=s.get("priority", "medium"),
                    message=None,
                    rewrite_hint=None,
                    is_locked=True
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
):
    """
    Use GPT to rewrite a single CV bullet point to be more impactful.
    Premium feature — requires AI to be enabled.
    """
    from app.services.ai_service import ai_rewrite_bullet, is_ai_enabled

    if current_user.plan_type == "free":
        raise HTTPException(
            status_code=403,
            detail="Rewriting CV bullets is a Premium feature."
        )

    if not is_ai_enabled():
        raise HTTPException(
            status_code=503,
            detail="AI service is not available. Please try again later."
        )

    rewritten = ai_rewrite_bullet(
        bullet_text=body.bullet_text,
        cv_context=body.cv_context,
        target_role=body.target_role,
    )

    return RewriteResponse(
        original=body.bullet_text,
        rewritten=rewritten,
        success=rewritten is not None,
    )
