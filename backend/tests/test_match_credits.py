# -*- coding: utf-8 -*-
"""Matching a CV against a job ad costs credits, and it costs two of them.

This one was the last real Pro gate. The backend already charged credits for it,
but every route into the feature was hidden behind `plan_type != "premium"` -
the dashboard button, the analysis page section and the match page itself, which
redirected free users to /pricing. So the price existed and almost nobody could
reach it.

The gate is gone. The price is the gate now, and it is 2 rather than 1: a match
is a second full AI pass over the CV plus the ad, and it is the thing people run
once per application.

The "one credit is not enough" test is what pins the number down. Everything else
here would still pass at a price of 1.
"""

import pytest

from app.config import settings
from app.models.credit_transaction import CreditTransaction
from app.models.job_description import JobDescription
from app.services.credit_service import CreditService
from app.utils.hashids import encode_id


AI_RESULT = {
    "match_score": 71,
    "summary": "Reasonable fit.",
    "matched_keywords": ["python"],
    "missing_keywords": ["kubernetes"],
    "gap_analysis": [],
}


@pytest.fixture
def ai_on(monkeypatch):
    """match.py imports both names directly, so patching app.services.ai_service
    would leave the router's own references untouched."""
    import app.routers.match as match_router

    monkeypatch.setattr(match_router, "is_ai_enabled", lambda: True)
    monkeypatch.setattr(
        match_router, "ai_match_cv_jd", lambda cv_text, jd_text: dict(AI_RESULT)
    )
    return match_router


@pytest.fixture
def make_jd(db_session):
    def _make(owner, raw_text="We need a Python engineer with Kubernetes."):
        jd = JobDescription(user_id=owner.id, raw_text=raw_text, title="Engineer")
        db_session.add(jd)
        db_session.commit()
        db_session.refresh(jd)
        return jd

    return _make


def _ledger(db, user_id):
    return (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user_id)
        .order_by(CreditTransaction.id)
        .all()
    )


def _balance(db, user):
    db.expire_all()
    return db.get(type(user), user.id).credits


def _post_match(client, auth_headers, user, cv, jd):
    return client.post(
        "/match/",
        json={"cv_id": encode_id(cv.id), "jd_id": encode_id(jd.id)},
        headers=auth_headers(user),
    )


# ── the price ─────────────────────────────────────────────────────────────────

def test_a_match_costs_two_credits(
    client, make_user, auth_headers, make_cv, make_jd, db_session, ai_on
):
    user = make_user(email="match@test.com")
    CreditService.grant(db_session, user, 5, "grant_signup")
    cv = make_cv(user, extracted_text="Python engineer, five years.")
    jd = make_jd(user)

    resp = _post_match(client, auth_headers, user, cv, jd)

    assert resp.status_code == 201
    assert _balance(db_session, user) == 5 - 2
    assert _ledger(db_session, user.id)[-1].reason == "spend_match"


def test_one_credit_is_not_enough(
    client, make_user, auth_headers, make_cv, make_jd, db_session, ai_on
):
    """The test that fails if the price drifts back down to a single credit."""
    user = make_user(email="matchpoor@test.com")
    CreditService.grant(db_session, user, 1, "grant_signup")
    cv = make_cv(user, extracted_text="Python engineer, five years.")
    jd = make_jd(user)

    resp = _post_match(client, auth_headers, user, cv, jd)

    assert resp.status_code == 402
    assert _balance(db_session, user) == 1


def test_the_frontend_and_the_server_quote_the_same_price():
    """frontend/src/constants/credits.ts states MATCH_COST to the user before
    they spend anything. A price the two disagree on is a 402 with no
    explanation."""
    from pathlib import Path

    source = (
        Path(__file__).resolve().parents[2]
        / "frontend" / "src" / "constants" / "credits.ts"
    ).read_text(encoding="utf-8")

    assert f"export const MATCH_COST = {settings.CREDIT_MATCH};" in source


# ── the gate is gone ──────────────────────────────────────────────────────────

def test_a_free_plan_user_with_credits_can_match(
    client, make_user, auth_headers, make_cv, make_jd, db_session, ai_on
):
    """The whole point of the change: no plan, just a balance."""
    user = make_user(email="matchfree@test.com", plan_type="free")
    CreditService.grant(db_session, user, 2, "grant_signup")
    cv = make_cv(user, extracted_text="Python engineer, five years.")
    jd = make_jd(user)

    assert _post_match(client, auth_headers, user, cv, jd).status_code == 201


def test_a_premium_flag_does_not_pay_for_it(
    client, make_user, auth_headers, make_cv, make_jd, db_session, ai_on
):
    """And the leftover flag buys nothing, so the two currencies stay one."""
    user = make_user(email="matchpremium@test.com", plan_type="premium")
    cv = make_cv(user, extracted_text="Python engineer, five years.")
    jd = make_jd(user)

    assert _post_match(client, auth_headers, user, cv, jd).status_code == 402


# ── failures are refunded ─────────────────────────────────────────────────────

def test_a_failed_match_gives_the_credits_back(
    client, make_user, auth_headers, make_cv, make_jd, db_session, monkeypatch, ai_on
):
    monkeypatch.setattr(ai_on, "ai_match_cv_jd", lambda cv_text, jd_text: None)

    user = make_user(email="matchfail@test.com")
    CreditService.grant(db_session, user, 5, "grant_signup")
    cv = make_cv(user, extracted_text="Python engineer, five years.")
    jd = make_jd(user)

    resp = _post_match(client, auth_headers, user, cv, jd)

    assert resp.status_code == 502
    assert _balance(db_session, user) == 5
    assert [r.reason for r in _ledger(db_session, user.id)][-2:] == [
        "spend_match", "refund_failed_match"
    ]


def test_a_jd_you_do_not_own_costs_nothing(
    client, make_user, auth_headers, make_cv, make_jd, db_session, ai_on
):
    """Validation before the charge: a rejected request must be free."""
    user = make_user(email="matchmine@test.com")
    other = make_user(email="matchtheirs@test.com")
    CreditService.grant(db_session, user, 5, "grant_signup")
    cv = make_cv(user, extracted_text="Python engineer, five years.")
    jd = make_jd(other)

    resp = _post_match(client, auth_headers, user, cv, jd)

    assert resp.status_code == 404
    assert _balance(db_session, user) == 5
    assert [r.reason for r in _ledger(db_session, user.id)] == ["grant_signup"]
