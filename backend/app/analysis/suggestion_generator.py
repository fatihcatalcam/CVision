"""
Suggestion Generator - produces rule-based, actionable improvement suggestions.
Generates at least 3 suggestions per analysis (FR10).
Each suggestion has a category, priority, and message.

Messages are localized (see suggestion_texts.py): the generator picks the
message table for the requested UI language and never concatenates fragments,
so grammar stays correct across languages.
"""

import logging
import re
from typing import Any

from app.analysis.base_analyzer import BaseAnalyzer, AnalysisContext
from app.analysis.suggestion_texts import texts_for
from app.analysis.text_utils import normalize_text

logger = logging.getLogger("cvision.analysis.suggestion_generator")


# Domains where concrete tech examples (Python, GitHub, AWS...) are helpful.
# Everyone else gets neutral, field-agnostic wording - a cinema graduate must
# not be told to list Docker skills and GitHub repos.
_TECH_DOMAINS = {"Software Engineering", "Data & Analytics", "Cybersecurity"}

# Signals that a CV already quantifies its achievements. Language-agnostic on
# purpose: the old check keyed off English action verbs, so every Turkish CV
# fell through to a generic "quantify your achievements" even when it was full
# of metrics. Percentages are the strongest signal; a bare 4-digit number is
# excluded so date ranges (2022-2024) don't read as metrics.
_PERCENT_RE = re.compile(r'\d+\s*%|%\s*\d+')
_METRIC_RE = re.compile(r'\d+\s*%|%\s*\d+|\d[\d.,]*\+|\b\d{1,3}\b')


# Action-verb patterns for the "quantify" highlight, per UI language. Matched
# against diacritic-folded, lowercased text (normalize_text) so a CV written
# with or without accents both hit - patterns are therefore written in plain
# ASCII. English, German, French and Spanish CVs conventionally start a bullet
# with the action verb, so those anchor at the start (^). Turkish is verb-final
# (SOV) - the verb ends the line - so it is searched anywhere. Spanish/Turkish
# use stems + \w* to absorb conjugation; German/French use whole past
# participles. Tuned against real bullets per language (see tests).
_ACTION_VERB_PATTERNS: dict[str, re.Pattern] = {
    "en": re.compile(
        r"^(?:developed|implemented|designed|built|managed|led|created|improved|"
        r"optimized|oversaw|delivered|collaborated|maintained|automated|"
        r"integrated|architected)\b"),
    "de": re.compile(
        r"^(?:entwickelt|implementiert|konzipiert|entworfen|erstellt|geleitet|"
        r"verwaltet|optimiert|verbessert|automatisiert|integriert|eingefuhrt|"
        r"durchgefuhrt|aufgebaut|betreut|koordiniert|gesteigert|reduziert|"
        r"gefuhrt)\b"),
    "fr": re.compile(
        r"^(?:developpe|implemente|concu|cree|gere|dirige|optimise|ameliore|"
        r"automatise|integre|realise|coordonne|augmente|reduit|maintenu|lance|"
        r"mene)\b"),
    "es": re.compile(
        r"^(?:desarroll|implement|disen|cre|gestion|dirig|optimic|mejor|"
        r"automatic|integr|realic|coordin|aument|reduj|lider|mantuv|lanz|"
        r"constru)\w*"),
    "tr": re.compile(
        r"(?:gelistir|tasarla|olustur|yonet|kur|artir|azalt|sagla|uygula|"
        r"iyilestir|hazirla|yurut|gerceklestir|tamamla|baslat|uret|planla|"
        r"analiz\s*et|optimiz|koordine|entegre|liderlik|kazan)\w*"),
}
# Verb-final languages are searched anywhere in the line, not anchored at start.
_VERB_FINAL_LANGS = {"tr"}


def _is_well_quantified(text: str) -> bool:
    """True if the CV already carries enough concrete metrics.

    Two or more percentages, or six or more metric tokens overall, is treated
    as "this candidate quantifies" - so we don't nag them to do what they've
    already done. Tuned against real quantified CVs vs. sparse ones.
    """
    if len(_PERCENT_RE.findall(text)) >= 2:
        return True
    return len(_METRIC_RE.findall(text)) >= 6


class SuggestionGenerator(BaseAnalyzer):
    """Generates actionable improvement suggestions based on analysis results."""

    def __init__(self, target_domain: str | None = None, language: str | None = None):
        """
        Args:
            target_domain: The CV's target domain. Tech domains get concrete
                tech examples in suggestion texts; anything else (including
                "Other"/None) gets neutral wording.
            language: UI language for the messages (en/tr/de/fr/es). Unknown or
                None falls back to English, so existing callers are unaffected.
        """
        self._is_tech = target_domain in _TECH_DOMAINS
        self._t = texts_for(language)
        self._lang = (language or "en").split("-")[0].lower()

    @property
    def name(self) -> str:
        return "Suggestion Generator"

    def _key(self, base: str) -> str:
        """Pick the tech or general variant of a message key."""
        return f"{base}_tech" if self._is_tech else f"{base}_general"

    def analyze(self, context: AnalysisContext) -> None:
        t = self._t
        suggestions: list[dict[str, Any]] = []

        # ---- Section-based suggestions ----
        sections = context.detected_sections

        if not sections.get("summary"):
            suggestions.append({
                "category": "content",
                "priority": "high",
                "message": t["summary_missing"],
                "snippets": []
            })

        if not sections.get("skills"):
            suggestions.append({
                "category": "skills",
                "priority": "high",
                "message": t[self._key("skills_missing")],
                "snippets": []
            })

        if not sections.get("experience"):
            suggestions.append({
                "category": "experience",
                "priority": "high",
                "message": t["experience_missing"],
                "snippets": []
            })

        if not sections.get("education"):
            suggestions.append({
                "category": "content",
                "priority": "high",
                "message": t["education_missing"],
                "snippets": []
            })

        if not sections.get("projects"):
            suggestions.append({
                "category": "content",
                "priority": "medium",
                "message": t[self._key("projects_missing")],
                "snippets": []
            })

        if not sections.get("certifications"):
            suggestions.append({
                "category": "content",
                "priority": "low",
                "message": t[self._key("certifications")],
                "snippets": []
            })

        # ---- ATS-based suggestions ----
        for issue in context.ats_issues:
            lowered = issue.lower()
            if "email" in lowered:
                suggestions.append({
                    "category": "ats", "priority": "high",
                    "message": t["ats_email"], "snippets": []
                })
            elif "contact" in lowered:
                suggestions.append({
                    "category": "ats", "priority": "high",
                    "message": t["ats_contact"], "snippets": []
                })
            elif "action verbs" in lowered:
                suggestions.append({
                    "category": "formatting", "priority": "medium",
                    "message": t["ats_action_verbs"], "snippets": []
                })
            elif "short" in lowered or "length" in lowered:
                suggestions.append({
                    "category": "content", "priority": "medium",
                    "message": t["ats_length_short"], "snippets": []
                })
            elif "caps" in lowered:
                suggestions.append({
                    "category": "formatting", "priority": "low",
                    "message": t["ats_caps"], "snippets": []
                })

        # ---- Skill-based suggestions ----
        skill_count = len(context.extracted_skills)
        if skill_count < 5:
            suggestions.append({
                "category": "skills",
                "priority": "high",
                "message": t[self._key("skills_few")].format(count=skill_count),
                "snippets": []
            })

        # Check skill diversity
        if skill_count > 0:
            categories = set(s["skill_category"] for s in context.extracted_skills)
            if len(categories) < 3:
                suggestions.append({
                    "category": "skills",
                    "priority": "medium",
                    "message": t[self._key("skills_diversity")],
                    "snippets": []
                })

        # ---- Experience-based suggestions ----
        # Only nudge quantification when the CV actually lacks it. A CV already
        # full of metrics (%40, 1000+, 5 kişi) must not be told to quantify -
        # that was the single most over-shown suggestion, especially on Turkish
        # CVs where the English action-verb highlight never matched.
        text = context.extracted_text
        if not _is_well_quantified(text):
            # Highlight action-verb lines that carry no numbers, in the user's
            # language. Verb-final languages (Turkish) are searched anywhere in
            # the line; verb-initial ones are anchored at the start.
            sentences = re.split(r'(?<=[.!?])\s+|\n+|-|•|\*', text)
            verb_re = _ACTION_VERB_PATTERNS.get(self._lang, _ACTION_VERB_PATTERNS["en"])
            search_anywhere = self._lang in _VERB_FINAL_LANGS

            non_quantified_sentences = []
            for s in sentences:
                s = s.strip()
                if not s:
                    continue
                # Match on folded text (accent/case-insensitive) but keep the
                # original line as the snippet the user sees.
                folded = normalize_text(s)
                found = verb_re.search(folded) if search_anywhere else verb_re.match(folded)
                if found and not re.search(r'\d', s):
                    if len(s) > 15:  # Avoid too short snippets
                        non_quantified_sentences.append(s)

            non_quantified_sentences = non_quantified_sentences[:3]  # cap for UI

            if non_quantified_sentences:
                msg = t["quantify_highlighted"]
            else:
                msg = t[self._key("quantify_default")]

            suggestions.append({
                "category": "experience",
                "priority": "high" if non_quantified_sentences else "medium",
                "message": msg,
                "snippets": non_quantified_sentences
            })

        # ---- Keyword suggestions ----
        if context.keyword_score < 40:
            suggestions.append({
                "category": "content",
                "priority": "medium",
                "message": t["keywords_missing"],
                "snippets": []
            })

        # ---- Ensure minimum 3 suggestions ----
        if len(suggestions) < 3:
            default_suggestions = [
                {"category": "formatting", "priority": "low",
                 "message": t["default_formatting"], "snippets": []},
                {"category": "content", "priority": "low",
                 "message": t["default_tailor"], "snippets": []},
                {"category": "formatting", "priority": "low",
                 "message": t["default_length"], "snippets": []},
            ]
            for default in default_suggestions:
                if len(suggestions) >= 3:
                    break
                # Avoid duplicates by category + priority
                if not any(s["category"] == default["category"] and
                           s["priority"] == default["priority"]
                           for s in suggestions):
                    suggestions.append(default)

        context.suggestions = suggestions

        logger.info(f"Generated {len(suggestions)} suggestions")
