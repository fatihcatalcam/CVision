"""
CVision Backend - FastAPI Application Entry Point

Registers all routers, configures CORS, and provides:
- /health endpoint for liveness checks
- /docs for Swagger UI (auto-generated)
- /redoc for ReDoc documentation
- Startup event to seed initial data
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.dependencies import get_db
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.limiter import limiter
from app.database import engine, SessionLocal
from app.db_migrations import run_migrations
from app.services.job_recovery import recover_stuck_jobs
from app.observability import init_sentry

# Import all models so Base.metadata knows about them
from app.models import (  # noqa: F401
    User, CV, AnalysisResult, Suggestion,
    Skill, ExtractedSkill, RoleProfile,
    CareerRecommendation, AdminLog,
    JobDescription, CVJDMatch, CoverLetter,
)

# Import routers
from app.routers import auth, cv, analysis, recommendations, dashboard, admin, payment, jd, match, cover_letter, public

# Import seed data
from app.seed.skills_data import SKILLS_DATA
from app.seed.role_profiles_data import ROLE_PROFILES_DATA

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("cvision")

# Initialize error tracking early (no-op unless SENTRY_DSN is set).
init_sentry()


def seed_skills(db: Session) -> None:
    """Populate the skills table, adding any new skills that don't exist yet."""
    existing_names = {s.name for s in db.query(Skill).all()}
    added = 0

    for skill_data in SKILLS_DATA:
        if skill_data["name"] not in existing_names:
            skill = Skill(name=skill_data["name"], category=skill_data["category"])
            db.add(skill)
            added += 1

    if added > 0:
        db.commit()
        logger.info(f"Added {added} new skills (total in seed: {len(SKILLS_DATA)}).")
    else:
        logger.info(f"Skills table already up to date ({len(existing_names)} entries).")


def seed_role_profiles(db: Session) -> None:
    """Populate the role_profiles table. Re-seeds if domain info is missing."""
    existing = db.query(RoleProfile).all()

    # Check if any existing profile is missing domain (i.e. old data)
    needs_reseed = any(not getattr(p, "domain", None) or p.domain == "Software Engineering"
                       for p in existing) and len(existing) < len(ROLE_PROFILES_DATA)

    if existing and not needs_reseed:
        logger.info(f"Role profiles table already has {len(existing)} entries, skipping seed.")
        return

    if existing and needs_reseed:
        logger.info("Re-seeding role profiles with domain data...")
        # Delete dependent career_recommendations first to avoid FK constraint
        from app.models.career_recommendation import CareerRecommendation
        profile_ids = [p.id for p in existing]
        db.query(CareerRecommendation).filter(
            CareerRecommendation.role_profile_id.in_(profile_ids)
        ).delete(synchronize_session="fetch")
        for p in existing:
            db.delete(p)
        db.flush()

    for profile_data in ROLE_PROFILES_DATA:
        profile = RoleProfile(
            title=profile_data["title"],
            description=profile_data["description"],
            domain=profile_data.get("domain", "Software Engineering"),
            expected_keywords=profile_data["expected_keywords"],
            expected_skills=profile_data["expected_skills"],
        )
        db.add(profile)

    db.commit()
    logger.info(f"Seeded {len(ROLE_PROFILES_DATA)} role profiles into the database.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    - On startup: Run Alembic migrations, seed data.
    - On shutdown: Clean up resources.
    """
    logger.info("Starting CVision backend...")

    # Bring the schema to head via Alembic (single source of truth). Handles
    # fresh DBs, legacy pre-Alembic prod (auto-baseline), and migrated DBs.
    action = run_migrations(engine)
    logger.info(f"Migrations applied ({action}).")

    # Seed initial data
    db = SessionLocal()
    try:
        seed_skills(db)
        seed_role_profiles(db)
    finally:
        db.close()

    # Recover CV jobs left stuck by a previous restart/crash.
    sweep_db = SessionLocal()
    try:
        recover_stuck_jobs(
            sweep_db,
            timeout_minutes=settings.STUCK_JOB_TIMEOUT_MINUTES,
            max_retries=settings.MAX_JOB_RETRIES,
        )
    finally:
        sweep_db.close()

    # Purge unclaimed anonymous CVs older than 7 days (storage hygiene).
    cleanup_db = SessionLocal()
    try:
        from app.services.anonymous_service import AnonymousService
        AnonymousService.cleanup_unclaimed(cleanup_db, older_than_days=7)
    except Exception:
        logger.exception("Anonymous cleanup sweep failed")
    finally:
        cleanup_db.close()

    # Ensure upload directory exists
    settings.upload_path
    logger.info(f"Upload directory ready at: {settings.UPLOAD_DIR}")

    yield  # Application runs here

    logger.info("Shutting down CVision backend...")


app = FastAPI(
    title="CVision API",
    description=(
        "AI-Powered CV Analyzer and Career Recommendation Platform. "
        "Upload your CV, get scored, receive improvement suggestions, "
        "and discover matching career roles."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---- Rate Limiting (slowapi) ----
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---- Advanced Error Handling System ----
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # Ensure all HTTP exceptions return standard JSON format
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Exception",
            "message": str(exc.detail),
            "status": "failed"
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Standardize data validation failures
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "message": "Invalid input data format.",
            "status": "failed",
            "details": exc.errors()
        }
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    # Used extensively in services for domain logic validations
    return JSONResponse(
        status_code=400,
        content={
            "error": "Bad Request",
            "message": str(exc),
            "status": "failed"
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Fallback to prevent app crashes and hide internal errors
    logger.exception(f"Unhandled server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected server error occurred. Please try again later.",
            "status": "failed"
        }
    )


# ---- CORS Middleware ----
# Allow frontend dev server and production domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Register Routers ----
app.include_router(auth.router)
app.include_router(cv.router)
app.include_router(analysis.router)
app.include_router(recommendations.router)
app.include_router(dashboard.router)
app.include_router(admin.router)
app.include_router(payment.router)
app.include_router(jd.router)
app.include_router(match.router)
app.include_router(cover_letter.router)
app.include_router(public.router)


# ---- Health Check ----
@app.api_route("/health", methods=["GET", "HEAD"], tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """Readiness check: verifies the app can reach the database."""
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        logger.exception("Health check DB probe failed")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "app": settings.APP_NAME,
                "version": "1.0.0",
                "database": "down",
            },
        )
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "database": "up",
    }
