"""
Analysis service — business logic for triggering CV analysis
and persisting results to the database.
"""

import logging
from typing import Any

from sqlalchemy.orm import Session

from app.models.cv import CV
from app.models.analysis import AnalysisResult
from app.models.suggestion import Suggestion
from app.models.extracted_skill import ExtractedSkill
from app.models.skill import Skill
from app.models.role_profile import RoleProfile
from app.analysis.engine import AnalysisEngine
from app.analysis.base_analyzer import AnalysisContext
from app.services.recommendation_service import RecommendationService

logger = logging.getLogger("cvision.services.analysis")


class AnalysisService:
    """Handles analysis business logic — triggering, persisting, and retrieving."""

    @staticmethod
    def _load_skills(db: Session) -> list[dict[str, Any]]:
        """Load all skills from the database for the skill extractor."""
        skills = db.query(Skill).all()
        return [
            {"id": s.id, "name": s.name, "category": s.category}
            for s in skills
        ]

    @staticmethod
    def _load_role_profiles(db: Session) -> list[dict]:
        """Load all role profiles from the database for keyword scoring."""
        profiles = db.query(RoleProfile).all()
        return [
            {
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "expected_keywords": p.expected_keywords or [],
                "expected_skills": p.expected_skills or [],
            }
            for p in profiles
        ]

    @staticmethod
    def run_analysis(cv: CV, db: Session) -> AnalysisResult:
        """
        Run the full analysis pipeline on a CV and persist results.

        Args:
            cv: The CV model instance (must have extracted_text).
            db: Database session.

        Returns:
            The created AnalysisResult record.

        Raises:
            ValueError: If the CV has no extracted text or is not in a valid state.
        """
        if not cv.extracted_text:
            raise ValueError(
                f"CV {cv.id} has no extracted text. "
                "Upload and text extraction must complete first."
            )

        if cv.status != "completed":
            raise ValueError(
                f"CV {cv.id} is in '{cv.status}' state. "
                "Only CVs with 'completed' status can be analyzed."
            )

        # Check if analysis already exists
        existing = (
            db.query(AnalysisResult)
            .filter(AnalysisResult.cv_id == cv.id)
            .first()
        )
        if existing:
            # Delete existing analysis to allow re-analysis
            logger.info(f"Deleting existing analysis {existing.id} for CV {cv.id}")
            db.delete(existing)
            db.flush()

        # Load reference data
        skills_list = AnalysisService._load_skills(db)
        role_profiles = AnalysisService._load_role_profiles(db)

        logger.info(
            f"Running analysis for CV {cv.id} "
            f"({len(skills_list)} skills, {len(role_profiles)} role profiles)"
        )

        # Run the analysis engine
        engine = AnalysisEngine(skills_list, role_profiles)
        context: AnalysisContext = engine.run(cv.extracted_text)

        # Persist analysis result
        analysis = AnalysisResult(
            cv_id=cv.id,
            overall_score=context.overall_score,
            ats_score=context.ats_score,
            keyword_score=context.keyword_score,
            completeness_score=context.completeness_score,
            experience_score=context.experience_score,
            summary=context.summary,
            strengths=context.strengths,
            weaknesses=context.weaknesses,
            detected_sections=context.detected_sections,
        )
        db.add(analysis)
        db.flush()  # Get the analysis ID

        # Persist suggestions
        for sug_data in context.suggestions:
            suggestion = Suggestion(
                analysis_id=analysis.id,
                category=sug_data["category"],
                priority=sug_data["priority"],
                message=sug_data["message"],
            )
            db.add(suggestion)

        # Persist extracted skills
        for skill_data in context.extracted_skills:
            extracted_skill = ExtractedSkill(
                analysis_id=analysis.id,
                skill_id=skill_data["skill_id"],
                confidence_score=skill_data["confidence_score"],
            )
            db.add(extracted_skill)
            
        # Optional: Generate and persist career recommendations
        # This ties Phase 6 into Phase 5 naturally.
        RecommendationService.generate_recommendations(
            analysis=analysis,
            keyword_matches=context.keyword_matches,
            db=db
        )

        db.commit()
        db.refresh(analysis)

        logger.info(
            f"Analysis {analysis.id} saved for CV {cv.id}: "
            f"score={analysis.overall_score}%, "
            f"{len(context.suggestions)} suggestions, "
            f"{len(context.extracted_skills)} skills"
        )

        return analysis

    @staticmethod
    def get_analysis(cv_id: int, db: Session) -> AnalysisResult | None:
        """Get the analysis result for a specific CV."""
        return (
            db.query(AnalysisResult)
            .filter(AnalysisResult.cv_id == cv_id)
            .first()
        )
