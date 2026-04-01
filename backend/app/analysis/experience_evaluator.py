"""
Experience Evaluator — detects years of experience using regex heuristics.
Looks for common patterns like "3 years of experience", "2019-2023",
date ranges, and internship/job duration mentions.
"""

import logging
import re
from datetime import datetime

from app.analysis.base_analyzer import BaseAnalyzer, AnalysisContext

logger = logging.getLogger("cvision.analysis.experience_evaluator")

# Pattern: "X years of experience" or "X+ years"
YEARS_PATTERN = re.compile(
    r"(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)?",
    re.IGNORECASE,
)

# Pattern: date ranges like "2019 - 2023", "Jan 2020 – Present"
DATE_RANGE_PATTERN = re.compile(
    r"(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?"
    r"(20\d{2}|19\d{2})"
    r"\s*[-–—~to]+\s*"
    r"(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?"
    r"(20\d{2}|19\d{2}|[Pp]resent|[Cc]urrent)",
    re.IGNORECASE,
)

# Pattern: "internship", "intern", "working student"
INTERNSHIP_PATTERN = re.compile(
    r"\b(?:internship|intern|working\s+student|co-?op|apprentice)\b",
    re.IGNORECASE,
)

# Pattern: "senior", "lead", "manager", "director"
SENIORITY_PATTERN = re.compile(
    r"\b(?:senior|lead|principal|staff|manager|director|head\s+of|vp)\b",
    re.IGNORECASE,
)


class ExperienceEvaluator(BaseAnalyzer):
    """Evaluates work experience from CV text using regex heuristics."""

    @property
    def name(self) -> str:
        return "Experience Evaluator"

    def analyze(self, context: AnalysisContext) -> None:
        text = context.extracted_text
        text_lower = context.text_lower

        total_years = 0.0
        entries: list[str] = []

        # Method 1: Explicit "X years of experience" mentions
        explicit_matches = YEARS_PATTERN.findall(text)
        if explicit_matches:
            max_years = max(int(y) for y in explicit_matches)
            total_years = max(total_years, float(max_years))
            entries.append(f"Explicit mention: {max_years} years")

        # Method 2: Date ranges — calculate total span
        date_ranges = DATE_RANGE_PATTERN.findall(text)
        current_year = datetime.now().year
        date_years = 0.0

        for start_str, end_str in date_ranges:
            try:
                start_year = int(start_str)
                if end_str.lower() in ("present", "current"):
                    end_year = current_year
                else:
                    end_year = int(end_str)

                span = end_year - start_year
                if 0 < span <= 50:  # Sanity check
                    date_years += span
                    entries.append(f"Date range: {start_year}-{end_str} ({span} yrs)")
            except (ValueError, TypeError):
                continue

        if date_years > 0:
            total_years = max(total_years, date_years)

        # Method 3: Check for internship mentions (indicates junior level)
        internship_matches = INTERNSHIP_PATTERN.findall(text)
        if internship_matches:
            entries.append(f"Internship mentions: {len(internship_matches)}")
            # If no other experience detected, give at least 0.5 years
            if total_years == 0:
                total_years = 0.5

        # Check seniority indicators
        seniority_matches = SENIORITY_PATTERN.findall(text_lower)
        if seniority_matches:
            entries.append(f"Seniority indicators: {', '.join(set(seniority_matches))}")

        context.total_years_experience = total_years
        context.experience_entries = entries

        # Score experience (geared towards intern/junior roles)
        # 0 years = 0, 0.5 years = 40, 1 year = 60, 2+ years = 80, 4+ years = 100
        if total_years <= 0:
            context.experience_score = 0.0
        elif total_years < 1:
            context.experience_score = 40.0
        elif total_years < 2:
            context.experience_score = 60.0
        elif total_years < 4:
            context.experience_score = 80.0
        else:
            context.experience_score = 100.0

        logger.info(
            f"Experience: ~{total_years} years, "
            f"score={context.experience_score}%, "
            f"entries={len(entries)}"
        )
