"""
Score Calculator — weighted aggregation of all sub-scores into an overall score.
Weights: completeness (25%) + skills (25%) + ATS (20%) + keywords (15%) + experience (15%)
"""

import logging

from app.analysis.base_analyzer import BaseAnalyzer, AnalysisContext

logger = logging.getLogger("cvision.analysis.score_calculator")

# Score weights — must sum to 1.0
SCORE_WEIGHTS = {
    "completeness": 0.25,
    "skills": 0.25,
    "ats": 0.20,
    "keywords": 0.15,
    "experience": 0.15,
}


class ScoreCalculator(BaseAnalyzer):
    """Calculates the overall CV score from weighted sub-scores."""

    @property
    def name(self) -> str:
        return "Score Calculator"

    def analyze(self, context: AnalysisContext) -> None:
        # Calculate skills score from extracted skills
        skill_count = len(context.extracted_skills)
        # Scoring: 0 skills=0, 3=40, 5=60, 8=75, 12+=100
        if skill_count == 0:
            skills_score = 0.0
        elif skill_count <= 3:
            skills_score = 20.0 + (skill_count / 3) * 20.0
        elif skill_count <= 5:
            skills_score = 40.0 + ((skill_count - 3) / 2) * 20.0
        elif skill_count <= 8:
            skills_score = 60.0 + ((skill_count - 5) / 3) * 15.0
        elif skill_count <= 12:
            skills_score = 75.0 + ((skill_count - 8) / 4) * 25.0
        else:
            skills_score = 100.0

        skills_score = round(min(skills_score, 100.0), 1)

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
            context.strengths.append("Good ATS compatibility — most formatting checks passed")
        if context.keyword_score >= 50:
            context.strengths.append("Good keyword coverage for target roles")
        if context.experience_score >= 60:
            years = context.total_years_experience
            context.strengths.append(
                f"Relevant experience demonstrated (~{years:.0f} years)"
            )
        if context.detected_sections.get("projects"):
            context.strengths.append("Projects section included — demonstrates practical experience")

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
                "Few recognized technical skills — consider adding a dedicated skills section"
            )
        if context.ats_score < 50:
            context.weaknesses.append(
                "Low ATS compatibility — review formatting and required sections"
            )
        if context.keyword_score < 30:
            context.weaknesses.append(
                "Low keyword match — tailor your CV with industry-relevant terms"
            )
        if context.experience_score < 40:
            context.weaknesses.append(
                "Limited experience detected — highlight internships, projects, or volunteer work"
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
