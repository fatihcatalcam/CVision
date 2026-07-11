"""
Admin router - provides system-wide analytics and user management endpoints.
Requires 'admin' role privileges.
Maps to FR21, FR22.
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from pathlib import Path

from app.dependencies import get_db, require_admin
from app.models.user import User
from app.models.cv import CV
from app.models.analysis import AnalysisResult
from app.schemas.admin import (
    AdminStatsResponse, AdminUsersListResponse, RecentActivity,
    AdminAnalysisListResponse, AdminAnalysisListItem, AdminCVContent,
    AdminOverviewResponse, DailyActivity, ScoreDistribution, DomainStat
)
from app.schemas.user import UserResponse
from app.schemas.analysis import AnalysisResponse
from app.routers.analysis import _build_analysis_response

router = APIRouter(prefix="/hq-portal", tags=["Admin"])


@router.get(
    "/overview",
    response_model=AdminOverviewResponse,
    summary="Get detailed system overview (Admin)",
    dependencies=[Depends(require_admin)]
)
def get_overview(db: Session = Depends(get_db)):
    """Returns all dashboard metrics in a single call."""
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    fourteen_days_ago = now - timedelta(days=13)

    # Basic counts
    total_users = db.query(User).count()
    total_cvs = db.query(CV).count()
    total_analyses = db.query(AnalysisResult).count()
    avg_score = db.query(func.avg(AnalysisResult.overall_score)).scalar()

    # User breakdown
    free_users = db.query(User).filter(User.plan_type == "free").count()
    premium_users = db.query(User).filter(User.plan_type == "premium").count()
    new_users_this_week = db.query(User).filter(User.created_at >= week_ago).count()

    # Analysis breakdown
    new_analyses_this_week = db.query(AnalysisResult).filter(AnalysisResult.created_at >= week_ago).count()
    ai_enhanced_count = db.query(AnalysisResult).filter(AnalysisResult.ai_enhanced == 1).count()

    # Score distribution
    low = db.query(AnalysisResult).filter(AnalysisResult.overall_score < 50).count()
    medium = db.query(AnalysisResult).filter(
        AnalysisResult.overall_score >= 50, AnalysisResult.overall_score < 80
    ).count()
    high = db.query(AnalysisResult).filter(AnalysisResult.overall_score >= 80).count()

    # Top domains (top 6)
    domain_rows = (
        db.query(CV.target_domain, func.count(CV.id))
        .filter(CV.target_domain.isnot(None))
        .group_by(CV.target_domain)
        .order_by(func.count(CV.id).desc())
        .limit(6)
        .all()
    )
    top_domains = [DomainStat(domain=d or "Unknown", count=c) for d, c in domain_rows]

    # Daily activity last 14 days
    recent_analyses = db.query(AnalysisResult.created_at).filter(
        AnalysisResult.created_at >= fourteen_days_ago
    ).all()
    recent_signups = db.query(User.created_at).filter(
        User.created_at >= fourteen_days_ago
    ).all()

    analyses_by_day: dict[str, int] = defaultdict(int)
    signups_by_day: dict[str, int] = defaultdict(int)

    for (dt,) in recent_analyses:
        analyses_by_day[dt.date().isoformat()] += 1
    for (dt,) in recent_signups:
        signups_by_day[dt.date().isoformat()] += 1

    daily_activity = []
    for i in range(13, -1, -1):
        d = (now - timedelta(days=i)).date().isoformat()
        daily_activity.append(DailyActivity(
            date=d,
            analyses=analyses_by_day.get(d, 0),
            signups=signups_by_day.get(d, 0)
        ))

    # Recent activity (reuse existing logic)
    activities = []
    recent_users_list = db.query(User).order_by(User.created_at.desc()).limit(5).all()
    for u in recent_users_list:
        activities.append(RecentActivity(
            id=f"u_{u.id}", type="user",
            title="New User Registered",
            description=f"{u.full_name} ({u.email}) joined CVision.",
            timestamp=u.created_at
        ))
    recent_analyses_list = db.query(AnalysisResult).order_by(AnalysisResult.created_at.desc()).limit(5).all()
    for a in recent_analyses_list:
        # Anonymous /try analyses have an ownerless CV (cv.owner is None).
        owner_name = a.cv.owner.full_name if (a.cv and a.cv.owner) else "Anonymous visitor"
        filename = a.cv.original_filename if a.cv else "Unknown"
        activities.append(RecentActivity(
            id=f"a_{a.id}", type="analysis",
            title="New CV Analyzed",
            description=f"{owner_name} analyzed '{filename}'. Score: {a.overall_score}%",
            timestamp=a.created_at
        ))
    activities.sort(key=lambda x: x.timestamp, reverse=True)

    return AdminOverviewResponse(
        total_users=total_users,
        total_cvs=total_cvs,
        total_analyses=total_analyses,
        average_system_score=round(avg_score, 1) if avg_score is not None else None,
        free_users=free_users,
        premium_users=premium_users,
        new_users_this_week=new_users_this_week,
        new_analyses_this_week=new_analyses_this_week,
        ai_enhanced_count=ai_enhanced_count,
        score_distribution=ScoreDistribution(low=low, medium=medium, high=high),
        top_domains=top_domains,
        daily_activity=daily_activity,
        recent_activities=activities[:10],
    )


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
        users=[UserResponse.model_validate(u) for u in users],
        total=total
    )


@router.patch(
    "/users/{user_id}/role",
    response_model=UserResponse,
    summary="Change a user's role (Admin)",
    dependencies=[Depends(require_admin)]
)
def change_user_role(
    user_id: int,
    role: str = Query(..., regex="^(user|admin)$", description="New role: 'user' or 'admin'"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Change a user's role between 'user' and 'admin'.
    Admins cannot change their own role.
    """
    if current_admin.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found."
        )

    user.role = role
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)


@router.patch(
    "/users/{user_id}/plan",
    response_model=UserResponse,
    summary="Change a user's subscription plan (Admin)",
    dependencies=[Depends(require_admin)]
)
def change_user_plan(
    user_id: int,
    plan: str = Query(..., regex="^(free|premium)$", description="New plan: 'free' or 'premium'"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Change a user's subscription plan between 'free' and 'premium'.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found."
        )

    user.plan_type = plan
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a user (Admin)",
    dependencies=[Depends(require_admin)]
)
def delete_user(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Delete a user and all their associated data (CVs, analyses, etc.).
    Admins cannot delete themselves.
    """
    if current_admin.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found."
        )

    db.delete(user)
    db.commit()

    return None


@router.get(
    "/recent-activity",
    response_model=list[RecentActivity],
    summary="Get recent system activity (Admin)",
    dependencies=[Depends(require_admin)]
)
def get_recent_activity(db: Session = Depends(get_db)):
    """
    Returns the 10 most recent system events (registrations and analyses).
    """
    activities = []
    
    # Get last 10 users
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(10).all()
    for u in recent_users:
        activities.append(
            RecentActivity(
                id=f"u_{u.id}",
                type="user",
                title="New User Registered",
                description=f"{u.full_name} ({u.email}) joined CVision.",
                timestamp=u.created_at
            )
        )
        
    # Get last 10 analyses
    recent_analyses = db.query(AnalysisResult).order_by(AnalysisResult.created_at.desc()).limit(10).all()
    for a in recent_analyses:
        # Anonymous /try analyses have an ownerless CV (cv.owner is None).
        owner_name = a.cv.owner.full_name if (a.cv and a.cv.owner) else "Anonymous visitor"
        filename = a.cv.original_filename if a.cv else "Unknown"
        activities.append(
            RecentActivity(
                id=f"a_{a.id}",
                type="analysis",
                title="New CV Analyzed",
                description=f"{owner_name} analyzed '{filename}'. Score: {a.overall_score}%",
                timestamp=a.created_at
            )
        )
        
    # Sort descending by timestamp and return top 10
    activities.sort(key=lambda x: x.timestamp, reverse=True)
    return activities[:10]


@router.get(
    "/analyses",
    response_model=AdminAnalysisListResponse,
    summary="List all analyses in the system (Admin)",
    dependencies=[Depends(require_admin)]
)
def list_all_analyses(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Paginated list of all analysis results."""
    query = db.query(AnalysisResult).order_by(AnalysisResult.created_at.desc())
    total = query.count()
    analyses = query.offset(skip).limit(limit).all()
    
    items = []
    for a in analyses:
        role = "Unknown"
        if a.career_recommendations and len(a.career_recommendations) > 0:
            role = a.career_recommendations[0].role_profile.title
        elif a.cv and a.cv.target_domain:
            role = a.cv.target_domain

        # Anonymous /try analyses have an ownerless CV (cv.owner is None).
        has_owner = bool(a.cv and a.cv.owner)
        items.append(
            AdminAnalysisListItem(
                id=a.id,
                cv_id=a.cv.id if a.cv else 0,
                user_email=a.cv.owner.email if has_owner else "Anonymous",
                user_name=a.cv.owner.full_name if has_owner else "Anonymous",
                cv_filename=a.cv.original_filename if a.cv else "Unknown",
                role_profile=role,
                score=a.overall_score,
                created_at=a.created_at
            )
        )
        
    return AdminAnalysisListResponse(items=items, total=total)


@router.get(
    "/analyses/{analysis_id}",
    response_model=AnalysisResponse,
    summary="Get full analysis details (Admin)",
    dependencies=[Depends(require_admin)]
)
def get_admin_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)):
    """Fetch all details of an analysis regardless of ownership."""
    analysis = db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis with id {analysis_id} not found."
        )
    return _build_analysis_response(analysis)


@router.get(
    "/cvs/{cv_id}",
    response_model=AdminCVContent,
    summary="Get CV content (Admin)",
    dependencies=[Depends(require_admin)]
)
def get_cv_content(cv_id: int, db: Session = Depends(get_db)):
    """Returns the extracted text and metadata of a CV for admin review."""
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CV with id {cv_id} not found."
        )
    return AdminCVContent(
        cv_id=cv.id,
        original_filename=cv.original_filename,
        file_type=cv.file_type,
        file_size=cv.file_size,
        target_domain=cv.target_domain,
        extracted_text=cv.extracted_text,
        uploaded_at=cv.uploaded_at,
        user_name=cv.owner.full_name if cv.owner else "Unknown",
        user_email=cv.owner.email if cv.owner else "Unknown",
    )


@router.get(
    "/cvs/{cv_id}/file",
    summary="Serve original CV file (Admin)",
    dependencies=[Depends(require_admin)]
)
def get_cv_file_admin(cv_id: int, db: Session = Depends(get_db)):
    """Streams the original CV file for admin preview — bypasses ownership check."""
    from app.config import settings
    cv = db.query(CV).filter(CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found.")

    target_path = Path(cv.file_path).resolve()
    base_path = Path(settings.upload_path).resolve()

    if not target_path.is_relative_to(base_path):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Path traversal detected.")

    media_type = "application/pdf" if cv.file_type == "pdf" else "text/plain"

    if not target_path.exists():
        # Disk file gone — fall back to bytes stored in the database
        if cv.file_content:
            from fastapi.responses import Response
            return Response(
                content=cv.file_content,
                media_type=media_type,
                headers={"Content-Disposition": f'inline; filename="{cv.original_filename}"'},
            )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File is no longer available. The user would need to re-upload their CV.")

    return FileResponse(
        path=str(target_path),
        filename=cv.original_filename,
        media_type=media_type,
        content_disposition_type="inline",
    )


@router.delete(
    "/analyses/{analysis_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an analysis and its CV (Admin)",
    dependencies=[Depends(require_admin)]
)
def delete_admin_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)):
    """Deletes an analysis result and the parent CV record."""
    analysis = db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis with id {analysis_id} not found."
        )
        
    # Note: Because of cascade delete setup originally defined,
    # deleting the CV should delete the analysis. Or deleting the analysis just deletes the analysis.
    # In CVision, a CV has 1 analysis. So we should actually delete the CV.
    cv_to_delete = analysis.cv
    if cv_to_delete:
        db.delete(cv_to_delete)
    else:
        db.delete(analysis)
        
    db.commit()
    return None
