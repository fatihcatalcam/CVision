"""
Dashboard router — provides user-specific summary metrics.
Maps to FR20.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.cv import CV
from app.models.analysis import AnalysisResult
from app.schemas.dashboard import DashboardSummaryResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse, summary="Get user dashboard summary")
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns aggregated metrics for the logged-in user:
    - Total uploaded CVs
    - Total analyses performed
    - Average overall analysis score
    - Latest overall analysis score
    """
    total_cvs = db.query(CV).filter(CV.user_id == current_user.id).count()
    
    analyses_query = (
        db.query(AnalysisResult)
        .join(CV)
        .filter(CV.user_id == current_user.id)
    )
    
    total_analyses = analyses_query.count()
    
    if total_analyses > 0:
        avg_score = (
            db.query(func.avg(AnalysisResult.overall_score))
            .join(CV)
            .filter(CV.user_id == current_user.id)
            .scalar()
        )
        latest = analyses_query.order_by(AnalysisResult.created_at.desc()).first()
        latest_score = latest.overall_score if latest else None
    else:
        avg_score = None
        latest_score = None

    return DashboardSummaryResponse(
        total_cvs=total_cvs,
        total_analyses=total_analyses,
        average_score=round(avg_score, 1) if avg_score is not None else None,
        latest_score=latest_score
    )
