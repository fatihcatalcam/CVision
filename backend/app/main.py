"""
CVision Backend — FastAPI Application Entry Point

Registers all routers, configures CORS, and provides:
- /health endpoint for liveness checks
- /docs for Swagger UI (auto-generated)
- /redoc for ReDoc documentation
- Startup event to seed initial data
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, SessionLocal, Base

# Import all models so Base.metadata knows about them
from app.models import (  # noqa: F401
    User, CV, AnalysisResult, Suggestion,
    Skill, ExtractedSkill, RoleProfile,
    CareerRecommendation, AdminLog,
)

# Import routers
from app.routers import auth, cv, analysis, recommendations, dashboard, admin

# Import seed data
from app.seed.skills_data import SKILLS_DATA
from app.seed.role_profiles_data import ROLE_PROFILES_DATA

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("cvision")


def seed_skills(db: Session) -> None:
    """Populate the skills table if empty."""
    existing_count = db.query(Skill).count()
    if existing_count > 0:
        logger.info(f"Skills table already has {existing_count} entries, skipping seed.")
        return

    for skill_data in SKILLS_DATA:
        skill = Skill(name=skill_data["name"], category=skill_data["category"])
        db.add(skill)

    db.commit()
    logger.info(f"Seeded {len(SKILLS_DATA)} skills into the database.")


def seed_role_profiles(db: Session) -> None:
    """Populate the role_profiles table if empty."""
    existing_count = db.query(RoleProfile).count()
    if existing_count > 0:
        logger.info(f"Role profiles table already has {existing_count} entries, skipping seed.")
        return

    for profile_data in ROLE_PROFILES_DATA:
        profile = RoleProfile(
            title=profile_data["title"],
            description=profile_data["description"],
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
    - On startup: Create tables (for dev) and seed data.
    - On shutdown: Clean up resources.
    """
    logger.info("Starting CVision backend...")

    # Create all tables (safe to call if tables already exist)
    # In production, rely on Alembic migrations instead.
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ensured.")

    # Seed initial data
    db = SessionLocal()
    try:
        seed_skills(db)
        seed_role_profiles(db)
    finally:
        db.close()

    # Ensure upload directory exists
    settings.upload_path
    logger.info(f"Upload directory ready at: {settings.UPLOAD_DIR}")

    yield  # Application runs here

    logger.info("Shutting down CVision backend...")


# ---- Create FastAPI App ----

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

# ---- CORS Middleware ----
# Allow frontend dev server (Vite default port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # Alternative React port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
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


# ---- Health Check ----
@app.get("/health", tags=["System"])
def health_check():
    """Simple liveness check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0",
    }
