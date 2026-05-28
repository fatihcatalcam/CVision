"""
Dashboard router - provides user-specific summary metrics and CV history.
Maps to FR20.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.cv import CV
from app.models.analysis import AnalysisResult
from app.schemas.dashboard import DashboardSummaryResponse, AnalysisHistoryItem, AnalysisHistoryResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse, summary="Get user dashboard summary")
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns aggregated metrics plus career insight fields for the dashboard.
    All new fields are nullable — safe when the user has no analyses yet.
    """
    from sqlalchemy import case as sa_case
    from app.models.career_recommendation import CareerRecommendation
    from app.models.suggestion import Suggestion

    # ---- Totals ----
    total_cvs = db.query(CV).filter(CV.user_id == current_user.id).count()
    total_analyses = (
        db.query(AnalysisResult)
        .join(CV)
        .filter(CV.user_id == current_user.id)
        .count()
    )

    if total_analyses == 0:
        return DashboardSummaryResponse(
            total_cvs=total_cvs,
            total_analyses=0,
            average_score=None,
            latest_score=None,
        )

    # ---- Average ----
    avg_score = round(
        db.query(func.avg(AnalysisResult.overall_score))
        .join(CV)
        .filter(CV.user_id == current_user.id)
        .scalar() or 0,
        1,
    )

    # ---- Last 2 analyses for score + delta ----
    recent = (
        db.query(AnalysisResult)
        .join(CV)
        .filter(CV.user_id == current_user.id)
        .order_by(AnalysisResult.created_at.desc())
        .limit(2)
        .all()
    )
    latest = recent[0]
    second = recent[1] if len(recent) > 1 else None

    score_delta = (
        round(latest.overall_score - second.overall_score, 1)
        if second and latest.overall_score is not None and second.overall_score is not None
        else None
    )

    # ---- Top career recommendation ----
    top_rec = (
        db.query(CareerRecommendation)
        .options(joinedload(CareerRecommendation.role_profile))
        .filter(CareerRecommendation.analysis_id == latest.id)
        .order_by(CareerRecommendation.match_score.desc())
        .first()
    )
    latest_role_title = top_rec.role_profile.title if top_rec else None
    latest_role_match = top_rec.match_score if top_rec else None

    # ---- Top suggestion (high > medium > low) ----
    priority_order = sa_case(
        (Suggestion.priority == "high", 0),
        (Suggestion.priority == "medium", 1),
        (Suggestion.priority == "low", 2),
        else_=3,
    )
    top_sug = (
        db.query(Suggestion)
        .filter(Suggestion.analysis_id == latest.id)
        .order_by(priority_order)
        .first()
    )

    return DashboardSummaryResponse(
        total_cvs=total_cvs,
        total_analyses=total_analyses,
        average_score=avg_score,
        latest_score=latest.overall_score,
        latest_ats_score=latest.ats_score,
        latest_keyword_score=latest.keyword_score,
        latest_completeness_score=latest.completeness_score,
        latest_analysis_id=latest.id,
        latest_cv_id=latest.cv_id,
        score_delta=score_delta,
        latest_role_title=latest_role_title,
        latest_role_match=latest_role_match,
        top_suggestion=top_sug.message if top_sug else None,
    )


@router.get("/history", response_model=AnalysisHistoryResponse, summary="Get user CV analysis history")
def get_analysis_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns a paginated list of the user's uploaded CVs with their analysis results.
    Ordered by upload date (newest first).
    """
    query = (
        db.query(CV)
        .options(joinedload(CV.analysis_result))
        .filter(CV.user_id == current_user.id)
        .order_by(CV.uploaded_at.desc())
    )

    total = query.count()
    cvs = query.offset(skip).limit(limit).all()

    items = []
    for cv in cvs:
        analysis = cv.analysis_result
        items.append(
            AnalysisHistoryItem(
                cv_id=cv.id,
                original_filename=cv.original_filename,
                target_domain=cv.target_domain,
                status=cv.status,
                uploaded_at=cv.uploaded_at,
                overall_score=analysis.overall_score if analysis else None,
                ats_score=analysis.ats_score if analysis else None,
                keyword_score=analysis.keyword_score if analysis else None,
                analysis_id=analysis.id if analysis else None,
            )
        )

    return AnalysisHistoryResponse(items=items, total=total)
