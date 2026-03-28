"""
Recommendations router — retrieves career recommendations for an analysis.
Maps to FR12, FR13.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.career_recommendation import CareerRecommendationResponse
from app.services.cv_service import CVService
from app.services.analysis_service import AnalysisService
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["Career Recommendations"])


@router.get(
    "/{analysis_id}",
    response_model=list[CareerRecommendationResponse],
    summary="Get career recommendations",
)
def get_recommendations(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get career recommendations for a specific CV analysis.
    Recommendations are generated during the analysis phase.
    Users can only access recommendations for their own CVs.
    """
    # Verify the analysis exists
    from app.models.analysis import AnalysisResult
    analysis = db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis with id {analysis_id} not found"
        )
        
    # Verify CV belongs to user
    cv = CVService.get_cv(analysis.cv_id, current_user, db)
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access these recommendations"
        )

    recommendations = RecommendationService.get_recommendations_for_analysis(analysis_id, db)
    
    return [
        CareerRecommendationResponse(
            role_title=rec.role_profile.title,
            match_score=rec.match_score,
            explanation=rec.explanation,
        )
        for rec in recommendations
    ]
