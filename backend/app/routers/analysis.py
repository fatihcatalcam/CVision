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
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.analysis import AnalysisResponse, AnalysisScores
from app.schemas.suggestion import SuggestionResponse
from app.schemas.skill import ExtractedSkillResponse
from app.schemas.career_recommendation import CareerRecommendationResponse
from app.services.cv_service import CVService
from app.services.analysis_service import AnalysisService

logger = logging.getLogger("cvision.routers.analysis")

router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.post(
    "/{cv_id}",
    response_model=AnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Trigger CV analysis",
)
def trigger_analysis(
    cv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Run the full analysis pipeline on an uploaded CV.

    - CV must have 'completed' status (text extraction succeeded)
    - Runs 7 analyzers: section detection, skill extraction, ATS checking,
      keyword scoring, experience evaluation, score calculation, suggestions
    - Re-analysis is supported (previous results are replaced)
    - Returns the complete analysis result with scores, suggestions, and skills
    """
    # Verify CV exists and belongs to user
    cv = CVService.get_cv(cv_id, current_user, db)
    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CV with id {cv_id} not found",
        )

    try:
        analysis = AnalysisService.run_analysis(cv, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return _build_analysis_response(analysis)


@router.get(
    "/{cv_id}/results",
    response_model=AnalysisResponse,
    summary="Get analysis results",
)
def get_analysis_results(
    cv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve the analysis results for a specific CV.
    Includes scores, suggestions, extracted skills, and career recommendations.
    Users can only access analysis for their own CVs.
    """
    # Verify CV exists and belongs to user
    cv = CVService.get_cv(cv_id, current_user, db)
    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CV with id {cv_id} not found",
        )

    analysis = AnalysisService.get_analysis(cv_id, db)
    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No analysis found for CV {cv_id}. Trigger analysis first.",
        )

    return _build_analysis_response(analysis)


def _build_analysis_response(analysis) -> AnalysisResponse:
    """Build the response model from an AnalysisResult ORM instance."""
    return AnalysisResponse(
        id=analysis.id,
        cv_id=analysis.cv_id,
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
        created_at=analysis.created_at,
    )
