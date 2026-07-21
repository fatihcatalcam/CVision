# -*- coding: utf-8 -*-
"""The rule-based suggestions must follow the UI language.

They were hardcoded in English, so a Turkish user reading a Turkish UI saw the
AI half of the analysis in Turkish and the deterministic half in English. These
guards lock in that every language is complete, that the generator emits the
requested language, and that an unknown language degrades to English rather than
raising.
"""

import pytest

from app.analysis.base_analyzer import AnalysisContext
from app.analysis.engine import AnalysisEngine
from app.analysis.suggestion_generator import SuggestionGenerator
from app.analysis.suggestion_texts import SUGGESTION_TEXTS, SUPPORTED_LANGUAGES, texts_for
from app.seed.role_profiles_data import ROLE_PROFILES_DATA
from app.seed.skills_data import SKILLS_DATA

# A CV missing every section, guaranteed to trigger a fixed set of suggestions
# regardless of language.
BARE_CV = "John Doe\nSome text without any recognizable sections at all.\n"


def _context(text: str = BARE_CV) -> AnalysisContext:
    ctx = AnalysisContext(extracted_text=text)
    ctx.detected_sections = {}
    ctx.ats_issues = []
    ctx.extracted_skills = []
    ctx.keyword_score = 0.0
    ctx.experience_score = 0.0
    return ctx


def _messages(language: str, target_domain: str | None = None) -> list[str]:
    ctx = _context()
    SuggestionGenerator(target_domain=target_domain, language=language).analyze(ctx)
    return [s["message"] for s in ctx.suggestions]


def test_every_language_has_the_same_keys_as_english():
    english_keys = set(SUGGESTION_TEXTS["en"])
    for lang in SUPPORTED_LANGUAGES:
        assert set(SUGGESTION_TEXTS[lang]) == english_keys, (
            f"{lang} is missing/extra keys: "
            f"missing={english_keys - set(SUGGESTION_TEXTS[lang])}, "
            f"extra={set(SUGGESTION_TEXTS[lang]) - english_keys}"
        )


def test_no_message_is_left_empty():
    for lang in SUPPORTED_LANGUAGES:
        for key, text in SUGGESTION_TEXTS[lang].items():
            assert text and text.strip(), f"{lang}/{key} is empty"


def test_count_placeholder_is_preserved_in_every_language():
    # skills_few_* interpolate {count}; a translation that dropped the token
    # would raise KeyError at format time or silently show nothing.
    for lang in SUPPORTED_LANGUAGES:
        for key in ("skills_few_tech", "skills_few_general"):
            assert "{count}" in SUGGESTION_TEXTS[lang][key], f"{lang}/{key} lost {{count}}"


def test_turkish_generator_emits_turkish_text():
    messages = " ".join(_messages("tr"))
    # A distinctive Turkish phrase from the summary suggestion.
    assert "Kariyer Hedefi" in messages
    # And nothing leaked from the English table.
    assert "Professional Summary" not in messages


def test_each_language_emits_its_own_text():
    markers = {
        "en": "Professional Summary",
        "tr": "Kariyer Hedefi",
        "de": "beruflichen",
        "fr": "Objectif professionnel",
        "es": "Objetivo profesional",
    }
    for lang, marker in markers.items():
        joined = " ".join(_messages(lang))
        assert marker in joined, f"{lang} did not emit its own marker {marker!r}"


def test_unknown_language_falls_back_to_english():
    assert texts_for("xx") is SUGGESTION_TEXTS["en"]
    assert texts_for(None) is SUGGESTION_TEXTS["en"]
    # And the generator does not raise on a bad language.
    messages = _messages("klingon")
    assert any("Professional Summary" in m for m in messages)


def test_default_language_is_english_unchanged():
    # Omitting the language argument must reproduce today's English output,
    # so existing callers are unaffected.
    ctx = _context()
    SuggestionGenerator().analyze(ctx)
    joined = " ".join(s["message"] for s in ctx.suggestions)
    assert "Professional Summary" in joined


def test_skills_few_count_is_interpolated():
    ctx = _context()
    ctx.extracted_skills = [
        {"skill_name": "Python", "skill_category": "programming"}
    ]  # 1 skill -> triggers skills_few
    SuggestionGenerator(target_domain="Software Engineering", language="tr").analyze(ctx)
    joined = " ".join(s["message"] for s in ctx.suggestions)
    assert "Yalnızca 1 tanınan beceri" in joined
    assert "{count}" not in joined  # placeholder must be resolved


def test_engine_threads_language_into_suggestions():
    skills = [
        {"id": i, "name": s["name"], "category": s["category"]}
        for i, s in enumerate(SKILLS_DATA)
    ]
    profiles = [dict(p, id=i) for i, p in enumerate(ROLE_PROFILES_DATA)]
    ctx = AnalysisEngine(skills, profiles, "Other", language="tr").run(BARE_CV)
    joined = " ".join(s["message"] for s in ctx.suggestions)
    assert "Kariyer Hedefi" in joined
