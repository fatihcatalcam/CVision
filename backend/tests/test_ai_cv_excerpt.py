# -*- coding: utf-8 -*-
"""The CV text the model is given must be the whole CV, or say it is not.

A clean one-page CV (about 5,000 characters) reached the model cut in two
places: the first 500 characters stopped mid-word ("Docker and observ"), the
rest of the summary was replaced by "[...]", and the body stopped mid-word at
4,000 characters ("Designed th"), dropping Education and Skills. The model was
not told, so four of its five suggestions reported the cuts as flaws in the
CV: a "truncated" summary, a "cut off" project, a missing target role that
was in the dropped part, and a missing Certifications section.
"""

from app.services import ai_service
from app.services.ai_service import _build_user_prompt

# Invented, shaped like the CV that exposed the bug: a summary longer than 500
# characters, experience, seven projects, then education and skills.
CV = "\n".join([
    "Deniz Yilmaz",
    "Istanbul, Turkey | deniz@example.com | +90 500 000 0000 | github.com/example",
    "PROFESSIONAL SUMMARY",
    "Computer Engineering student and full stack developer with a backend and platform focus. I build production systems in daily",
    "use: a CV analysis SaaS, a booking platform and a stock system for a retailer, the last two as freelance work I also maintain.",
    "Strong in Python (FastAPI), Node.js, REST API design, Docker and observability (Prometheus, Grafana).",
    "Seeking a backend, full stack or platform engineering role.",
    "EXPERIENCE",
    "AI Data Annotation Specialist, Example Corp",
    "May 2025 to Present",
    "- Evaluate multimodal model outputs against structured rubrics and run root cause analysis on responses",
    "- Annotate and cross validate datasets under strict SLAs in a remote international team",
    "PROJECTS",
    *[
        line
        for n in range(1, 8)
        for line in (
            f"Project {n}: Production system number {n}",
            "Python, FastAPI, PostgreSQL, Redis, Docker Compose, Prometheus, Grafana",
            f"- Built and deployed system {n}, which handles thousands of requests a day for a paying client in daily use",
            f"- Designed the backend for system {n} and a control panel to start, track and stop jobs without redeployment",
            f"- Set up metrics and dashboards for system {n} to surface health and failure rates, deployed with one command",
            f"- Covered system {n} with automated tests and made every write idempotent so retries never double count",
        )
    ],
    "EDUCATION",
    "Example University, B.Sc. Computer Engineering",
    "Sep 2023 to Present",
    "SKILLS",
    "Languages: Python, TypeScript, JavaScript, SQL",
    "Backend & Data: FastAPI, Node.js, Express, PostgreSQL, Redis, SQLAlchemy",
    "DevOps & Tooling: Docker, Prometheus, Grafana, Git, Vercel, Render",
])

NOTE = "shortened"


def _prompt(cv: str) -> str:
    return _build_user_prompt(
        cv,
        scores={},
        target_domain=None,
        role_profiles=None,
        rule_based_suggestions=[],
        lang_name="English",
    )


def test_the_fixture_is_the_length_that_was_cut():
    # Longer than the old 4,000 limit and its 500-character header.
    assert 4000 < len(CV) < ai_service.CV_PROMPT_MAX_CHARS


def test_a_normal_length_cv_reaches_the_model_whole():
    prompt = _prompt(CV)

    assert CV in prompt
    assert "[...]" not in prompt
    assert NOTE not in prompt.lower()


def test_a_cv_over_the_limit_is_cut_between_lines_and_the_model_is_told():
    long_cv = "\n".join([CV] * 4)
    excerpt, shortened = ai_service._cv_excerpt(long_cv)

    assert shortened
    assert len(excerpt) <= ai_service.CV_PROMPT_MAX_CHARS
    # Every line sent is a whole line of the CV: nothing ends mid-word. The
    # separator's own lines ("[...]" and the blank lines around it) aside.
    original_lines = set(long_cv.split("\n"))
    assert all(line in original_lines for line in excerpt.split("\n") if line not in ("[...]", ""))

    prompt = _prompt(long_cv)
    assert NOTE in prompt.lower()


def test_cv_excerpt_leaves_a_normal_cv_alone():
    assert ai_service._cv_excerpt(CV) == (CV, False)
