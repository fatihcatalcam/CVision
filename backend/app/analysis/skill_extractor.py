"""
Skill Extractor — dictionary-based skill lookup using word-boundary matching.
Matches CV text against the skills database using \b regex for precision.
Prevents false positives like "Pythonic" matching "Python".
"""

import logging
import re

from app.analysis.base_analyzer import BaseAnalyzer, AnalysisContext

logger = logging.getLogger("cvision.analysis.skill_extractor")


class SkillExtractor(BaseAnalyzer):
    """Extracts skills from CV text using dictionary-based word-boundary matching."""

    def __init__(self, skills_list: list[dict[str, str]]):
        """
        Args:
            skills_list: List of dicts with 'name', 'category', and 'id' keys
                         from the Skills database table.
        """
        self._skills = skills_list
        # Pre-compile regex patterns for each skill
        self._patterns: list[tuple[dict, re.Pattern]] = []
        for skill in skills_list:
            # Escape special regex chars in skill name, then add word boundaries
            escaped = re.escape(skill["name"])
            pattern = re.compile(rf"\b{escaped}\b", re.IGNORECASE)
            self._patterns.append((skill, pattern))

    @property
    def name(self) -> str:
        return "Skill Extractor"

    def analyze(self, context: AnalysisContext) -> None:
        text = context.extracted_text
        extracted = []

        for skill_info, pattern in self._patterns:
            matches = pattern.findall(text)
            if matches:
                # Confidence based on number of mentions (capped at 1.0)
                # 1 mention = 0.7, 2 = 0.85, 3+ = 1.0
                count = len(matches)
                if count >= 3:
                    confidence = 1.0
                elif count == 2:
                    confidence = 0.85
                else:
                    confidence = 0.7

                extracted.append({
                    "skill_id": skill_info["id"],
                    "skill_name": skill_info["name"],
                    "skill_category": skill_info["category"],
                    "confidence_score": confidence,
                    "mention_count": count,
                })

        context.extracted_skills = extracted

        logger.info(
            f"Extracted {len(extracted)} skills from CV text "
            f"(searched {len(self._skills)} skill patterns)"
        )

        # Log by category
        categories: dict[str, int] = {}
        for skill in extracted:
            cat = skill["skill_category"]
            categories[cat] = categories.get(cat, 0) + 1
        for cat, count in sorted(categories.items()):
            logger.debug(f"  {cat}: {count} skills")
