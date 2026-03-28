"""
Analysis Engine — orchestrates all analyzers into a sequential pipeline.
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
    ):
        """
        Args:
            skills_list: Skills from the database (id, name, category).
            role_profiles: Role profiles from the database.
        """
        self._analyzers: list[BaseAnalyzer] = [
            SectionDetector(),
            SkillExtractor(skills_list),
            ATSChecker(),
            KeywordScorer(role_profiles),
            ExperienceEvaluator(),
            ScoreCalculator(),
            SuggestionGenerator(),
        ]

    def run(self, extracted_text: str) -> AnalysisContext:
        """
        Run the full analysis pipeline on extracted CV text.

        Args:
            extracted_text: The raw text extracted from the CV file.

        Returns:
            AnalysisContext with all results populated.
        """
        logger.info("Starting analysis pipeline...")

        context = AnalysisContext(extracted_text=extracted_text)

        for analyzer in self._analyzers:
            logger.info(f"Running: {analyzer.name}")
            try:
                analyzer.analyze(context)
            except Exception as e:
                logger.error(
                    f"Analyzer '{analyzer.name}' failed: {e}", exc_info=True
                )
                # Continue with other analyzers — don't let one failure
                # stop the entire pipeline
                continue

        logger.info(
            f"Analysis pipeline complete. Overall score: {context.overall_score}%"
        )

        return context
