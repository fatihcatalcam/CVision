"""
Skill Extractor - dictionary-based skill lookup using word-boundary matching.
Matches CV text against the skills database using \b regex for precision.
Prevents false positives like "Pythonic" matching "Python".
"""

import logging
import re

from app.analysis.base_analyzer import BaseAnalyzer, AnalysisContext

logger = logging.getLogger("cvision.analysis.skill_extractor")


class SkillExtractor(BaseAnalyzer):
    """Extracts skills from CV text using dictionary-based word-boundary matching."""

    def __init__(
        self,
        skills_list: list[dict[str, str]],
        ai_skills: list[str] | None = None,
    ):
        """
        Args:
            skills_list: List of dicts with 'name', 'category', and 'id' keys
                         from the Skills database table.
            ai_skills: Canonical skill names the AI recognised in the CV,
                       whatever language it was written in. Merged with - never
                       replacing - the regex matches: the regex is reliable for
                       proper nouns (Python, AutoCAD) that survive translation,
                       while the AI covers the rest ("iletisim" ->
                       "Communication"). None means AI was unavailable, and the
                       result collapses to the regex-only behaviour.
        """
        self._skills = skills_list
        self._ai_skills = ai_skills or []
        # Pre-compile regex patterns for each skill
        self._patterns: list[tuple[dict, re.Pattern]] = []
        for skill in skills_list:
            # Escape special regex chars in skill name. Plain \b word boundaries
            # break on names with non-word edge chars: \bC\+\+\b can never match
            # "C++, ..." (no boundary between '+' and ' '), and \bC\b falsely
            # matches the 'C' inside "C++". Use custom lookarounds instead:
            # the char before must not be a word char, '+', '#' or '.', and the
            # char after must not be a word char, '+' or '#' (trailing '.' is
            # allowed so "...in C." still matches).
            escaped = re.escape(skill["name"])
            pattern = re.compile(
                rf"(?<![\w+#.]){escaped}(?![\w+#])", re.IGNORECASE
            )
            self._patterns.append((skill, pattern))

    @property
    def name(self) -> str:
        return "Skill Extractor"

    def _merge_ai_skills(self, extracted: list[dict], seen: set[str]) -> int:
        """Fold the AI's canonical skill names into the regex results.

        Only names present in the skills dictionary are accepted, so the AI
        cannot invent a skill; anything it hallucinates is dropped here rather
        than reaching the score. Skills the regex already found are skipped,
        keeping the regex's real mention_count.

        Confidence is fixed at 0.7 - the same value a single regex mention
        earns. The AI asserts the skill is present but gives no count, and
        claiming more certainty than that would inflate the score.
        """
        if not self._ai_skills:
            return 0

        by_name = {s["name"].lower(): s for s in self._skills}
        added = 0

        for raw in self._ai_skills:
            if not isinstance(raw, str):
                continue
            skill_info = by_name.get(raw.strip().lower())
            if skill_info is None:
                logger.debug(f"AI proposed unknown skill {raw!r}; ignored")
                continue
            if skill_info["name"].lower() in seen:
                continue

            extracted.append({
                "skill_id": skill_info["id"],
                "skill_name": skill_info["name"],
                "skill_category": skill_info["category"],
                "confidence_score": 0.7,
                "mention_count": 1,
            })
            seen.add(skill_info["name"].lower())
            added += 1

        return added

    def analyze(self, context: AnalysisContext) -> None:
        text = context.extracted_text
        extracted = []
        seen: set[str] = set()

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
                seen.add(skill_info["name"].lower())

        ai_added = self._merge_ai_skills(extracted, seen)

        context.extracted_skills = extracted

        logger.info(
            f"Extracted {len(extracted)} skills from CV text "
            f"(searched {len(self._skills)} skill patterns, "
            f"{ai_added} added by AI normalization)"
        )

        # Log by category
        categories: dict[str, int] = {}
        for skill in extracted:
            cat = skill["skill_category"]
            categories[cat] = categories.get(cat, 0) + 1
        for cat, count in sorted(categories.items()):
            logger.debug(f"  {cat}: {count} skills")
