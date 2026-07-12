# -*- coding: utf-8 -*-
"""
AI-service language layer tests.

The app is live in 5 languages; the GPT layer must (1) detect the CV's
language so feedback comes back in that language, (2) keep the experience
section when truncating long CVs in any language, and (3) ground the user
prompt in the engine's verified findings. Pure functions — no OpenAI calls.
"""

from app.services.ai_service import (
    _build_user_prompt,
    _smart_truncate,
    detect_language,
    language_name,
)


# ── detect_language: all 5 languages ─────────────────────────────────────────

def test_detect_english():
    assert detect_language(
        "Professional Summary\nWork Experience\nEducation\nSkills\n"
        "University of Boston, degree in CS. Projects and languages listed."
    ) == "en"


def test_detect_turkish_with_diacritics():
    assert detect_language(
        "Özet\nİş Deneyimi\nEğitim\nYetenekler\nBoğaziçi mezunu, staj ve "
        "sertifika bilgileri. Kıdemli yazılım mühendisi."
    ) == "tr"


def test_detect_turkish_with_mangled_diacritics():
    # PDF extractors often strip diacritics; detection must survive it.
    assert detect_language(
        "Ozet\nIs Deneyimi\nEgitim\nYetenekler\nBogazici mezunu, staj ve "
        "sertifika bilgileri. Kidemli yazilim muhendisi."
    ) == "tr"


def test_detect_spanish():
    assert detect_language(
        "Perfil\nExperiencia laboral\nFormación académica\nHabilidades\n"
        "Universidad de Madrid. Proyectos, idiomas y referencias. "
        "Objetivo: empleo de desarrollador."
    ) == "es"


def test_detect_german():
    assert detect_language(
        "Profil\nBerufserfahrung\nAusbildung\nKenntnisse\nHochschule "
        "München, Studium der Informatik. Projekte, Sprachen, Referenzen. "
        "Praktikum bei Siemens, Abschluss 2020."
    ) == "de"


def test_detect_french():
    assert detect_language(
        "Profil\nExpérience professionnelle\nFormation\nCompétences\n"
        "Diplôme d'ingénieur. Projets, langues, stage chez Airbus. "
        "Objectif : développeur. Parcours réalisé avec maîtrise."
    ) == "fr"


def test_language_name_mapping():
    assert language_name("tr") == "Turkish"
    assert language_name("de") == "German"
    assert language_name("xx") == "English"  # unknown → safe default


# ── _smart_truncate: experience anchors in all languages ────────────────────

def _long_cv(header: str, exp_marker: str) -> str:
    filler = "Lorem ipsum dolor sit amet. " * 100  # ~2800 chars of noise
    body = f"{exp_marker}\nSenior Developer at Acme, 2019 - 2023\n" + (
        "Did impactful work on production systems. " * 60
    )
    return f"{header}\n\n{filler}\n\n{body}"


def test_truncate_keeps_german_experience_section():
    cv = _long_cv("Max Mustermann\nmax@example.com", "Berufserfahrung")
    out = _smart_truncate(cv, max_chars=4000)
    assert "berufserfahrung" in out.lower()
    assert "[...]" in out  # anchored, not plain-truncated


def test_truncate_keeps_spanish_experience_section():
    cv = _long_cv("Ana García\nana@example.com", "Experiencia laboral")
    out = _smart_truncate(cv, max_chars=4000)
    assert "experiencia laboral" in out.lower()


# ── _build_user_prompt: engine findings + language reinforcement ────────────

def test_user_prompt_includes_engine_findings_and_language_reminder():
    prompt = _build_user_prompt(
        cv_text="Some CV text",
        scores={"overall_score": 70},
        target_domain="Software Engineering",
        role_profiles=[{"title": "Backend Developer"}],
        rule_based_suggestions=[{"message": "Add a summary section"}],
        lang_name="German",
        extracted_skills=["Python", "Docker", "C++"],
        missing_sections=["projects", "languages"],
    )
    assert "Verified skills detected in the CV: Python, Docker, C++" in prompt
    assert "projects, languages" in prompt
    # The language directive appears both at the top and as a closing reminder.
    assert prompt.count("German") >= 3
    assert "FORMAT templates only" in prompt


def test_user_prompt_omits_findings_block_when_empty():
    prompt = _build_user_prompt(
        cv_text="Some CV text",
        scores={},
        target_domain=None,
        role_profiles=None,
        rule_based_suggestions=[],
        lang_name="English",
    )
    assert "ENGINE FINDINGS" not in prompt
