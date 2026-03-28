"""
Admin router — provides system-wide analytics and user management endpoints.
Requires 'admin' role privileges.
Maps to FR21, FR22.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.dependencies import get_db, require_admin
from app.models.user import User
from app.models.cv import CV
from app.models.analysis import AnalysisResult
from app.schemas.admin import AdminStatsResponse, AdminUsersListResponse
from app.schemas.user import UserResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="Get system-wide metrics (Admin)",
    dependencies=[Depends(require_admin)]
)
def get_system_stats(db: Session = Depends(get_db)):
    """
    Returns aggregated platform metrics for administration:
    - Total registered users
    - Total uploaded CVs
    - Total number of analysis generated
    - Average platform-wide CV score
    Requires 'admin' role.
    """
    total_users = db.query(User).count()
    total_cvs = db.query(CV).count()
    total_analyses = db.query(AnalysisResult).count()
    
    avg_score = db.query(func.avg(AnalysisResult.overall_score)).scalar()
    
    return AdminStatsResponse(
        total_users=total_users,
        total_cvs=total_cvs,
        total_analyses=total_analyses,
        average_system_score=round(avg_score, 1) if avg_score is not None else None
    )


@router.get(
    "/users",
    response_model=AdminUsersListResponse,
    summary="List all users (Admin)",
    dependencies=[Depends(require_admin)]
)
def list_all_users(
    skip: int = Query(0, ge=0, description="Number of users to skip"),
    limit: int = Query(20, ge=1, le=100, description="Max users to return"),
    db: Session = Depends(get_db)
):
    """
    List all users with pagination support.
    Requires 'admin' role.
    """
    users_query = db.query(User).order_by(User.created_at.desc())
    total = users_query.count()
    users = users_query.offset(skip).limit(limit).all()
    
    return AdminUsersListResponse(
        users=[
            UserResponse(
                id=u.id,
                full_name=u.full_name,
                email=u.email,
                role=u.role,
                created_at=u.created_at
            ) for u in users
        ],
        total=total
    )
