# -*- coding: utf-8 -*-
"""ATS score wiring for X-Ray layout findings.

Semantics (spec): layout_findings is None => no layout data (TXT/legacy/error),
layout checks EXCLUDED from the denominator - score identical to today.
layout_findings == [] => clean analyzed PDF, checks included and pass.
"""
from app.analysis.base_analyzer import AnalysisContext
from app.analysis.ats_checker import ATSChecker
from app.analysis.section_detector import SectionDetector

CV_TEXT = """
John Smith
john.smith@example.com | +1 555 123 4567

PROFESSIONAL SUMMARY
Senior engineer. Developed and maintained services. Managed a team.
Designed APIs. Implemented features. Created tooling. Led planning.
""" + "filler word " * 120 + """

WORK EXPERIENCE
Senior Backend Developer 2021 - Present

EDUCATION
BSc Computer Science 2015 - 2019

SKILLS
Python, SQL, Docker
"""


def _ats_score(layout_findings):
    ctx = AnalysisContext(extracted_text=CV_TEXT)
    ctx.layout_findings = layout_findings
    SectionDetector().analyze(ctx)   # ats checks read detected_sections
    ATSChecker().analyze(ctx)
    return ctx.ats_score


def test_none_layout_keeps_score_identical_to_legacy():
    # None (no layout data) must produce the exact score the checker gave
    # before X-Ray existed - the layout checks stay out of the denominator.
    ctx = AnalysisContext(extracted_text=CV_TEXT)
    SectionDetector().analyze(ctx)
    ATSChecker().analyze(ctx)
    assert _ats_score(None) == ctx.ats_score


def test_clean_pdf_scores_at_least_as_high_as_none():
    assert _ats_score([]) >= _ats_score(None)


def test_column_interleave_drops_the_score():
    finding = [{"type": "column_interleave", "severity": "high", "page": 1,
                "bbox": [0, 0, 0.5, 1]}]
    assert _ats_score(finding) < _ats_score([])


def test_image_loss_drops_the_score():
    finding = [{"type": "image_text_loss", "severity": "high", "page": 1,
                "bbox": [0, 0, 0.5, 0.5]}]
    assert _ats_score(finding) < _ats_score([])


def test_header_footer_info_finding_does_not_drop_score():
    finding = [{"type": "header_footer_content", "severity": "info", "page": 1,
                "bbox": [0, 0, 1, 0.05]}]
    assert _ats_score(finding) == _ats_score([])


def test_engine_accepts_optional_layout_xray():
    from app.analysis.engine import AnalysisEngine
    engine = AnalysisEngine([], [])
    ctx_plain = engine.run(CV_TEXT)                       # legacy call
    assert ctx_plain.layout_findings is None
    ctx_xray = engine.run(CV_TEXT, layout_xray={
        "available": True, "page_count": 1, "robot_lines": [],
        "findings": [],
    })
    assert ctx_xray.layout_findings == []
    ctx_unavailable = engine.run(
        CV_TEXT, layout_xray={"available": False, "reason": "plain_text"}
    )
    assert ctx_unavailable.layout_findings is None
