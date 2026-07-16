# -*- coding: utf-8 -*-
"""Language parity: the same CV must score the same in any language.

The seed dictionary is 100% English - 234 skills and ~600 role keywords, not
one Turkish word among them (`grep -c "ı|ş|ğ|ü|ö|ç" app/seed/*.py` -> 0). Only
proper nouns (Python, AutoCAD) survive translation, so a Turkish CV used to
yield 4 skills where its English twin yielded 9, scoring 46.0% against 65.5%
for the same person. That penalty hit the headline ATS score too, since
ScoreCalculator's relevant-vs-other split reads extracted_skills.

The fix does not translate the dictionary. The AI maps whatever language the
CV is written in onto the canonical English skill names, and its findings are
merged with the regex extractor's. The regex stays authoritative for proper
nouns; the AI covers the rest. If the AI is unavailable the union collapses to
the regex result, i.e. exactly today's behaviour - never worse.
"""

from app.analysis.engine import AnalysisEngine
from app.seed.role_profiles_data import ROLE_PROFILES_DATA
from app.seed.skills_data import SKILLS_DATA

SKILLS = [
    {"id": i, "name": s["name"], "category": s["category"]}
    for i, s in enumerate(SKILLS_DATA)
]
PROFILES = [
    dict(p, id=i)
    for i, p in enumerate(ROLE_PROFILES_DATA)
    if p.get("domain") == "Software Engineering"
]

CV_TR = """Yazilim Muhendisi. Backend gelistirme uzerine calisiyorum.
Python, Django, PostgreSQL ve Docker kullaniyorum. Veritabani yonetimi,
sunucu tarafi mantik, REST servisleri gelistirdim. Takim calismasina yatkinim,
iletisim becerilerim guclu. Problem cozme yetenegim yuksek. Cevik metodoloji
ile calistim. Birim testleri yaziyorum.
"""

CV_EN = """Software Engineer. I work on backend development.
I use Python, Django, PostgreSQL and Docker. Database management, server-side
logic, REST API services. Teamwork, strong Communication skills. Problem
Solving. Agile methodology. I write Unit Testing.
"""

# What a working AI returns for each CV: the same canonical English skills,
# because it reads meaning rather than matching strings.
CANONICAL = [
    "Python", "Django", "PostgreSQL", "Docker", "REST API",
    "Teamwork", "Communication", "Problem Solving", "Agile", "Unit Testing",
]


def _skill_names(ctx) -> set[str]:
    return {s["skill_name"] for s in ctx.extracted_skills}


def test_ai_normalized_skills_make_turkish_and_english_equivalent():
    tr = AnalysisEngine(SKILLS, PROFILES, ai_skills=CANONICAL).run(CV_TR)
    en = AnalysisEngine(SKILLS, PROFILES, ai_skills=CANONICAL).run(CV_EN)

    assert _skill_names(tr) == _skill_names(en), (
        "same CV in two languages produced different skills: "
        f"TR-only={_skill_names(tr) - _skill_names(en)}, "
        f"EN-only={_skill_names(en) - _skill_names(tr)}"
    )
    assert abs(tr.ats_score - en.ats_score) <= 2.0, (
        f"ATS score is language-biased: TR={tr.ats_score} vs EN={en.ats_score}"
    )


def test_ai_skills_are_merged_with_regex_not_replacing_it():
    """The regex stays authoritative for proper nouns the AI might miss."""
    ctx = AnalysisEngine(SKILLS, PROFILES, ai_skills=["Communication"]).run(CV_TR)
    names = _skill_names(ctx)

    assert "Communication" in names, "AI-supplied skill missing"
    assert "Python" in names, "regex-extracted skill was dropped by the merge"


def test_without_ai_behaviour_is_unchanged():
    """The fallback path: no AI means exactly today's regex-only result."""
    before = AnalysisEngine(SKILLS, PROFILES).run(CV_TR)
    explicit_none = AnalysisEngine(SKILLS, PROFILES, ai_skills=None).run(CV_TR)

    assert _skill_names(before) == _skill_names(explicit_none)
    # Turkish still under-extracts without AI - that is the bug being fixed,
    # and this test documents that the fallback does not paper over it.
    assert "Communication" not in _skill_names(before)


def test_unknown_ai_skill_names_are_ignored():
    """The AI must not be able to invent skills outside the dictionary."""
    ctx = AnalysisEngine(
        SKILLS, PROFILES, ai_skills=["Python", "Totally Made Up Skill", "Wizardry"]
    ).run(CV_TR)
    names = _skill_names(ctx)

    assert "Totally Made Up Skill" not in names
    assert "Wizardry" not in names
    assert "Python" in names
