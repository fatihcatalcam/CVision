"""
ATS Checker — deterministic rules for Applicant Tracking System compatibility.
Checks formatting, structure, and content elements that ATS systems look for.
"""

import logging
import re

from app.analysis.base_analyzer import BaseAnalyzer, AnalysisContext

logger = logging.getLogger("cvision.analysis.ats_checker")


# ATS check definitions: (check_name, check_function_name, weight, pass_message, fail_message)
ATS_CHECKS = [
    {
        "name": "contact_info",
        "weight": 15.0,
        "pass_msg": "Contact information detected (email/phone)",
        "fail_msg": "No contact information (email or phone) detected",
    },
    {
        "name": "email_present",
        "weight": 10.0,
        "pass_msg": "Email address found",
        "fail_msg": "No email address found — most ATS systems require this",
    },
    {
        "name": "sufficient_length",
        "weight": 10.0,
        "pass_msg": "CV has sufficient content length",
        "fail_msg": "CV content is too short — aim for at least 200 words",
    },
    {
        "name": "no_excessive_caps",
        "weight": 10.0,
        "pass_msg": "Text formatting is ATS-friendly (no excessive caps)",
        "fail_msg": "Excessive use of ALL CAPS detected — ATS may misparse",
    },
    {
        "name": "has_action_verbs",
        "weight": 10.0,
        "pass_msg": "Action verbs used in descriptions (e.g., developed, managed, designed)",
        "fail_msg": "Few action verbs detected — use verbs like 'developed', 'managed', 'designed'",
    },
    {
        "name": "has_education",
        "weight": 15.0,
        "pass_msg": "Education section detected",
        "fail_msg": "No education section detected — most roles require education details",
    },
    {
        "name": "has_experience",
        "weight": 15.0,
        "pass_msg": "Work experience section detected",
        "fail_msg": "No work experience section detected",
    },
    {
        "name": "has_skills_section",
        "weight": 15.0,
        "pass_msg": "Skills section detected",
        "fail_msg": "No dedicated skills section — ATS systems look for explicit skill listings",
    },
]

# Common action verbs used in CVs
ACTION_VERBS = [
    "developed", "managed", "designed", "implemented", "created",
    "built", "led", "improved", "increased", "reduced",
    "analyzed", "organized", "coordinated", "delivered", "launched",
    "maintained", "optimized", "resolved", "supported", "trained",
    "achieved", "collaborated", "established", "executed", "generated",
    "integrated", "monitored", "planned", "presented", "researched",
    "streamlined", "tested", "contributed", "facilitated", "mentored",
]


class ATSChecker(BaseAnalyzer):
    """Performs deterministic ATS compatibility checks on CV text."""

    @property
    def name(self) -> str:
        return "ATS Checker"

    def analyze(self, context: AnalysisContext) -> None:
        text = context.extracted_text
        text_lower = context.text_lower
        total_weight = sum(c["weight"] for c in ATS_CHECKS)
        earned_weight = 0.0

        for check in ATS_CHECKS:
            passed = self._run_check(check["name"], text, text_lower, context)
            if passed:
                context.ats_passes.append(check["pass_msg"])
                earned_weight += check["weight"]
            else:
                context.ats_issues.append(check["fail_msg"])

        context.ats_score = round((earned_weight / total_weight) * 100, 1)

        logger.info(
            f"ATS Score: {context.ats_score}% — "
            f"{len(context.ats_passes)} passed, {len(context.ats_issues)} issues"
        )

    def _run_check(
        self,
        check_name: str,
        text: str,
        text_lower: str,
        context: AnalysisContext,
    ) -> bool:
        """Run a specific ATS check by name."""
        if check_name == "contact_info":
            return self._check_contact_info(text_lower)
        elif check_name == "email_present":
            return self._check_email(text)
        elif check_name == "sufficient_length":
            return self._check_length(text)
        elif check_name == "no_excessive_caps":
            return self._check_caps(text)
        elif check_name == "has_action_verbs":
            return self._check_action_verbs(text_lower)
        elif check_name == "has_education":
            return context.detected_sections.get("education", False)
        elif check_name == "has_experience":
            return context.detected_sections.get("experience", False)
        elif check_name == "has_skills_section":
            return context.detected_sections.get("skills", False)
        return False

    @staticmethod
    def _check_contact_info(text_lower: str) -> bool:
        """Check for presence of email or phone number."""
        email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
        phone_pattern = r"[\+]?[\d\s\-\(\)]{7,15}"
        return bool(re.search(email_pattern, text_lower)) or bool(
            re.search(phone_pattern, text_lower)
        )

    @staticmethod
    def _check_email(text: str) -> bool:
        """Check for a valid email address."""
        pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
        return bool(re.search(pattern, text))

    @staticmethod
    def _check_length(text: str) -> bool:
        """Check if CV has at least 200 words."""
        word_count = len(text.split())
        return word_count >= 200

    @staticmethod
    def _check_caps(text: str) -> bool:
        """Check that ALL CAPS words don't exceed 15% of total words."""
        words = text.split()
        if not words:
            return True
        caps_words = sum(1 for w in words if w.isupper() and len(w) > 2)
        ratio = caps_words / len(words)
        return ratio < 0.15

    @staticmethod
    def _check_action_verbs(text_lower: str) -> bool:
        """Check for at least 3 action verbs in the text."""
        found = sum(
            1 for verb in ACTION_VERBS
            if re.search(rf"\b{verb}\b", text_lower)
        )
        return found >= 3
