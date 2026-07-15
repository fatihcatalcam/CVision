"""
Score Calculator - weighted aggregation of all sub-scores into an overall score.
Weights: completeness (25%) + skills (25%) + ATS (20%) + keywords (15%) + experience (15%)

Anti-gaming (2026-07): the skills sub-score is RELEVANCE-weighted against the
target role's expected skills, not a raw count. A CV that stuffs its skills
section with off-target terms (SAP, Kaizen, Excel while targeting Software
Engineering) can no longer saturate the score the way a focused candidate does.
"""

import logging

from app.analysis.base_analyzer import BaseAnalyzer, AnalysisContext

logger = logging.getLogger("cvision.analysis.score_calculator")

# Score weights - must sum to 1.0
SCORE_WEIGHTS = {
    "completeness": 0.25,
    "skills": 0.25,
    "ats": 0.20,
    "keywords": 0.15,
    "experience": 0.15,
}

# Off-target ("other") skills contribute a small, capped bonus each — enough to
# acknowledge breadth (a backend dev who also knows Figma) without letting
# irrelevant stuffing move the needle. Extra relevant skills beyond the base
# curve's ceiling get the same small treatment.
_OTHER_SKILL_BONUS = 1.0
_OTHER_SKILL_BONUS_CAP = 8.0
_EXTRA_RELEVANT_BONUS_CAP = 8.0


class ScoreCalculator(BaseAnalyzer):
    """Calculates the overall CV score from weighted sub-scores."""

    def __init__(self, role_profiles: list[dict] | None = None):
        """
        Args:
            role_profiles: The target role profiles (already filtered to the
                CV's target domain by the service; ALL profiles when the domain
                is "Other"/unset). Their `expected_skills` define which extracted
                skills count as relevant. If none are supplied, the skills score
                degrades gracefully to a relevance-agnostic count.
        """
        relevant: set[str] = set()
        for profile in role_profiles or []:
            for skill in profile.get("expected_skills", []) or []:
                if isinstance(skill, str):
                    relevant.add(skill.lower())
        self._relevant_skills = relevant

    @property
    def name(self) -> str:
        return "Score Calculator"

    def _skills_score(self, relevant_count: int, other_count: int) -> float:
        """Relevance-weighted skills score.

        The base is driven by how many *relevant* skills the CV shows, on a
        curve that lets a focused mid/senior (~10 relevant) approach the ceiling.
        Off-target skills — and relevant skills beyond the curve — add only a
        small, capped bonus, so breadth helps a little but stuffing cannot
        saturate the score.
        """
        r = relevant_count
        if r == 0:
            base = 0.0
        elif r <= 3:
            base = (r / 3) * 35.0            # 3 relevant -> 35
        elif r <= 6:
            base = 35.0 + ((r - 3) / 3) * 30.0   # 6 relevant -> 65
        elif r <= 10:
            base = 65.0 + ((r - 6) / 4) * 27.0   # 10 relevant -> 92
        else:
            base = 92.0

        bonus = min(other_count, _OTHER_SKILL_BONUS_CAP) * _OTHER_SKILL_BONUS
        extra_relevant = max(r - 10, 0)
        bonus += min(extra_relevant, _EXTRA_RELEVANT_BONUS_CAP) * _OTHER_SKILL_BONUS

        return round(min(base + bonus, 100.0), 1)

    def analyze(self, context: AnalysisContext) -> None:
        # Split extracted skills into relevant (in the target role's expected
        # skills) vs off-target. With no relevance signal at all (no profiles),
        # fall back to counting everything as relevant so scoring still works.
        if self._relevant_skills:
            relevant_count = sum(
                1 for s in context.extracted_skills
                if s.get("skill_name", "").lower() in self._relevant_skills
            )
            other_count = len(context.extracted_skills) - relevant_count
        else:
            relevant_count = len(context.extracted_skills)
            other_count = 0

        skills_score = self._skills_score(relevant_count, other_count)
        context.skills_score = skills_score

        # Weighted overall score
        overall = (
            context.completeness_score * SCORE_WEIGHTS["completeness"]
            + skills_score * SCORE_WEIGHTS["skills"]
            + context.ats_score * SCORE_WEIGHTS["ats"]
            + context.keyword_score * SCORE_WEIGHTS["keywords"]
            + context.experience_score * SCORE_WEIGHTS["experience"]
        )

        context.overall_score = round(overall, 1)

        # Generate strengths and weaknesses
        self._generate_strengths_weaknesses(context, skills_score)

        # Generate summary
        self._generate_summary(context, skills_score)

        logger.info(
            f"Overall score: {context.overall_score}% "
            f"(completeness={context.completeness_score}%, "
            f"skills={skills_score}%, "
            f"ats={context.ats_score}%, "
            f"keywords={context.keyword_score}%, "
            f"experience={context.experience_score}%)"
        )

    def _generate_strengths_weaknesses(
        self, context: AnalysisContext, skills_score: float
    ) -> None:
        """Identify strengths and weaknesses from the analysis."""
        # Strengths
        if context.completeness_score >= 70:
            context.strengths.append("Well-structured CV with most key sections present")
        if skills_score >= 60:
            count = len(context.extracted_skills)
            context.strengths.append(
                f"Strong technical profile with {count} recognized skills"
            )
        if context.ats_score >= 70:
            context.strengths.append("Good ATS compatibility - most formatting checks passed")
        if context.keyword_score >= 50:
            context.strengths.append("Good keyword coverage for target roles")
        if context.experience_score >= 60:
            years = context.total_years_experience
            context.strengths.append(
                f"Relevant experience demonstrated (~{years:.0f} years)"
            )
        if context.detected_sections.get("projects"):
            context.strengths.append("Projects section included - demonstrates practical experience")

        # Weaknesses
        if context.completeness_score < 50:
            missing = [
                s for s, found in context.detected_sections.items() if not found
            ]
            context.weaknesses.append(
                f"Missing key CV sections: {', '.join(missing[:4])}"
            )
        if skills_score < 40:
            context.weaknesses.append(
                "Few recognized technical skills - consider adding a dedicated skills section"
            )
        if context.ats_score < 50:
            context.weaknesses.append(
                "Low ATS compatibility - review formatting and required sections"
            )
        if context.keyword_score < 30:
            context.weaknesses.append(
                "Low keyword match - tailor your CV with industry-relevant terms"
            )
        if context.experience_score < 40:
            context.weaknesses.append(
                "Limited experience detected - highlight internships, projects, or volunteer work"
            )

    def _generate_summary(
        self, context: AnalysisContext, skills_score: float
    ) -> None:
        """Generate a human-readable summary of the analysis."""
        score = context.overall_score

        if score >= 80:
            grade = "Excellent"
            desc = "This CV is well-prepared and competitive."
        elif score >= 65:
            grade = "Good"
            desc = "This CV covers most essentials with room for improvement."
        elif score >= 50:
            grade = "Fair"
            desc = "This CV needs several improvements to be competitive."
        elif score >= 30:
            grade = "Needs Work"
            desc = "This CV has significant gaps that should be addressed."
        else:
            grade = "Weak"
            desc = "This CV requires major revisions to be effective."

        sections_found = sum(context.detected_sections.values())
        sections_total = len(context.detected_sections)
        skill_count = len(context.extracted_skills)

        context.summary = (
            f"{grade} ({score}/100). {desc} "
            f"Detected {sections_found}/{sections_total} standard sections "
            f"and {skill_count} recognized skills. "
            f"ATS compatibility: {context.ats_score}%."
        )
