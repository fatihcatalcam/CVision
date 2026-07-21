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

logger = logging.getLogger("cvision.analysis.suggestion_generator")


# Domains where concrete tech examples (Python, GitHub, AWS...) are helpful.
# Everyone else gets neutral, field-agnostic wording - a cinema graduate must
# not be told to list Docker skills and GitHub repos.
_TECH_DOMAINS = {"Software Engineering", "Data & Analytics", "Cybersecurity"}


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
        # Always run the quantification check.
        # Highlight sentences that use strong action verbs but carry no numbers.
        text = context.extracted_text
        sentences = re.split(r'(?<=[.!?])\s+|\n+|-|•|\*', text)

        non_quantified_sentences = []
        action_verbs = r"^(?:Developed|Implemented|Designed|Built|Managed|Led|Created|Improved|Optimized|Oversaw|Delivered|Collaborated|Maintained|Automated|Integrated|Architected)\b"

        for s in sentences:
            s = s.strip()
            if not s:
                continue
            if re.match(action_verbs, s, re.IGNORECASE):
                if not re.search(r'\d', s):
                    if len(s) > 15:  # Avoid too short snippets
                        non_quantified_sentences.append(s)

        # Limit to top 3 to avoid overwhelming UI
        non_quantified_sentences = non_quantified_sentences[:3]

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
