"""
Experience Evaluator - detects years of experience using regex heuristics.
Looks for patterns like "3 years of experience" (in all 5 UI languages),
date ranges ("2019-2023", "Ocak 2021 - Devam ediyor"), and internship
mentions. Overlapping date ranges are MERGED (not summed), and ranges that
appear on education lines (university, BSc, lise, Ausbildung, ...) are
excluded from work experience.
"""

import logging
import re
from datetime import datetime

from app.analysis.base_analyzer import BaseAnalyzer, AnalysisContext

logger = logging.getLogger("cvision.analysis.experience_evaluator")

# Pattern: "X years of experience" / "X yıl deneyim" / "X Jahre Erfahrung" /
# "X años de experiencia" / "X ans d'expérience". Runs on normalized text.
# NOTE: Turkish is "yil(lik)" with an explicit bound — a bare "yil\w*" would
# also match "yildiz" (star), giving "5 yıldızlı otel" 5 years of experience.
YEARS_PATTERN = re.compile(
    r"(\d+)\+?\s*(?:years?|yrs?|yil(?:lik)?\b|jahren?|jahre?|anos?|ans?)",
    re.IGNORECASE,
)

# Words meaning "still ongoing" as a date-range end, all 5 languages
# (normalized): present/current, devam (ediyor)/günümüz/halen,
# heute/aktuell, actualidad/presente/actual, aujourd'hui.
_PRESENT_WORDS = (
    r"present|current|now|today|devam|gunumuz|halen|guncel|suan"
    r"|heute|aktuell|actualidad|presente|actual|aujourd"
)

# Pattern: date ranges like "2019 - 2023", "Jan 2020 – Present",
# "Ocak 2021 - Devam ediyor". Month names are optional, so non-English
# month names simply don't participate.
DATE_RANGE_PATTERN = re.compile(
    r"(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?"
    r"(20\d{2}|19\d{2})"
    r"\s*[-–—~to]+\s*"
    r"(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?"
    rf"(20\d{{2}}|19\d{{2}}|{_PRESENT_WORDS})",
    re.IGNORECASE,
)

# Education context markers (normalized). A date range whose line (or the
# previous non-empty line) matches these is treated as an education period,
# not work experience — fixes fresh graduates getting "10 years experience"
# from school/BSc/MSc date ranges.
EDUCATION_CONTEXT_PATTERN = re.compile(
    r"universit|college|school|bachelor|master|\bphd\b|\bbsc\b|\bmsc\b"
    r"|\bmba\b|diploma|degree|\bgpa\b|graduat"
    r"|\blise\w*|\bokul\w*|\bmezun\w*|\blisans\w*|\begitim\w*|\bakademi\w*"
    r"|ausbildung|studium|hochschule|universitat|abitur|abschluss"
    r"|educacion|universidad|licenciatura|instituto|bachillerato"
    r"|formation|diplome|licence|\becole\b",
    re.IGNORECASE,
)

# Pattern: "internship", "intern", "staj", "praktikum", "prácticas", "stage"
INTERNSHIP_PATTERN = re.compile(
    r"\b(?:internship|intern|working\s+student|co-?op|apprentice"
    r"|staj\w*|praktikum|practicas|stagiaire)\b",
    re.IGNORECASE,
)

# Pattern: "senior", "lead", "manager", ... (en + tr/de/es/fr equivalents)
SENIORITY_PATTERN = re.compile(
    r"\b(?:senior|lead|principal|staff|manager|director|head\s+of|vp"
    r"|kidemli|mudur|yonetici|leiter|direktor|gerente|responsable|chef\s+de)\b",
    re.IGNORECASE,
)


def _line_context(text: str, pos: int) -> str:
    """The line containing `pos` plus the previous non-empty line."""
    line_start = text.rfind("\n", 0, pos) + 1
    line_end = text.find("\n", pos)
    if line_end == -1:
        line_end = len(text)
    current = text[line_start:line_end]

    prev = ""
    cursor = line_start - 1
    while cursor > 0:
        prev_start = text.rfind("\n", 0, cursor) + 1
        candidate = text[prev_start:cursor].strip()
        if candidate:
            prev = candidate
            break
        cursor = prev_start - 1

    return f"{prev}\n{current}"


def _merge_spans(spans: list[tuple[int, int]]) -> float:
    """Total years covered by the union of [start, end] year intervals."""
    if not spans:
        return 0.0
    spans = sorted(spans)
    merged = [list(spans[0])]
    for start, end in spans[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return float(sum(end - start for start, end in merged))


class ExperienceEvaluator(BaseAnalyzer):
    """Evaluates work experience from CV text using regex heuristics."""

    @property
    def name(self) -> str:
        return "Experience Evaluator"

    def analyze(self, context: AnalysisContext) -> None:
        # Normalized text: diacritic-folded so tr/es/de/fr patterns match,
        # and offsets stay consistent for line-context extraction.
        text = context.text_normalized

        total_years = 0.0
        entries: list[str] = []

        # Method 1: Explicit "X years of experience" mentions
        explicit_matches = YEARS_PATTERN.findall(text)
        if explicit_matches:
            max_years = max(int(y) for y in explicit_matches)
            total_years = max(total_years, float(max_years))
            entries.append(f"Explicit mention: {max_years} years")

        # Method 2: Date ranges — merge the union of WORK ranges only.
        current_year = datetime.now().year
        work_spans: list[tuple[int, int]] = []

        for m in DATE_RANGE_PATTERN.finditer(text):
            start_str, end_str = m.group(1), m.group(2)
            try:
                start_year = int(start_str)
            except (ValueError, TypeError):
                continue
            if end_str.isdigit():
                end_year = int(end_str)
            else:
                end_year = current_year  # a "present" word in any language

            span = end_year - start_year
            if not (0 < span <= 50):  # sanity check
                continue

            if EDUCATION_CONTEXT_PATTERN.search(_line_context(text, m.start())):
                entries.append(
                    f"Education period (excluded): {start_year}-{end_str}"
                )
                continue

            work_spans.append((start_year, end_year))
            entries.append(f"Date range: {start_year}-{end_str} ({span} yrs)")

        date_years = _merge_spans(work_spans)
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
        seniority_matches = SENIORITY_PATTERN.findall(text)
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
