"""
Public (no-auth) router for the anonymous /try flow.

Endpoints:
    POST /public/analyze                    - Upload + analyze without an account
    GET  /public/analysis/{token}/status    - Poll analysis status by session token
    GET  /public/analysis/{token}/results   - Gated results by session token
    POST /public/claim                      - (auth) attach an anon CV to the user
"""

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.limiter import limiter
from app.services.cv_service import CVService
from app.services.anonymous_service import AnonymousService
from app.services.analysis_service import AnalysisService
from app.routers.analysis import _build_analysis_response, AnalysisStatusResponse
from app.schemas.analysis import AnalysisResponse
from app.utils.hashids import encode_id

logger = logging.getLogger("cvision.routers.public")

router = APIRouter(prefix="/public", tags=["Public"])

# Anonymous visitors get one free analysis per IP per day.
# TEMP: raised for founder testing — REVERT TO 1 before/after launch.
ANON_DAILY_LIMIT = 1000


def _client_ip(request: Request) -> str:
    """Real client IP behind Render's proxy (first X-Forwarded-For hop)."""
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class ClaimRequest(BaseModel):
    token: str


# slowapi is only a burst guard here (never fires for legit 1/day users); the
# daily business limit lives in the DB check below so it can return a friendly,
# localizable message instead of slowapi's message-less 429.
@router.post("/analyze", summary="Analyze a CV without an account")
@limiter.limit("6/minute")
async def public_analyze(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_domain: str = Form("Other"),
    db: Session = Depends(get_db),
):
    """Anonymous upload → gated analysis. One free run per IP per day (DB-enforced)."""
    ip = _client_ip(request)

    if AnonymousService.count_recent_anon_by_ip(db, ip, hours=24) >= ANON_DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="You've used your free analysis for today. Sign up for unlimited analyses.",
        )

    try:
        cv = await AnonymousService.create_anonymous_cv(file, target_domain, ip, db)
    except ValueError as e:
        # File validation failures surface as 400 via the global ValueError handler.
        raise HTTPException(status_code=400, detail=str(e))

    background_tasks.add_task(CVService.process_analysis_background, cv.id)

    return {"token": cv.session_token, "cv_id": encode_id(cv.id)}


@router.get(
    "/analysis/{token}/status",
    response_model=AnalysisStatusResponse,
    summary="Poll anonymous analysis status",
)
def public_status(token: str, db: Session = Depends(get_db)):
    cv = AnonymousService.get_by_token(db, token)
    if cv is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return AnalysisStatusResponse(cv_id=cv.id, status=cv.status)


@router.get(
    "/analysis/{token}/results",
    response_model=AnalysisResponse,
    summary="Get gated anonymous analysis results",
)
def public_results(token: str, db: Session = Depends(get_db)):
    cv = AnonymousService.get_by_token(db, token)
    if cv is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    analysis = AnalysisService.get_analysis(cv.id, db)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not ready yet.")

    return _build_analysis_response(
        analysis, current_user=None, is_first_analysis=False, force_locked=True
    )


@router.post("/claim", summary="Claim an anonymous analysis after signing up")
def public_claim(
    body: ClaimRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cv = AnonymousService.claim(db, token=body.token, user=current_user)
    if cv is None:
        raise HTTPException(status_code=404, detail="No claimable analysis for this token.")
    return {"cv_id": encode_id(cv.id)}
