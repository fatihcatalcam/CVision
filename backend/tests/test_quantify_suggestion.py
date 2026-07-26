# -*- coding: utf-8 -*-
"""The 'quantify your achievements' suggestion must be conditional.

It used to be appended on EVERY analysis. The highlight path needed English
action verbs, so every Turkish CV (~80% of traffic) fell through to the generic
"quantify your achievements" wording - even a CV already full of %40 / 1000+ /
5 kişi metrics. Founder feedback: it shows up far too often and reads as generic.

Now it only appears when the CV genuinely lacks quantification, in any language.
"""

from app.analysis.suggestion_generator import SuggestionGenerator
from app.analysis.base_analyzer import AnalysisContext


def _quantify_suggestions(text: str, language: str = "tr", tech: bool = True):
    ctx = AnalysisContext(extracted_text=text)
    ctx.detected_sections = {
        "summary": True, "skills": True, "experience": True,
        "education": True, "projects": True, "certifications": True,
    }
    ctx.ats_issues = []
    ctx.extracted_skills = [{"skill_name": "Python", "skill_category": "programming"}] * 8
    ctx.keyword_score = 80.0
    ctx.experience_score = 80.0
    domain = "Software Engineering" if tech else "Legal"
    SuggestionGenerator(target_domain=domain, language=language).analyze(ctx)
    return [s for s in ctx.suggestions if s["category"] == "experience"]


WELL_QUANTIFIED_TR = """
DENEYIM
Backend Gelistirici - Acme (2022-2024)
- API yanit suresini %40 iyilestirdim, gunluk 1000+ kullaniciya hizmet verdim
- 5 kisilik ekibi yonettim, 12 proje teslim ettim
- Hata oranini %60 azalttim, geliri %25 artirdim
"""

WELL_QUANTIFIED_EN = """
EXPERIENCE
Backend Developer - Acme (2022-2024)
- Improved API response time by 40%, served 1000+ daily users
- Managed a team of 5, delivered 12 projects
- Reduced error rate by 60%, grew revenue by 25%
"""

UNQUANTIFIED_TR = """
DENEYIM
Backend Gelistirici - Acme
- Sunucu tarafi gelistirme yaptim ve API'lar uzerinde calistim
- Ekip icinde yer aldim ve projelere katki sagladim
- Veritabani yonetiminden sorumluydum
"""


def test_well_quantified_turkish_cv_gets_no_quantify_suggestion():
    assert _quantify_suggestions(WELL_QUANTIFIED_TR) == [], (
        "a CV already full of metrics must not be told to quantify"
    )


def test_well_quantified_english_cv_gets_no_quantify_suggestion():
    assert _quantify_suggestions(WELL_QUANTIFIED_EN) == []


def test_unquantified_cv_still_gets_the_suggestion():
    sugg = _quantify_suggestions(UNQUANTIFIED_TR)
    assert len(sugg) == 1, "a CV with no metrics should be nudged to quantify"


def test_unquantified_english_cv_highlights_specific_lines():
    text = """
EXPERIENCE
Backend Developer
- Developed a payment service used across the company
- Managed the migration to a new database
- Led the on-call rotation for the team
"""
    sugg = _quantify_suggestions(text, language="en")
    assert len(sugg) == 1
    # English action-verb lines without numbers are highlighted specifically.
    assert sugg[0]["snippets"], "unquantified action-verb lines should be highlighted"
