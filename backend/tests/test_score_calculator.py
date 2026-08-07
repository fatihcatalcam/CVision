# -*- coding: utf-8 -*-
"""The module that produces the headline number, tested directly.

score_calculator.py is 208 lines and was not named in a single test - it ran
only incidentally, through whole-engine runs whose assertions were about
something else. So the one component every user sees, and the anti-gaming rule
that protects it, had no owner.

The weights and the skills curve are the two things here that decide what a
score means. If either moves, every score in the product moves with it, and
scores already shown to users stop being comparable to new ones.
"""

import pytest

from app.analysis.base_analyzer import AnalysisContext
from app.analysis.score_calculator import SCORE_WEIGHTS, ScoreCalculator


def _context(**scores) -> AnalysisContext:
    ctx = AnalysisContext(extracted_text="irrelevant")
    for name, value in scores.items():
        setattr(ctx, name, value)
    return ctx


def _skills(*names) -> list[dict]:
    return [{"skill_name": n} for n in names]


BACKEND_PROFILE = [{
    "title": "Backend Developer",
    "expected_skills": [
        "Python", "FastAPI", "Django", "PostgreSQL", "Redis", "Docker",
        "REST API", "SQL", "Git", "Linux", "Kubernetes", "Celery",
    ],
}]


# ── the weights ───────────────────────────────────────────────────────────────

def test_weights_sum_to_one():
    """They are multiplied by percentages, so anything else silently rescales
    every score in the product."""
    assert sum(SCORE_WEIGHTS.values()) == pytest.approx(1.0)


def test_overall_is_the_weighted_sum_of_its_parts():
    ctx = _context(
        completeness_score=80.0, ats_score=90.0,
        keyword_score=60.0, experience_score=40.0,
    )
    ctx.extracted_skills = _skills("Python", "FastAPI", "PostgreSQL")

    ScoreCalculator(BACKEND_PROFILE).analyze(ctx)

    expected = (
        80.0 * SCORE_WEIGHTS["completeness"]
        + ctx.skills_score * SCORE_WEIGHTS["skills"]
        + 90.0 * SCORE_WEIGHTS["ats"]
        + 60.0 * SCORE_WEIGHTS["keywords"]
        + 40.0 * SCORE_WEIGHTS["experience"]
    )
    assert ctx.overall_score == pytest.approx(round(expected, 1))


def test_the_relevant_skills_curve_stops_at_ninety_two():
    """Ten on-target skills is the top of the base curve, not full marks.

    Documented here because it is easy to read as a bug and is currently by
    design: the last 8 points come only from the breadth bonus, so a candidate
    with exactly the ten skills the role wants scores 92 on this component while
    one who also lists eight unrelated tools reaches 100. If that trade is ever
    revisited, this test is the thing that should fail first.
    """
    ctx = _context()
    ctx.extracted_skills = _skills(
        "Python", "FastAPI", "Django", "PostgreSQL", "Redis",
        "Docker", "REST API", "SQL", "Git", "Linux",
    )

    ScoreCalculator(BACKEND_PROFILE).analyze(ctx)

    assert ctx.skills_score == 92.0


def test_a_perfect_cv_scores_one_hundred():
    ctx = _context(
        completeness_score=100.0, ats_score=100.0,
        keyword_score=100.0, experience_score=100.0,
    )
    # Ten relevant (base 92) plus enough breadth to clear the bonus.
    ctx.extracted_skills = _skills(
        "Python", "FastAPI", "Django", "PostgreSQL", "Redis",
        "Docker", "REST API", "SQL", "Git", "Linux",
        "Figma", "Excel", "Canva", "Notion", "Slack", "Jira", "Zoom", "Trello",
    )

    ScoreCalculator(BACKEND_PROFILE).analyze(ctx)

    assert ctx.skills_score == 100.0
    assert ctx.overall_score == 100.0


def test_an_empty_cv_scores_zero():
    ScoreCalculator(BACKEND_PROFILE).analyze(ctx := _context())

    assert ctx.skills_score == 0.0
    assert ctx.overall_score == 0.0


# ── the anti-gaming rule ──────────────────────────────────────────────────────

def test_stuffing_off_target_skills_cannot_reach_a_focused_candidate():
    """The rule the module exists to enforce. Listing every tool you have ever
    opened must not beat actually having the role's skills."""
    focused = _context()
    focused.extracted_skills = _skills(
        "Python", "FastAPI", "Django", "PostgreSQL", "Redis",
        "Docker", "REST API", "SQL", "Git", "Linux",
    )
    stuffer = _context()
    stuffer.extracted_skills = _skills(
        "Python", "Excel", "Photoshop", "Kaizen", "SAP", "Word",
        "PowerPoint", "AutoCAD", "Figma", "Canva", "Outlook", "Notion",
        "Trello", "Slack", "Jira", "Miro", "Asana", "Zoom",
    )

    ScoreCalculator(BACKEND_PROFILE).analyze(focused)
    ScoreCalculator(BACKEND_PROFILE).analyze(stuffer)

    assert focused.skills_score > stuffer.skills_score
    # And the stuffer has far MORE listed skills while scoring lower.
    assert len(stuffer.extracted_skills) > len(focused.extracted_skills)


def test_breadth_still_helps_a_little():
    """A backend developer who also knows Figma is worth slightly more, not the
    same - the cap acknowledges breadth without letting it dominate."""
    narrow = _context()
    narrow.extracted_skills = _skills("Python", "FastAPI", "PostgreSQL")
    broad = _context()
    broad.extracted_skills = _skills("Python", "FastAPI", "PostgreSQL", "Figma", "Canva")

    ScoreCalculator(BACKEND_PROFILE).analyze(narrow)
    ScoreCalculator(BACKEND_PROFILE).analyze(broad)

    assert broad.skills_score > narrow.skills_score
    assert broad.skills_score - narrow.skills_score <= 10


def test_relevant_skills_drive_the_curve():
    ctx3, ctx6, ctx10 = _context(), _context(), _context()
    ctx3.extracted_skills = _skills("Python", "FastAPI", "SQL")
    ctx6.extracted_skills = _skills("Python", "FastAPI", "SQL", "Docker", "Redis", "Git")
    ctx10.extracted_skills = _skills(
        "Python", "FastAPI", "SQL", "Docker", "Redis",
        "Git", "Django", "PostgreSQL", "REST API", "Linux",
    )

    for ctx in (ctx3, ctx6, ctx10):
        ScoreCalculator(BACKEND_PROFILE).analyze(ctx)

    assert ctx3.skills_score < ctx6.skills_score < ctx10.skills_score


def test_with_no_profiles_scoring_degrades_instead_of_failing():
    """Deployments without seeded role profiles must still return a score."""
    ctx = _context()
    ctx.extracted_skills = _skills("Python", "FastAPI", "PostgreSQL")

    ScoreCalculator([]).analyze(ctx)

    assert ctx.skills_score > 0


# ── the prose that goes with the number ───────────────────────────────────────

def test_the_summary_states_the_score_it_was_built_from():
    """Two numbers on one screen that disagree is the fastest way to lose a
    reader's trust."""
    ctx = _context(
        completeness_score=90.0, ats_score=90.0,
        keyword_score=90.0, experience_score=90.0,
    )
    ctx.extracted_skills = _skills("Python", "FastAPI", "PostgreSQL", "Docker")

    ScoreCalculator(BACKEND_PROFILE).analyze(ctx)

    assert str(ctx.overall_score) in ctx.summary


def test_a_weak_cv_is_told_what_is_weak():
    ctx = _context(
        completeness_score=20.0, ats_score=30.0,
        keyword_score=10.0, experience_score=20.0,
    )
    ctx.detected_sections = {"education": True, "experience": False, "skills": False}

    ScoreCalculator(BACKEND_PROFILE).analyze(ctx)

    assert ctx.weaknesses
    assert not ctx.strengths


def test_a_strong_cv_is_told_what_is_strong():
    ctx = _context(
        completeness_score=95.0, ats_score=95.0,
        keyword_score=85.0, experience_score=85.0,
    )
    ctx.extracted_skills = _skills("Python", "FastAPI", "PostgreSQL", "Docker", "Git")
    ctx.detected_sections = {"projects": True}

    ScoreCalculator(BACKEND_PROFILE).analyze(ctx)

    assert ctx.strengths
    assert not ctx.weaknesses
