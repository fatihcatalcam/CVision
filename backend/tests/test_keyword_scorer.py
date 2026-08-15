# -*- coding: utf-8 -*-
"""Keyword matching against role profiles, tested directly.

Like score_calculator, this module was never named in a test - it ran only as a
step inside whole-engine runs. It feeds 15% of the overall score and the
"Keyword Relevance" ring the user sees, and it is the component most exposed to
bad data: profiles seeded with no keywords, or a deployment with no profiles at
all, both of which silently produce a zero rather than an error.
"""

from app.analysis.base_analyzer import AnalysisContext
from app.analysis.keyword_scorer import KeywordScorer


BACKEND = {
    "title": "Backend Developer",
    "expected_keywords": [
        "python", "fastapi", "rest api", "postgresql", "docker",
        "redis", "microservices", "ci/cd", "kubernetes", "testing",
    ],
}
FRONTEND = {
    "title": "Frontend Developer",
    "expected_keywords": ["react", "typescript", "css", "webpack", "accessibility"],
}


def _score(text: str, profiles: list[dict]) -> AnalysisContext:
    ctx = AnalysisContext(extracted_text=text)
    KeywordScorer(profiles).analyze(ctx)
    return ctx


# ── the score ─────────────────────────────────────────────────────────────────

def test_a_cv_full_of_the_expected_terms_scores_high():
    ctx = _score(
        "Built Python and FastAPI services with a REST API over PostgreSQL, "
        "deployed in Docker with Redis caching, microservices, CI/CD, "
        "Kubernetes and automated testing.",
        [BACKEND],
    )

    assert ctx.keyword_score == 100.0


def test_a_cv_with_none_of_them_scores_zero():
    ctx = _score("Managed the front desk and answered the telephone.", [BACKEND])

    assert ctx.keyword_score == 0.0


def test_partial_coverage_scores_in_between():
    ctx = _score("Python and Docker experience.", [BACKEND])

    assert 0 < ctx.keyword_score < 100


def test_the_best_matching_profile_decides_the_score():
    """A CV should be judged against the role it actually fits, not dragged
    down by every other profile in the database."""
    ctx = _score(
        "React, TypeScript, CSS, Webpack and accessibility work on a design system.",
        [BACKEND, FRONTEND],
    )

    assert ctx.keyword_score == 100.0          # perfect on Frontend
    assert ctx.keyword_matches["Backend Developer"] == []


def test_matches_are_recorded_per_profile():
    """These drive the career-match explanations, so they have to be real."""
    ctx = _score("Python and PostgreSQL, plus some React.", [BACKEND, FRONTEND])

    assert set(ctx.keyword_matches["Backend Developer"]) == {"python", "postgresql"}
    assert ctx.keyword_matches["Frontend Developer"] == ["react"]


# ── matching rules ────────────────────────────────────────────────────────────

def test_matching_ignores_case():
    assert _score("PYTHON, FastAPI, Docker", [BACKEND]).keyword_score > 0


def test_a_keyword_inside_a_longer_word_does_not_count():
    """Whole-word matching. Otherwise "reactor operator" makes a frontend
    developer, and every score built on that is noise."""
    ctx = _score("Worked as a reactor operator in a power plant.", [FRONTEND])

    assert ctx.keyword_matches["Frontend Developer"] == []


def test_multi_word_keywords_match():
    ctx = _score("Designed a REST API for the billing system.", [BACKEND])

    assert "rest api" in ctx.keyword_matches["Backend Developer"]


def test_a_keyword_with_regex_characters_is_matched_literally():
    """'ci/cd' and 'c++' contain characters a regex would otherwise interpret;
    an unescaped one is a crash on a real CV, not a wrong score."""
    ctx = _score("Owned the CI/CD pipeline end to end.", [BACKEND])

    assert "ci/cd" in ctx.keyword_matches["Backend Developer"]


def test_a_plus_in_a_keyword_does_not_raise():
    profile = {"title": "C++ Engineer", "expected_keywords": ["c++", "stl"]}

    ctx = _score("Ten years of C++ and STL work.", [profile])

    assert ctx.keyword_score > 0


# ── bad data must not take the pipeline down ──────────────────────────────────

def test_no_profiles_scores_zero_without_raising():
    """A deployment that has not been seeded still has to return a report."""
    assert _score("Python, Docker, FastAPI", []).keyword_score == 0.0


def test_profiles_with_no_keywords_score_zero_without_raising():
    empty = {"title": "Unseeded Role", "expected_keywords": []}

    assert _score("Python, Docker, FastAPI", [empty]).keyword_score == 0.0


def test_a_profile_missing_the_field_is_skipped_not_fatal():
    broken = {"title": "Broken Role"}

    ctx = _score("Python and FastAPI.", [broken, BACKEND])

    assert ctx.keyword_score > 0


def test_the_denominator_is_capped_so_long_profiles_stay_reachable():
    """A profile listing 40 keywords must not be unscoreable: the cap means ten
    good matches is full marks, not a quarter of them."""
    long_profile = {
        "title": "Everything Role",
        "expected_keywords": [f"skill{i}" for i in range(40)],
    }
    text = " ".join(f"skill{i}" for i in range(10))

    assert _score(text, [long_profile]).keyword_score == 100.0


# ── the language penalty ──────────────────────────────────────────────────────
#
# The 889 keywords across the seeded role profiles are entirely English, and
# until ai_keywords existed this class looked for them with a word-boundary
# regex over the raw CV text. A Turkish accountant writing "muhasebe, mizan,
# mutabakat, vergi, denetim" matched none of "accounting, ledger,
# reconciliation, tax, audit" and scored a flat zero.
#
# Measured on 87 real analyses before the fix: median keyword score 30/100, one
# CV in seven scoring an exact zero, and 47% matching no role profile at all -
# which also meant no career recommendation, because the recommender reads
# these same matches. Software CVs were the exception only because their
# vocabulary is English wherever it is written.

ACCOUNTANT = {
    "title": "Accountant",
    "expected_keywords": [
        "accounting", "ledger", "reconciliation", "tax", "audit",
        "balance sheet", "journal", "compliance", "payroll", "invoice",
    ],
}

TURKISH_ACCOUNTANT_CV = (
    "Muhasebe departmaninda calistim. Mizan ve mutabakat islemlerini yuruttum, "
    "vergi beyannamelerini hazirladim, denetim sureclerine katildim, bordro ve "
    "fatura kayitlarini tuttum."
)


def _score_with_ai(text: str, profiles: list[dict], ai_keywords):
    ctx = AnalysisContext(extracted_text=text)
    KeywordScorer(profiles, ai_keywords).analyze(ctx)
    return ctx


def test_a_turkish_cv_scores_zero_without_the_ai_list():
    """The behaviour being fixed, pinned so the reason stays visible."""
    ctx = _score(TURKISH_ACCOUNTANT_CV, [ACCOUNTANT])

    assert ctx.keyword_score == 0.0
    assert ctx.keyword_matches["Accountant"] == []


def test_the_ai_list_lets_the_same_cv_match():
    ctx = _score_with_ai(
        TURKISH_ACCOUNTANT_CV,
        [ACCOUNTANT],
        ["accounting", "ledger", "reconciliation", "tax", "audit", "payroll"],
    )

    assert ctx.keyword_score == 60.0
    assert set(ctx.keyword_matches["Accountant"]) == {
        "accounting", "ledger", "reconciliation", "tax", "audit", "payroll",
    }


def test_the_two_routes_are_merged_not_replaced():
    """The regex still counts. It is the reliable half for terms that survive
    translation - a Turkish CV says "Python" and "SAP" too - so the AI must add
    to it rather than stand in for it."""
    ctx = _score_with_ai(
        "Muhasebe kayitlarini SAP uzerinde tuttum. Compliance raporlari hazirladim.",
        [ACCOUNTANT],
        ["accounting", "ledger"],
    )

    # "compliance" came from the text, the other two only from the AI.
    assert set(ctx.keyword_matches["Accountant"]) == {
        "compliance", "accounting", "ledger",
    }


def test_no_ai_list_is_exactly_the_old_behaviour():
    """None means the AI was unavailable - off, out of quota, API down. The
    analysis must still run, on the regex alone."""
    english = "Accounting and ledger reconciliation, tax and audit work."

    assert _score(english, [ACCOUNTANT]).keyword_score == (
        _score_with_ai(english, [ACCOUNTANT], None).keyword_score
    )


def test_the_ai_cannot_invent_keywords_outside_the_profile():
    """The model is told to answer only from the vocabulary, but a stray term
    must not be able to inflate a profile it does not belong to."""
    ctx = _score_with_ai(
        TURKISH_ACCOUNTANT_CV,
        [ACCOUNTANT],
        ["accounting", "kubernetes", "react", "photosynthesis"],
    )

    assert ctx.keyword_matches["Accountant"] == ["accounting"]
    assert ctx.keyword_score == 10.0


def test_matching_is_case_insensitive_on_the_ai_side():
    ctx = _score_with_ai(
        TURKISH_ACCOUNTANT_CV, [ACCOUNTANT], ["Accounting", "LEDGER", "Tax"]
    )

    assert set(ctx.keyword_matches["Accountant"]) == {"accounting", "ledger", "tax"}
