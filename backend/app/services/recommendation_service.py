"""
Recommendation Service — business logic for generating and persisting recommendations.
"""

import logging

from sqlalchemy.orm import Session

from app.models.analysis import AnalysisResult
from app.models.career_recommendation import CareerRecommendation
from app.models.role_profile import RoleProfile
from app.recommendation.recommender import CareerRecommender

logger = logging.getLogger("cvision.services.recommendation")


class RecommendationService:
    """Handles career recommendation generation and retrieval."""

    @staticmethod
    def generate_recommendations(
        analysis: AnalysisResult,
        keyword_matches: dict[str, list[str]],
        db: Session,
    ) -> list[CareerRecommendation]:
        """
        Generate recommendations for a freshly completed analysis and save them.

        Args:
            analysis: The AnalysisResult record (must have extracted_skills populated).
            keyword_matches: The keyword matches dict from AnalysisContext.
            db: Database session.

        Returns:
            List of generated CareerRecommendation instances.
        """
        # Load role profiles
        profiles = db.query(RoleProfile).all()
        profiles_data = [
            {
                "id": p.id,
                "title": p.title,
                "expected_keywords": p.expected_keywords or [],
                "expected_skills": p.expected_skills or [],
            }
            for p in profiles
        ]

        # Extract names of skills from the analysis relationships
        extracted_skills = [es.skill.name for es in analysis.extracted_skills]

        # Run recommender engine
        recommender = CareerRecommender(
            role_profiles=profiles_data,
            extracted_skills=extracted_skills,
            keyword_matches=keyword_matches,
        )

        results = recommender.get_recommendations(top_n=3)

        recommendations = []
        for result in results:
            rec = CareerRecommendation(
                analysis_id=analysis.id,
                role_profile_id=result["role_id"],
                match_score=result["score"],
                explanation=result["explanation"],
            )
            db.add(rec)
            recommendations.append(rec)

        db.flush()
        logger.info(
            f"Generated {len(recommendations)} career recommendations "
            f"for analysis {analysis.id}"
        )

        return recommendations

    @staticmethod
    def get_recommendations_for_analysis(
        analysis_id: int, db: Session
    ) -> list[CareerRecommendation]:
        """Retrieve recommendations for an analysis."""
        return (
            db.query(CareerRecommendation)
            .filter(CareerRecommendation.analysis_id == analysis_id)
            .order_by(CareerRecommendation.match_score.desc())
            .all()
        )
