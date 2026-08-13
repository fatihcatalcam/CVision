# -*- coding: utf-8 -*-
"""Azerbaijani CVs are scored on the same terms as everyone else's.

Azeri users started arriving and the product was quietly broken for them: a
well-structured Azerbaijani CV scored 5% completeness with seven of its eight
sections invisible, and the language came back as English, so the AI wrote its
feedback in English too. Completeness carries 25% of the score, so this was
roughly 22 points taken off every Azeri CV for being Azeri.

The root cause was one character. normalize_text folds diacritics so ASCII
patterns can match, but the Azerbaijani schwa (ə, U+0259) does not decompose
under NFD and was not in the explicit fold table - the same class of problem
the Turkish dotless ı is in that table for. So "təhsil" stayed "təhsil" and
every pattern missed. Folding it to "e" alone took the CV from 5% to 35%.
"""

import pytest

from app.analysis.base_analyzer import AnalysisContext
from app.analysis.experience_evaluator import ExperienceEvaluator
from app.analysis.section_detector import SectionDetector
from app.analysis.suggestion_texts import SUGGESTION_TEXTS, SUPPORTED_LANGUAGES, texts_for
from app.analysis.text_utils import normalize_text
from app.services.ai_service import LANGUAGE_NAMES, detect_language


AZ_CV = """Aysel Məmmədova
Bakı, Azərbaycan | aysel@mail.com | +994 50 123 45 67

HAQQIMDA
Sosial layihələrdə və dövlət sektorunda praktiki təcrübəyə malik mütəxəssis.

İŞ TƏCRÜBƏSİ
ASAN xidmət mərkəzi — könüllü
2023 - davam edir
Vətəndaşlara sənəd hazırlanmasında dəstək göstərdim.

TƏHSİL
Bakalavr (2022 - 2026) Azərbaycan Dövlət İqtisadiyyat Universiteti

LAYİHƏLƏR
Gənclər üçün karyera seminarları təşkil etdim.

BACARIQLAR
Microsoft Office (Excel, Word, PowerPoint), SAP HR

DİLLƏR
Azərbaycan dili (ana dili), İngilis dili (B2)

SERTIFIKATLAR
Master №1 Microsoft Office proqramları
"""


# ── the schwa ─────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("word,folded", [
    ("Təhsil", "tehsil"),
    ("Təcrübə", "tecrube"),
    ("Bacarıqlar", "bacariqlar"),
    ("Dillər", "diller"),
    ("Layihələr", "layiheler"),
    ("Tələbə", "telebe"),
])
def test_the_schwa_folds_to_ascii(word, folded):
    """Without this every Azerbaijani pattern below is unreachable."""
    assert normalize_text(word) == folded


def test_folding_the_schwa_does_not_disturb_the_other_languages():
    assert normalize_text("Eğitim") == "egitim"          # tr
    assert normalize_text("Ausbildung") == "ausbildung"  # de
    assert normalize_text("Formación") == "formacion"    # es


# ── sections ──────────────────────────────────────────────────────────────────

def test_an_azerbaijani_cv_is_read_as_complete():
    """It used to score 5, with only "SERTIFIKATLAR" recognised."""
    ctx = AnalysisContext(extracted_text=AZ_CV)
    SectionDetector().analyze(ctx)

    assert ctx.completeness_score == 100.0


@pytest.mark.parametrize("heading,section", [
    ("TƏHSİL", "education"),
    ("İŞ TƏCRÜBƏSİ", "experience"),
    ("BACARIQLAR", "skills"),
    ("LAYİHƏLƏR", "projects"),
    ("HAQQIMDA", "summary"),
    ("DİLLƏR", "languages"),
    ("SERTIFIKATLAR", "certifications"),
    ("İSTİNADLAR", "references"),
])
def test_each_azerbaijani_heading_is_recognised(heading, section):
    ctx = AnalysisContext(
        extracted_text=f"{heading}\nBurada bölmənin məzmunu yazılır, kifayət qədər uzun.\n"
    )
    SectionDetector().analyze(ctx)

    assert ctx.detected_sections[section] is True


def test_the_stems_still_need_a_word_boundary():
    """The patterns are stems, so they must not fire inside a longer word - the
    "reactor operator makes a frontend developer" failure mode."""
    ctx = AnalysisContext(
        extracted_text="Mentehsilat bolmesi\nBir cumlede layiheci sozu kecir burada.\n"
    )
    SectionDetector().analyze(ctx)

    assert ctx.detected_sections["education"] is False
    assert ctx.detected_sections["projects"] is False


# ── language ──────────────────────────────────────────────────────────────────

def test_an_azerbaijani_cv_is_not_mistaken_for_english():
    assert detect_language(AZ_CV) == "az"
    assert LANGUAGE_NAMES["az"] == "Azerbaijani"


def test_azerbaijani_and_turkish_are_told_apart():
    """The two are close, and answering an Azeri CV in Turkish reads as a
    mistake to the person holding it. They differ exactly where a CV works:
    tecrube/tehsil/bacariq against deneyim/egitim/beceri."""
    tr_cv = (
        "HAKKIMDA\nSosyal projelerde deneyimli uzman.\n"
        "İŞ DENEYİMİ\nKamu kurumunda görev aldım.\n"
        "EĞİTİM\nLisans, İstanbul Üniversitesi\n"
        "BECERİLER\nMicrosoft Office\n"
    )

    assert detect_language(tr_cv) == "tr"
    assert detect_language(AZ_CV) == "az"


# ── experience ────────────────────────────────────────────────────────────────

def test_davam_edir_counts_as_an_open_date_range():
    """The Azerbaijani "still ongoing". Without it the role reads as a single
    year and the candidate loses the time they have actually worked."""
    ctx = AnalysisContext(extracted_text="İŞ TƏCRÜBƏSİ\nASAN xidmət\n2020 - davam edir\n")
    ExperienceEvaluator().analyze(ctx)

    assert ctx.total_years_experience >= 4


def test_an_azerbaijani_degree_is_not_counted_as_work():
    """Fresh graduates were getting years of "experience" from their own
    degree dates in the other languages; the same guard has to apply here."""
    ctx = AnalysisContext(
        extracted_text="TƏHSİL\nBakalavr, Azərbaycan Dövlət Universiteti\n2015 - 2019\n"
    )
    ExperienceEvaluator().analyze(ctx)

    assert ctx.total_years_experience == 0.0
    assert any("Education period" in e for e in ctx.experience_entries)


def test_an_azerbaijani_student_is_scored_on_the_student_curve():
    ctx = AnalysisContext(
        extracted_text="Tələbə\nTƏHSİL\nBakalavr\n2022 - hazırda\n"
    )
    ExperienceEvaluator().analyze(ctx)

    assert ctx.is_student is True


# ── rule-based suggestions ────────────────────────────────────────────────────

def test_azerbaijani_is_a_supported_suggestion_language():
    assert "az" in SUPPORTED_LANGUAGES


def test_the_azerbaijani_texts_cover_every_message():
    """A missing key would silently hand that one suggestion back in English,
    inside an otherwise Azerbaijani report."""
    assert set(SUGGESTION_TEXTS["az"]) == set(SUGGESTION_TEXTS["en"])


def test_the_azerbaijani_texts_are_actually_azerbaijani():
    az = texts_for("az")

    assert "Bacarıqlar" in az["skills_missing_general"]
    assert "Təhsil" in az["education_missing"]
    # And not a copy of the Turkish, which is the easy way to fake this.
    assert az["summary_missing"] != SUGGESTION_TEXTS["tr"]["summary_missing"]


def test_the_count_placeholder_survives_translation():
    """These are formatted with {count}; a translation that drops or renames it
    raises at render time, on a real user's report."""
    for key in ("skills_few_tech", "skills_few_general"):
        assert "{count}" in SUGGESTION_TEXTS["az"][key]
        SUGGESTION_TEXTS["az"][key].format(count=3)   # must not raise
