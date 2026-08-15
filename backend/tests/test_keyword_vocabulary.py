# -*- coding: utf-8 -*-
"""The vocabulary handed to the AI keyword normalizer.

It has to be exactly what KeywordScorer will later look for. A term the model
is allowed to return but no profile expects can never match; a term no profile
shows it is a concept it cannot report. And the list is a static prompt prefix,
so its ORDER decides whether OpenAI's prompt cache can reuse it across every
analysis or whether each one pays full price for ~889 terms.
"""

from app.services.analysis_service import _keyword_vocabulary


PROFILES = [
    {"title": "Accountant", "expected_keywords": ["ledger", "tax", "audit"]},
    {"title": "Auditor", "expected_keywords": ["audit", "compliance", "tax"]},
    {"title": "Empty", "expected_keywords": []},
    {"title": "Missing"},
    {"title": "Null", "expected_keywords": None},
]


def test_it_collects_every_keyword_once():
    assert _keyword_vocabulary(PROFILES) == [
        "audit", "compliance", "ledger", "tax",
    ]


def test_it_is_stable_across_calls():
    # A set's iteration order is not guaranteed between processes. If this list
    # is not sorted, the prompt prefix differs per request and the cache misses
    # on every single analysis.
    assert _keyword_vocabulary(PROFILES) == sorted(_keyword_vocabulary(PROFILES))


def test_it_survives_profiles_with_no_keywords():
    # Seeded data has been wrong before. A missing or null list must not take
    # the analysis down - the scorer already treats those profiles as skippable.
    assert _keyword_vocabulary([{"title": "X"}]) == []
    assert _keyword_vocabulary([]) == []


def test_it_drops_blanks_rather_than_offering_them_as_answers():
    profiles = [{"title": "X", "expected_keywords": ["  ", "", "ledger  ", 7]}]

    assert _keyword_vocabulary(profiles) == ["ledger"]


def test_the_real_seed_produces_a_usable_vocabulary():
    from app.seed.role_profiles_data import ROLE_PROFILES_DATA

    vocab = _keyword_vocabulary(ROLE_PROFILES_DATA)

    assert len(vocab) > 500, "the seed should carry a broad vocabulary"
    assert all(v == v.strip() and v for v in vocab)
