"""
Recommender logic - calculates career match scores based on CV analysis.
Matches extracted skills and keywords against role profiles.

Anti-noise (2026-07): generic soft skills carry half weight, the skill
denominator reflects the real expected list, and matches below the display
threshold are never returned. Before this, a cinema graduate with zero
recognized skills was shown "Mobile App Developer" as a career match off a
single stray 'app' keyword.
"""

import logging

from app.seed.skills_data import SKILLS_DATA

logger = logging.getLogger("cvision.recommendation.recommender")

# Matches below this score are noise, not career advice - never display them.
MIN_DISPLAY_SCORE = 30.0

# Generic transferable skills (soft_skill category in the seed data). They
# appear on almost every CV, so they count at half weight when matching a
# role - "Teamwork" must not equal "Swift".
_SOFT_SKILLS = {
    s["name"].lower() for s in SKILLS_DATA if s["category"] == "soft_skill"
}
_SOFT_WEIGHT = 0.5
# Weighted denominator cap: expecting more than this much skill mass no
# longer lowers a candidate's ratio (keeps long expected lists realistic).
_SKILL_DENOMINATOR_CAP = 8.0

# Office tooling that says nothing about which profession a CV belongs to.
# Distinct from _SOFT_SKILLS: these are hard, nameable tools, but they turn up
# on a lawyer's CV as readily as an engineer's, so they are not evidence *for*
# any particular role.
_GENERIC_SKILLS = {
    "excel", "git", "github", "gitlab", "jira", "confluence", "slack",
    "vs code", "intellij", "data analysis",
}

# A role must be corroborated by at least this many discriminating skills from
# the CV. One is a coincidence - "AutoCAD" alone does not make someone a
# structural engineer.
_MIN_DISCRIMINATING_EVIDENCE = 2


def _skill_weight(name: str) -> float:
    return _SOFT_WEIGHT if name.lower() in _SOFT_SKILLS else 1.0


def _is_discriminating(name: str) -> bool:
    """True if this skill points at a specific profession.

    Soft skills and ubiquitous office tools do not: a CV listing "Excel,
    Communication, Leadership" carries no occupational signal, yet those
    fillers used to pile up into a 46.7% "Human Resources Specialist" match.
    """
    lowered = name.lower()
    return lowered not in _SOFT_SKILLS and lowered not in _GENERIC_SKILLS


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

            # 1. Skill Match Score (weight: 60%) - weighted by skill type:
            # hard skills full weight, generic soft skills half, so an
            # unrelated CV can't ride "Teamwork, Communication" into a match.
            expected_skills = profile.get("expected_skills", [])
            expected_skills_lower = [s.lower() for s in expected_skills]

            if expected_skills_lower:
                matched_skills = [
                    s for s in expected_skills_lower if s in self._extracted_skills
                ]
                matched_weight = sum(_skill_weight(s) for s in matched_skills)
                expected_weight = min(
                    sum(_skill_weight(s) for s in expected_skills_lower),
                    _SKILL_DENOMINATOR_CAP,
                )
                skill_score = min((matched_weight / expected_weight) * 100.0, 100.0)
            else:
                skill_score = 0.0
                matched_skills = []

            # 2. Keyword Match Score (weight: 40%)
            # This uses the count from the KeywordScorer during analysis
            expected_keywords = profile.get("expected_keywords", [])
            matched_keywords = self._keyword_matches.get(title, [])

            if expected_keywords:
                # Cap the expected denominator to 10 keywords realistically
                required_keywords_count = min(len(expected_keywords), 10)
                keyword_score = min((len(matched_keywords) / required_keywords_count) * 100.0, 100.0)
            else:
                keyword_score = 0.0

            # Combined Score
            match_score = (skill_score * 0.6) + (keyword_score * 0.4)
            match_score = round(match_score, 1)

            # Calculate Actual Missing Skills
            missing_skills = [
                s for s in expected_skills if s.lower() not in self._extracted_skills
            ]

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
                    f"skills in {', '.join(missing_skills[:3])}."
                )
            else:
                missing_str = ', '.join(missing_skills[:4]) if missing_skills else 'various domain-specific skills'
                explanation = (
                    f"Low match ({match_score}%). This role requires a different skill set. "
                    f"Key missing focus areas include {missing_str}."
                )

            # Evidence gate: the CV must corroborate this role with real
            # discriminating skills before we are willing to name it. Without
            # this, office filler (Excel + Communication + Leadership) sums to
            # a display-range score against roles whose expected_skills are
            # themselves mostly filler.
            evidence = [s for s in matched_skills if _is_discriminating(s)]
            if len(evidence) < _MIN_DISCRIMINATING_EVIDENCE:
                logger.debug(
                    f"Role '{title}' dropped: {len(evidence)} discriminating "
                    f"skill(s), need {_MIN_DISCRIMINATING_EVIDENCE} "
                    f"(score would have been {match_score}%)"
                )
                continue

            results.append({
                "role_id": role_id,
                "score": match_score,
                "explanation": explanation.strip()
            })

        # Sort by score descending; never surface noise-level matches.
        results.sort(key=lambda x: x["score"], reverse=True)
        results = [r for r in results if r["score"] >= MIN_DISPLAY_SCORE]
        return results[:top_n]
