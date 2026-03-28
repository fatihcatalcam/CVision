"""
Recommender logic — calculates career match scores based on CV analysis.
Matches extracted skills and keywords against role profiles.
"""

import logging

logger = logging.getLogger("cvision.recommendation.recommender")


class CareerRecommender:
    """Calculates match scores between a CV analysis and role profiles."""

    def __init__(
        self,
        role_profiles: list[dict],
        extracted_skills: list[str],
        keyword_matches: dict[str, list[str]],
    ):
        """
        Args:
            role_profiles: List of role profiles from the DB.
            extracted_skills: List of skill names extracted from the CV.
            keyword_matches: Dict mapping role title -> list of matched keywords
                             (produced by the KeywordScorer).
        """
        self._role_profiles = role_profiles
        self._extracted_skills = [s.lower() for s in extracted_skills]
        self._keyword_matches = keyword_matches

    def get_recommendations(self, top_n: int = 3) -> list[dict]:
        """
        Calculate and return the top N career recommendations.

        Returns:
            List of dicts: {"role_id": int, "score": float, "explanation": str}
        """
        results = []

        for profile in self._role_profiles:
            role_id = profile["id"]
            title = profile["title"]

            # 1. Skill Match Score (weight: 60%)
            expected_skills = profile.get("expected_skills", [])
            expected_skills_lower = [s.lower() for s in expected_skills]

            if expected_skills_lower:
                matched_skills = [
                    s for s in expected_skills_lower if s in self._extracted_skills
                ]
                skill_score = len(matched_skills) / len(expected_skills_lower) * 100
            else:
                skill_score = 0.0
                matched_skills = []

            # 2. Keyword Match Score (weight: 40%)
            # This uses the count from the KeywordScorer during analysis
            expected_keywords = profile.get("expected_keywords", [])
            matched_keywords = self._keyword_matches.get(title, [])

            if expected_keywords:
                keyword_score = len(matched_keywords) / len(expected_keywords) * 100
            else:
                keyword_score = 0.0

            # Combined Score
            match_score = (skill_score * 0.6) + (keyword_score * 0.4)
            match_score = round(match_score, 1)

            # Generate Explanation
            if match_score >= 70:
                explanation = (
                    f"Strong match ({match_score}%). Your technical profile aligns well "
                    f"with this role. You possess key skills like "
                    f"{', '.join(matched_skills[:3])}." if matched_skills else ""
                )
            elif match_score >= 40:
                explanation = (
                    f"Moderate match ({match_score}%). You have some foundational "
                    f"skills for this role. To improve your chances, consider developing "
                    f"skills in {', '.join([s for s in expected_skills if s.lower() not in self._extracted_skills][:3])}."
                )
            else:
                explanation = (
                    f"Low match ({match_score}%). This role requires a different skill set. "
                    f"Key missing skills include {', '.join(expected_skills[:3])}."
                )

            results.append({
                "role_id": role_id,
                "score": match_score,
                "explanation": explanation.strip()
            })

        # Sort by score descending and return top_n
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_n]
