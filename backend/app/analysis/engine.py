"""
Analysis Engine - orchestrates all analyzers into a sequential pipeline.
Runs: SectionDetector → SkillExtractor → ATSChecker → KeywordScorer
      → ExperienceEvaluator → ScoreCalculator → SuggestionGenerator
"""

import logging
from typing import Any

from app.analysis.base_analyzer import AnalysisContext, BaseAnalyzer
from app.analysis.section_detector import SectionDetector
from app.analysis.skill_extractor import SkillExtractor
from app.analysis.ats_checker import ATSChecker
from app.analysis.keyword_scorer import KeywordScorer
from app.analysis.experience_evaluator import ExperienceEvaluator
from app.analysis.score_calculator import ScoreCalculator
from app.analysis.suggestion_generator import SuggestionGenerator

logger = logging.getLogger("cvision.analysis.engine")


class AnalysisEngine:
    """
    Orchestrates the full CV analysis pipeline.
    Each analyzer runs in sequence and updates the shared AnalysisContext.
    """

    def __init__(
        self,
        skills_list: list[dict[str, Any]],
        role_profiles: list[dict],
        target_domain: str | None = None,
    ):
        """
        Args:
            skills_list: Skills from the database (id, name, category).
            role_profiles: Role profiles from the database.
            target_domain: The CV's target domain; steers suggestion wording
                (tech examples only for tech domains).
        """
        self._analyzers: list[BaseAnalyzer] = [
            SectionDetector(),
            SkillExtractor(skills_list),
            ATSChecker(),
            KeywordScorer(role_profiles),
            ExperienceEvaluator(),
            ScoreCalculator(role_profiles),
            SuggestionGenerator(target_domain),
        ]

    def run(self, extracted_text: str, layout_xray: dict | None = None) -> AnalysisContext:
        """
        Run the full analysis pipeline on extracted CV text.

        Args:
            extracted_text: The raw text extracted from the CV file.
            layout_xray: Optional ATS X-Ray output (see app/analysis/layout_xray.py).
                When available, its findings feed the layout ATS checks; when
                None/unavailable, those checks stay out of the score entirely.

        Returns:
            AnalysisContext with all results populated.
        """
        logger.info("Starting analysis pipeline...")

        context = AnalysisContext(extracted_text=extracted_text)
        if layout_xray and layout_xray.get("available"):
            context.layout_findings = layout_xray.get("findings", [])

        for analyzer in self._analyzers:
            logger.info(f"Running: {analyzer.name}")
            try:
                analyzer.analyze(context)
            except Exception as e:
                logger.error(
                    f"Analyzer '{analyzer.name}' failed: {e}", exc_info=True
                )
                # Continue with other analyzers - don't let one failure
                # stop the entire pipeline
                continue

        logger.info(
            f"Analysis pipeline complete. Overall score: {context.overall_score}%"
        )

        return context
