# -*- coding: utf-8 -*-
"""Rule-based suggestions must not push tech examples on non-tech CVs.

Founder-reported: a cinema/RTV graduate was told to "list Python, React,
SQL, Docker", add "GitHub repositories" and get "AWS certifications". Tech
examples are kept for tech domains only; everyone else gets neutral wording.
"""
from app.analysis.base_analyzer import AnalysisContext
from app.analysis.suggestion_generator import SuggestionGenerator

CV_TEXT = "A short CV text without any recognizable structure or skills."

TECH_MARKERS = ("Python", "React", "Docker", "GitHub", "AWS", "SQL")


def _messages(target_domain):
    ctx = AnalysisContext(extracted_text=CV_TEXT)
    ctx.detected_sections = {
        "summary": False, "skills": False, "experience": False,
        "education": False, "projects": False, "certifications": False,
    }
    SuggestionGenerator(target_domain).analyze(ctx)
    return " || ".join(s["message"] for s in ctx.suggestions)


def test_non_tech_domain_gets_no_tech_examples():
    msgs = _messages("Marketing & Communications")
    for marker in TECH_MARKERS:
        assert marker not in msgs, f"tech example '{marker}' leaked into non-tech advice"


def test_other_domain_gets_no_tech_examples():
    msgs = _messages("Other")
    for marker in TECH_MARKERS:
        assert marker not in msgs


def test_tech_domain_keeps_tech_examples():
    msgs = _messages("Software Engineering")
    assert "Python" in msgs and "GitHub" in msgs


def test_default_construction_stays_neutral():
    # Engine callers that don't pass a domain must get the neutral wording.
    msgs = _messages(None)
    for marker in TECH_MARKERS:
        assert marker not in msgs
