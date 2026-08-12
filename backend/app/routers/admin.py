"""
Admin router - provides system-wide analytics and user management endpoints.
Requires 'admin' role privileges.
Maps to FR21, FR22.
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, String, or_
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from pathlib import Path

from app.config import settings
from app.dependencies import get_db, require_admin
from app.models.user import User
from app.models.cv import CV
from app.models.analysis import AnalysisResult
from app.models.credit_transaction import CreditTransaction
from app.schemas.admin import (
    AdminStatsResponse, AdminUsersListResponse, RecentActivity,
    AdminAnalysisListResponse, AdminAnalysisListItem, AdminCVContent,
    AdminOverviewResponse, DailyActivity, ScoreDistribution, DomainStat,
    AdminReferralsResponse, AdminReferralGroup, AdminReferralInvitee,
)
from app.schemas.user import UserResponse
from app.schemas.analysis import AnalysisResponse
from app.routers.analysis import _build_analysis_response
from app.utils.hashids import encode_id

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

    # Credits.
    #
    # Spend is read off the ledger rather than the balance because a balance
    # only shows what is left: a user who was granted 3 and spent 3 looks
    # identical to one who never came back. `delta` is negative on a spend, so
    # the sum is negated to read as a positive quantity of credits consumed.
    credits_in_circulation = db.query(func.coalesce(func.sum(User.credits), 0)).scalar()
    credits_spent_this_week = -(
        db.query(func.coalesce(func.sum(CreditTransaction.delta), 0))
        .filter(
            CreditTransaction.delta < 0,
            CreditTransaction.created_at >= week_ago,
        )
        .scalar()
    )
    paying_users = (
        db.query(func.count(func.distinct(CreditTransaction.user_id)))
        .filter(CreditTransaction.reason == "purchase")
        .scalar()
    )

    # Jobs still in flight, and the subset old enough to be considered stuck.
    # The recovery sweep already re-queues these; the panel had no way to know
    # they existed, so a backlog was only visible by a user complaining.
    stuck_before = now - timedelta(minutes=settings.STUCK_JOB_TIMEOUT_MINUTES)
    in_flight_q = db.query(CV).filter(CV.status.in_(("pending", "processing")))
    jobs_in_flight = in_flight_q.count()
    stuck_jobs = in_flight_q.filter(CV.uploaded_at < stuck_before).count()

    # Analyses where the X-Ray found the PDF had lost its Turkish characters at
    # generation time. Matched against the serialised JSON rather than with a
    # JSON path operator so this does not depend on the column being JSONB;
    # "charset_loss" is a finding type, so a substring hit cannot be anything
    # else.
    charset_loss_count = (
        db.query(AnalysisResult)
        .filter(cast(AnalysisResult.layout_xray, String).like('%"charset_loss"%'))
        .count()
    )

    # Analysis breakdown
    new_analyses_this_week = db.query(AnalysisResult).filter(AnalysisResult.created_at >= week_ago).count()
    ai_enhanced_count = db.query(AnalysisResult).filter(AnalysisResult.ai_enhanced == 1).count()

    # Score distribution
    low = db.query(AnalysisResult).filter(AnalysisResult.overall_score < 50).count()
    medium = db.query(AnalysisResult).filter(
        AnalysisResult.overall_score >= 50, AnalysisResult.overall_score < 80
    ).count()
    high = db.query(AnalysisResult).filter(AnalysisResult.overall_score >= 80).count()

    # Top domains (top 6) - what the user SELECTED. "Other" is the uploader's
    # pre-selected value, so this chart largely measures how many people leave
    # the dropdown alone.
    domain_rows = (
        db.query(CV.target_domain, func.count(CV.id))
        .filter(CV.target_domain.isnot(None))
        .group_by(CV.target_domain)
        .order_by(func.count(CV.id).desc())
        .limit(6)
        .all()
    )
    top_domains = [DomainStat(domain=d or "Unknown", count=c) for d, c in domain_rows]

    # And what the AI read the CVs as. Side by side these answer a question
    # neither can alone: if the detected side spreads across real fields, the
    # domain list is fine and the default is the problem; if it is also mostly
    # "Other", the list genuinely does not cover the people showing up.
    detected_rows = (
        db.query(AnalysisResult.detected_domain, func.count(AnalysisResult.id))
        .filter(AnalysisResult.detected_domain.isnot(None))
        .group_by(AnalysisResult.detected_domain)
        .order_by(func.count(AnalysisResult.id).desc())
        .limit(6)
        .all()
    )
    detected_domains = [DomainStat(domain=d, count=c) for d, c in detected_rows]

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
        credits_in_circulation=credits_in_circulation,
        credits_spent_this_week=credits_spent_this_week,
        paying_users=paying_users,
        jobs_in_flight=jobs_in_flight,
        stuck_jobs=stuck_jobs,
        charset_loss_count=charset_loss_count,
        score_distribution=ScoreDistribution(low=low, medium=medium, high=high),
        top_domains=top_domains,
        detected_domains=detected_domains,
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
    q: str | None = Query(None, description="Match against name or email"),
    db: Session = Depends(get_db)
):
    """
    List all users with pagination support.
    Requires 'admin' role.

    `q` searches the whole table, not the current page. The panel used to fetch
    100 rows and filter them in the browser, which quietly stopped finding
    anyone past the hundredth account - and gave no sign that it had.
    """
    # id breaks ties on created_at. Without it the sort is unstable across
    # pages, so a row inserted in the same second as its neighbours can appear
    # on two pages or on neither - which pagination turns from harmless into a
    # user that cannot be found.
    users_query = db.query(User).order_by(User.created_at.desc(), User.id.desc())

    if q:
        pattern = f"%{q.strip()}%"
        users_query = users_query.filter(
            or_(User.full_name.ilike(pattern), User.email.ilike(pattern))
        )

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


@router.patch(
    "/users/{user_id}/credits",
    response_model=UserResponse,
    summary="Adjust a user's credit balance (Admin)",
    dependencies=[Depends(require_admin)]
)
def adjust_user_credits(
    user_id: int,
    delta: int = Query(..., description="Credits to add (positive) or take away (negative)"),
    db: Session = Depends(get_db),
):
    """Hand out or claw back credits by hand - support, goodwill, a botched run.

    Goes through CreditService like everything else rather than writing the
    column directly. An adjustment that skipped the ledger would be the one
    balance change nobody could explain afterwards, which is exactly the change
    most likely to be questioned.
    """
    from app.services.credit_service import CreditService, InsufficientCredits

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found.",
        )

    if delta == 0:
        raise HTTPException(status_code=400, detail="delta must not be zero.")

    try:
        if delta > 0:
            CreditService.grant(db, user, delta, "grant_admin")
        else:
            CreditService.spend(db, user, -delta, "spend_admin")
    except InsufficientCredits as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot take {exc.needed} credits: the user only has {exc.available}.",
        )

    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.get(
    "/users/{user_id}/credits",
    summary="A user's credit ledger (Admin)",
    dependencies=[Depends(require_admin)]
)
def get_user_credit_ledger(
    user_id: int,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """The statement behind a balance - what "where did my credits go" is
    answered from."""
    from app.models.credit_transaction import CreditTransaction

    rows = (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user_id)
        .order_by(CreditTransaction.created_at.desc(), CreditTransaction.id.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id, "delta": r.delta, "balance_after": r.balance_after,
            "reason": r.reason, "ref_id": r.ref_id, "created_at": r.created_at,
        }
        for r in rows
    ]


@router.get(
    "/export/analyses.csv",
    summary="Every analysis as CSV (Admin)",
    dependencies=[Depends(require_admin)],
)
def export_analyses_csv(db: Session = Depends(get_db)):
    """One row per upload, for looking at the data somewhere other than here.

    The panel answers the questions it was built to answer. This is for the
    ones it was not: which domains actually show up, where scores cluster, how
    the selected domain compares to what the AI read, whether failures follow a
    pattern. A spreadsheet is a better tool for that than any chart shipped in
    advance.

    Driven by CV so failed uploads appear too - they are usually the
    interesting rows. No CV text and no PDF: this is for counting, and a file
    full of people's CVs is not something to hand around casually.
    """
    import csv
    import io

    from fastapi.responses import StreamingResponse

    rows = (
        db.query(CV)
        .order_by(CV.uploaded_at.desc(), CV.id.desc())
        .all()
    )

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "cv_id", "uploaded_at", "status",
        "user_id", "user_email", "is_anonymous",
        "filename", "file_type", "file_size_bytes",
        "selected_domain", "detected_domain", "domain_left_at_default",
        "unlock_requested", "report_unlocked",
        "overall_score", "ats_score", "keyword_score",
        "completeness_score", "experience_score",
        "ai_enhanced", "suggestion_count", "top_role",
    ])

    for cv in rows:
        a = cv.analysis_result
        owner = cv.owner
        role = ""
        if a and a.career_recommendations:
            role = a.career_recommendations[0].role_profile.title

        writer.writerow([
            cv.id,
            cv.uploaded_at.isoformat() if cv.uploaded_at else "",
            cv.status,
            cv.user_id or "",
            owner.email if owner else "",
            "yes" if owner is None else "no",
            cv.original_filename,
            cv.file_type,
            cv.file_size,
            cv.target_domain or "",
            (a.detected_domain if a else "") or "",
            # The uploader pre-selects "Other", so this column separates a real
            # choice from an untouched dropdown - the difference between "our
            # domain list is short" and "nobody uses the dropdown".
            "yes" if (cv.target_domain or "Other") == "Other" else "no",
            "yes" if cv.unlock_requested else "no",
            "yes" if (a and a.is_unlocked) else "no",
            a.overall_score if a else "",
            a.ats_score if a else "",
            a.keyword_score if a else "",
            a.completeness_score if a else "",
            a.experience_score if a else "",
            "yes" if (a and a.ai_enhanced) else "no",
            len(a.ai_suggestions or []) if a else 0,
            role,
        ])

    buffer.seek(0)
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="cvision-analyses-{stamp}.csv"'
        },
    )


@router.get(
    "/referrals",
    response_model=AdminReferralsResponse,
    summary="Who invited whom (Admin)",
    dependencies=[Depends(require_admin)]
)
def list_referrals(db: Session = Depends(get_db)):
    """Every inviter with the accounts that joined through them.

    An invite pays CREDIT_REFERRAL, which makes it the one place in the product
    where creating accounts earns something. Nothing showed who was doing it.
    The reward already only fires after the invitee's first analysis, so the
    per-invitee analysis count is what separates a real invite from a farm:
    a row of invitees with zero analyses is someone who tried and was refused.

    Sorted by invite count, because the interesting end of this list is the top.
    """
    invitees = (
        db.query(User)
        .filter(User.referred_by_id.isnot(None))
        .order_by(User.created_at.desc())
        .all()
    )
    if not invitees:
        return AdminReferralsResponse(groups=[], total_rewarded=0, total_credits_paid=0)

    inviter_ids = {u.referred_by_id for u in invitees}
    inviters = {
        u.id: u for u in db.query(User).filter(User.id.in_(inviter_ids)).all()
    }

    # One grouped count rather than a query per invitee.
    analysis_counts = dict(
        db.query(CV.user_id, func.count(CV.id))
        .filter(CV.user_id.in_([u.id for u in invitees]))
        .group_by(CV.user_id)
        .all()
    )

    grouped: dict[int, list[User]] = defaultdict(list)
    for u in invitees:
        grouped[u.referred_by_id].append(u)

    groups = []
    total_rewarded = 0
    for inviter_id, members in grouped.items():
        inviter = inviters.get(inviter_id)
        if inviter is None:
            # referred_by_id is ON DELETE SET NULL, so this should not happen -
            # but a deleted inviter must not take the whole page down.
            continue

        rewarded = sum(1 for m in members if m.referral_rewarded_at is not None)
        total_rewarded += rewarded

        groups.append(AdminReferralGroup(
            inviter_id=inviter.id,
            inviter_name=inviter.full_name,
            inviter_email=inviter.email,
            invited=len(members),
            rewarded=rewarded,
            credits_earned=rewarded * settings.CREDIT_REFERRAL,
            invitees=[
                AdminReferralInvitee(
                    id=m.id,
                    full_name=m.full_name,
                    email=m.email,
                    joined_at=m.created_at,
                    rewarded_at=m.referral_rewarded_at,
                    analyses=analysis_counts.get(m.id, 0),
                )
                for m in members
            ],
        ))

    groups.sort(key=lambda g: (g.invited, g.rewarded), reverse=True)

    return AdminReferralsResponse(
        groups=groups,
        total_rewarded=total_rewarded,
        total_credits_paid=total_rewarded * settings.CREDIT_REFERRAL,
    )


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
    status: str | None = Query(
        None,
        description="pending | processing | completed | failed | failed_no_text, "
                    "or 'in_flight' for anything not finished",
    ),
    q: str | None = Query(None, description="Match against user name, email or filename"),
    db: Session = Depends(get_db)
):
    """Paginated list of every upload attempt and its outcome.

    Driven by CV rather than AnalysisResult so failed uploads appear too: an
    image-only CV never produces an analysis, and those were previously
    invisible here - exactly the rows worth auditing for a wrong rejection.

    Filtering happens here rather than in the browser for the same reason as
    the user list: the page only ever held the newest hundred rows, so "show me
    the failures" could not see past them.
    """
    query = db.query(CV).order_by(CV.uploaded_at.desc(), CV.id.desc())

    if status == "in_flight":
        query = query.filter(CV.status.in_(("pending", "processing")))
    elif status:
        query = query.filter(CV.status == status)

    if q:
        pattern = f"%{q.strip()}%"
        query = query.outerjoin(User, CV.user_id == User.id).filter(
            or_(
                CV.original_filename.ilike(pattern),
                User.full_name.ilike(pattern),
                User.email.ilike(pattern),
            )
        )

    total = query.count()
    cvs = query.offset(skip).limit(limit).all()

    items = []
    for cv in cvs:
        analysis = cv.analysis_result

        role = "Unknown"
        if analysis and analysis.career_recommendations:
            role = analysis.career_recommendations[0].role_profile.title
        elif cv.target_domain:
            role = cv.target_domain

        # Anonymous /try uploads have an ownerless CV (cv.owner is None).
        has_owner = bool(cv.owner)
        items.append(
            AdminAnalysisListItem(
                id=analysis.id if analysis else None,
                cv_id=cv.id,
                cv_hash=encode_id(cv.id),
                user_email=cv.owner.email if has_owner else "Anonymous",
                user_name=cv.owner.full_name if has_owner else "Anonymous",
                cv_filename=cv.original_filename,
                role_profile=role,
                score=analysis.overall_score if analysis else None,
                status=cv.status,
                created_at=cv.uploaded_at,
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
