"""
Keyword Scorer — TF-based keyword matching against role profiles.
Compares CV text against expected keywords from each role profile
and produces a keyword match score.
"""

import logging
import re

from app.analysis.base_analyzer import BaseAnalyzer, AnalysisContext

logger = logging.getLogger("cvision.analysis.keyword_scorer")


class KeywordScorer(BaseAnalyzer):
    """Scores CV text based on keyword overlap with role profiles."""

    def __init__(self, role_profiles: list[dict]):
        """
        Args:
            role_profiles: List of role profile dicts with
                           'title', 'expected_keywords', 'expected_skills'.
        """
        self._role_profiles = role_profiles

    @property
    def name(self) -> str:
        return "Keyword Scorer"

    def analyze(self, context: AnalysisContext) -> None:
        text_lower = context.text_lower

        if not self._role_profiles:
            context.keyword_score = 0.0
            logger.warning("No role profiles available for keyword scoring")
            return

        # Collect all unique keywords from all role profiles
        all_keywords: set[str] = set()
        for profile in self._role_profiles:
            keywords = profile.get("expected_keywords", [])
            if isinstance(keywords, list):
                all_keywords.update(k.lower() for k in keywords)

        if not all_keywords:
            context.keyword_score = 0.0
            return

        # Count keyword matches
        matched_keywords: list[str] = []
        for keyword in all_keywords:
            escaped = re.escape(keyword)
            if re.search(rf"\b{escaped}\b", text_lower):
                matched_keywords.append(keyword)

        # Score: percentage of all keywords found in CV
        match_ratio = len(matched_keywords) / len(all_keywords)
        context.keyword_score = round(min(match_ratio * 100 * 2, 100.0), 1)

        # Store per-profile keyword matches for recommendations
        for profile in self._role_profiles:
            profile_keywords = profile.get("expected_keywords", [])
            if not isinstance(profile_keywords, list):
                continue
            profile_matches = []
            for kw in profile_keywords:
                escaped = re.escape(kw.lower())
                if re.search(rf"\b{escaped}\b", text_lower):
                    profile_matches.append(kw)
            context.keyword_matches[profile["title"]] = profile_matches

        logger.info(
            f"Keyword score: {context.keyword_score}% — "
            f"matched {len(matched_keywords)}/{len(all_keywords)} keywords"
        )
