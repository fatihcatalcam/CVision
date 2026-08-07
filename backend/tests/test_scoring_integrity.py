# -*- coding: utf-8 -*-
"""The score has to measure the CV, not the words it happens to contain.

Two findings from running the founder's own CV through the engine:

  1. Completeness searched the whole document for a section's keyword, in any
     context. So the one sentence "I can provide references on request and my
     education is ongoing" scored 50% - education, experience and references all
     "found", with no section in the document at all. The two lines
     "REFERENCES / Available upon request" were worth a full 5 points, for a
     line most current CV advice says to delete.

  2. Experience topped out at "4+ years = 100" on one flat curve. This product's
     users are students and early-career candidates, so no matter how good a
     student's CV was it could not pass ~94 overall - the component was scoring
     age. A weak CV from someone with five years collected full marks there
     automatically.
"""

from datetime import datetime

import pytest

from app.analysis.base_analyzer import AnalysisContext
from app.analysis.experience_evaluator import ExperienceEvaluator
from app.analysis.section_detector import SECTION_WEIGHTS, SectionDetector


def _sections(text: str) -> AnalysisContext:
    ctx = AnalysisContext(extracted_text=text)
    SectionDetector().analyze(ctx)
    return ctx


def _experience(text: str) -> AnalysisContext:
    ctx = AnalysisContext(extracted_text=text)
    ExperienceEvaluator().analyze(ctx)
    return ctx


# ── completeness measures content, not vocabulary ─────────────────────────────

def test_a_sentence_mentioning_sections_is_not_a_cv():
    """The exact string that used to score 50%."""
    ctx = _sections(
        "EXPERIENCE\nI can provide references on request and my education is ongoing."
    )

    assert ctx.completeness_score <= 30
    assert ctx.detected_sections["education"] is False
    assert ctx.detected_sections["references"] is False


def test_boilerplate_references_earn_nothing():
    """"Available upon request" is filler. It used to be worth 5 points."""
    body = "SKILLS\nPython, FastAPI, Docker, PostgreSQL\n"
    with_refs = body + "\nREFERENCES\nAvailable upon request.\n"

    assert _sections(with_refs).completeness_score == _sections(body).completeness_score


def test_references_carries_no_weight_at_all():
    assert "references" not in SECTION_WEIGHTS


def test_a_heading_with_nothing_under_it_does_not_count():
    assert _sections("PROJECTS\n").detected_sections["projects"] is False
    assert _sections(
        "PROJECTS\nBooking bot on the WhatsApp Business API, live for a shop\n"
    ).detected_sections["projects"] is True


def test_a_labelled_line_counts_as_its_section():
    """Sections written inline rather than as a block, which is normal for
    languages and sometimes for skills."""
    ctx = _sections("Spoken languages: Turkish (native), English (C1, advanced)")

    assert ctx.detected_sections["languages"] is True


def test_the_word_in_prose_does_not_count():
    ctx = _sections(
        "I led the project team and my language skills helped me a lot in that role."
    )

    assert ctx.detected_sections["projects"] is False
    assert ctx.detected_sections["languages"] is False


def test_weights_still_total_one_hundred():
    """The completeness percentage is only meaningful if they do."""
    assert sum(SECTION_WEIGHTS.values()) == 100.0


# ── experience is read against the candidate's stage ──────────────────────────

_YEAR = datetime.now().year


def test_a_student_with_a_year_of_work_is_not_scored_as_a_failure():
    """One year alongside a degree is good going. It used to score 60, which
    capped the whole CV at ~94 however strong the rest was."""
    ctx = _experience(
        f"Computer Engineering student\n"
        f"EDUCATION\nArel University - B.Sc. Computer Engineering\nSep 2023 - Present\n"
        f"EXPERIENCE\nBackend Developer - Acme\nMay {_YEAR - 1} - Present\n"
    )

    assert ctx.is_student is True
    assert ctx.experience_score >= 85


def test_a_student_can_reach_the_ceiling():
    ctx = _experience(
        f"Computer Engineering student\n"
        f"EDUCATION\nArel University\nSep 2022 - Present\n"
        f"EXPERIENCE\nBackend Developer - Acme\nJun {_YEAR - 2} - Present\n"
    )

    assert ctx.is_student is True
    assert ctx.experience_score == 100.0


def test_a_student_with_projects_but_no_job_gets_credit_for_them():
    """Most of the audience on their first upload. Built things are evidence
    even when nothing is dated."""
    ctx = AnalysisContext(
        extracted_text=(
            "Computer Engineering student\n"
            "EDUCATION\nArel University\nSep 2024 - Present\n"
            "PROJECTS\nBooking bot on the WhatsApp Business API, live for a shop\n"
        )
    )
    SectionDetector().analyze(ctx)      # populates detected_sections
    ExperienceEvaluator().analyze(ctx)

    assert ctx.is_student is True
    assert ctx.experience_score == 55.0


def test_an_empty_student_cv_is_not_rewarded_for_being_empty():
    """The mirror image of the bug being fixed: a page with nothing on it must
    not score the same as one with three shipped projects."""
    ctx = AnalysisContext(
        extracted_text=(
            "Computer Engineering student\n"
            "EDUCATION\nArel University\nSep 2024 - Present\n"
            "SKILLS\nPython, Microsoft Office\n"
        )
    )
    SectionDetector().analyze(ctx)
    ExperienceEvaluator().analyze(ctx)

    assert ctx.is_student is True
    assert ctx.experience_score == 20.0


def test_a_professional_is_still_measured_on_the_professional_curve():
    """The student band must not become a loophole: no student markers means
    the original curve applies, so a one-year professional still scores 60."""
    ctx = _experience(
        f"Backend Developer\nEXPERIENCE\nAcme Corp\nMay {_YEAR - 1} - Present\n"
    )

    assert ctx.is_student is False
    assert ctx.experience_score == 60.0


def test_a_professional_with_four_years_is_unchanged():
    ctx = _experience(
        f"Senior Backend Developer\nEXPERIENCE\nAcme Corp\n{_YEAR - 5} - Present\n"
    )

    assert ctx.is_student is False
    assert ctx.experience_score == 100.0


@pytest.mark.parametrize(
    "marker",
    ["student", "öğrenci", "estudiante", "étudiant", "Studentin"],
)
def test_student_detection_works_in_every_ui_language(marker):
    ctx = _experience(f"{marker}\nEDUCATION\nUniversity\nSep 2023 - Present\n")

    assert ctx.is_student is True
