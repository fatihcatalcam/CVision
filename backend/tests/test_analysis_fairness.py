# -*- coding: utf-8 -*-
"""
Analysis engine accuracy & language-fairness regression tests.

Guards the three fixes from the 2026-07 scoring overhaul:
  1. Multilingual parity — the same CV in tr/de must score close to its
     English twin (sections, action verbs, seniority, "present" words).
  2. Experience calculation — overlapping date ranges merge instead of
     summing, and education-period dates don't count as work experience.
  3. Skill matching — C++/C#-style names are detected; no false 'C'.

These tests need no database: the engine takes plain skill/profile dicts.
"""

from datetime import datetime

from app.analysis.base_analyzer import AnalysisContext
from app.analysis.engine import AnalysisEngine
from app.analysis.experience_evaluator import ExperienceEvaluator, _merge_spans
from app.analysis.section_detector import SectionDetector
from app.analysis.skill_extractor import SkillExtractor
from app.analysis.text_utils import normalize_text
from app.seed.skills_data import SKILLS_DATA
from app.seed.role_profiles_data import ROLE_PROFILES_DATA


def _engine() -> AnalysisEngine:
    skills = [
        {"id": i, "name": s["name"], "category": s["category"]}
        for i, s in enumerate(SKILLS_DATA)
    ]
    profiles = [
        p for p in ROLE_PROFILES_DATA if p.get("domain") == "Software Engineering"
    ]
    return AnalysisEngine(skills, profiles)


CV_EN = """
John Smith
Email: john.smith@example.com | Phone: +1 555 123 4567

PROFESSIONAL SUMMARY
Senior software engineer with 6 years of experience building backend systems.

WORK EXPERIENCE
Senior Backend Developer | Acme Corp | Jan 2021 - Present
- Developed and maintained REST API microservices in Python and Node.js
- Led a team of 4 engineers; managed sprint planning in Agile

Software Engineer | Beta Ltd | 2019 - 2021
- Built frontend features with React and TypeScript

EDUCATION
BSc Computer Science, Bogazici University, 2015 - 2019

SKILLS
Python, JavaScript, TypeScript, C++, C#, SQL, React, Node.js, Docker, Git

PROJECTS
Open-source task queue library in Go

LANGUAGES
English (fluent), Turkish (native)
"""

CV_TR = """
Ahmet Yılmaz
E-posta: ahmet.yilmaz@example.com | Telefon: +90 532 123 4567

ÖZET
6 yıl deneyimli, backend sistemleri geliştiren kıdemli yazılım mühendisi.

İŞ DENEYİMİ
Kıdemli Backend Geliştirici | Acme Corp | Ocak 2021 - Devam ediyor
- Python ve Node.js ile REST API mikroservisleri geliştirdim ve sürdürdüm
- 4 kişilik mühendis ekibini yönettim; Agile sprint planlamasını yürüttüm

Yazılım Mühendisi | Beta Ltd | 2019 - 2021
- React ve TypeScript ile frontend özellikleri geliştirdim

EĞİTİM
Boğaziçi Üniversitesi, Bilgisayar Mühendisliği Lisans, 2015 - 2019

YETENEKLER
Python, JavaScript, TypeScript, C++, C#, SQL, React, Node.js, Docker, Git

PROJELER
Go ile açık kaynak task queue kütüphanesi

YABANCI DİL
İngilizce (akıcı), Türkçe (anadil)
"""

CV_DE = """
Max Mustermann
E-Mail: max.mustermann@example.com | Telefon: +49 170 1234567

PROFIL
Erfahrener Softwareentwickler mit 6 Jahren Erfahrung in Backend-Systemen.

BERUFSERFAHRUNG
Senior Backend-Entwickler | Acme GmbH | Januar 2021 - heute
- Entwicklung und Wartung von REST-API-Microservices mit Python und Node.js
- Leitung eines Teams von 4 Ingenieuren; Agile Sprint-Planung

Softwareentwickler | Beta GmbH | 2019 - 2021
- Frontend-Funktionen mit React und TypeScript entwickelt

AUSBILDUNG
BSc Informatik, TU Berlin, 2015 - 2019

KENNTNISSE
Python, JavaScript, TypeScript, C++, C#, SQL, React, Node.js, Docker, Git

PROJEKTE
Open-Source-Task-Queue-Bibliothek in Go

SPRACHEN
Deutsch (Muttersprache), Englisch (fliessend)
"""

CV_FRESH_GRAD = """
Fresh Graduate
Email: fresh.grad@example.com | Phone: +1 555 777 6666

SUMMARY
Recent computer science graduate seeking junior software engineer position.

EDUCATION
MSc Computer Science, MIT, 2023 - 2025
BSc Computer Science, Boston University, 2019 - 2023
High School Diploma, 2015 - 2019

EXPERIENCE
No professional work experience yet.

SKILLS
Python, SQL, Git
"""


# ── normalize_text ───────────────────────────────────────────────────────────

def test_normalize_text_turkish_casing_and_diacritics():
    # Dotted capital İ and dotless ı are the classic Python traps.
    assert normalize_text("İŞ DENEYİMİ") == "is deneyimi"
    assert normalize_text("EĞİTİM") == "egitim"
    assert normalize_text("YABANCI DİL") == "yabanci dil"


def test_normalize_text_german_spanish_french():
    assert normalize_text("Fähigkeiten größe") == "fahigkeiten grosse"
    assert normalize_text("Educación") == "educacion"
    assert normalize_text("Expérience professionnelle") == "experience professionnelle"


# ── skill extraction (C++/C# boundary fix) ──────────────────────────────────

def _extract(skills_text: str) -> set[str]:
    skills = [
        {"id": 1, "name": "C++", "category": "p"},
        {"id": 2, "name": "C#", "category": "p"},
        {"id": 3, "name": "C", "category": "p"},
        {"id": 4, "name": "Node.js", "category": "p"},
    ]
    ctx = AnalysisContext(extracted_text=skills_text)
    SkillExtractor(skills).analyze(ctx)
    return {s["skill_name"] for s in ctx.extracted_skills}


def test_cpp_and_csharp_are_detected():
    assert _extract("Skills: C++, C#, Node.js") == {"C++", "C#", "Node.js"}


def test_no_false_c_from_cpp():
    # 'C' must not be extracted from the C inside "C++" / "C#".
    assert "C" not in _extract("Skills: C++ and C# only")


def test_standalone_c_still_detected():
    assert "C" in _extract("Embedded development in C, plus scripting")


# ── experience calculation ───────────────────────────────────────────────────

def test_merge_spans_overlapping_ranges_do_not_double_count():
    # 2015-2023 + 2018-2023 + 2020-2023 is 8 years, not 16.
    assert _merge_spans([(2015, 2023), (2018, 2023), (2020, 2023)]) == 8.0
    assert _merge_spans([(2005, 2010), (2012, 2015)]) == 8.0  # disjoint sums
    assert _merge_spans([]) == 0.0


def test_education_dates_do_not_count_as_experience():
    ctx = AnalysisContext(extracted_text=CV_FRESH_GRAD)
    ExperienceEvaluator().analyze(ctx)
    assert ctx.total_years_experience == 0.0
    assert ctx.experience_score == 0.0


def test_turkish_present_and_explicit_years_detected():
    ctx = AnalysisContext(extracted_text=CV_TR)
    ExperienceEvaluator().analyze(ctx)
    # "Ocak 2021 - Devam ediyor" must count through the current year,
    # and "6 yıl deneyimli" must be seen as an explicit mention.
    expected_from_dates = float(datetime.now().year - 2019)  # merged 2019→now
    assert ctx.total_years_experience >= min(expected_from_dates, 6.0)
    assert any("Explicit mention: 6" in e for e in ctx.experience_entries)


# ── section detection across languages ───────────────────────────────────────

def _detected_sections(text: str) -> set[str]:
    ctx = AnalysisContext(extracted_text=text)
    SectionDetector().analyze(ctx)
    return {name for name, found in ctx.detected_sections.items() if found}


def test_turkish_sections_detected_including_suffixed_headers():
    found = _detected_sections(CV_TR)
    assert {"education", "experience", "skills", "projects", "summary",
            "languages"} <= found


def test_german_sections_detected():
    found = _detected_sections(CV_DE)
    assert {"education", "experience", "skills", "projects", "summary",
            "languages"} <= found


def test_spanish_and_french_section_headers_detected():
    es = _detected_sections(
        "Perfil\nExperiencia laboral\nFormación académica\n"
        "Habilidades\nProyectos\nIdiomas\nReferencias"
    )
    assert {"summary", "experience", "education", "skills", "projects",
            "languages", "references"} <= es

    fr = _detected_sections(
        "Profil\nExpérience professionnelle\nFormation\n"
        "Compétences\nProjets\nLangues\nRéférences"
    )
    assert {"summary", "experience", "education", "skills", "projects",
            "languages", "references"} <= fr


# ── end-to-end language parity ───────────────────────────────────────────────

def test_same_cv_scores_similarly_across_languages():
    """The same senior-engineer CV must not lose >6 points in tr/de vs en.

    Before the fairness fixes the gaps were −19.5 (tr) and −34 (de).
    The residual gap comes from English-only role-profile keywords
    (documented future work), bounded here so it can't regress.
    """
    engine = _engine()
    en = engine.run(CV_EN)
    tr = engine.run(CV_TR)
    de = engine.run(CV_DE)

    assert abs(en.overall_score - tr.overall_score) <= 6.0
    assert abs(en.overall_score - de.overall_score) <= 6.0

    # All three should recognize the senior profile's experience.
    for ctx in (en, tr, de):
        assert ctx.experience_score == 100.0
        assert ctx.completeness_score >= 80.0
