# -*- coding: utf-8 -*-
"""Match, cover letter and bullet rewrite are priced in credits, not gated by plan.

These three were behind `plan_type != "premium"`, which meant a user could hold
credits and still be told a feature was "for Pro users" - two currencies, and the
support burden that comes with them. They now cost credits like everything else.

Two rules run through all of them:

  - Validation first, charge second. A request that names a CV you do not own
    must cost nothing.
  - A failure on our side is refunded. The user pays for a cover letter, not for
    an attempt at one.

Reading back something already generated stays free. Charging to re-open your own
cover letter would be indefensible.
"""

import pytest

from app.config import settings
from app.models.credit_transaction import CreditTransaction
from app.services.credit_service import CreditService
from app.utils.hashids import encode_id


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


@pytest.fixture
def ai_on(monkeypatch):
    """The three endpoints refuse with 503 unless AI is enabled."""
    import app.services.ai_service as ai
    monkeypatch.setattr(ai, "is_ai_enabled", lambda: True)
    return ai


# ── bullet rewrite ────────────────────────────────────────────────────────────

def test_rewrite_costs_a_credit(client, make_user, auth_headers, db_session, monkeypatch):
    import app.services.ai_service as ai
    monkeypatch.setattr(ai, "is_ai_enabled", lambda: True)
    monkeypatch.setattr(ai, "ai_rewrite_bullet", lambda **kw: "Rewritten bullet")

    user = make_user(email="rw@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")

    resp = client.post(
        "/analysis/rewrite-bullet",
        json={"bullet_text": "Did some work", "cv_context": "", "target_role": "Engineer"},
        headers=auth_headers(user),
    )

    assert resp.status_code == 200
    assert _balance(db_session, user) == 3 - settings.CREDIT_REWRITE
    assert _ledger(db_session, user.id)[-1].reason == "spend_rewrite"


def test_a_failed_rewrite_is_refunded(
    client, make_user, auth_headers, db_session, monkeypatch
):
    import app.services.ai_service as ai
    monkeypatch.setattr(ai, "is_ai_enabled", lambda: True)
    monkeypatch.setattr(ai, "ai_rewrite_bullet", lambda **kw: None)

    user = make_user(email="rwfail@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")

    client.post(
        "/analysis/rewrite-bullet",
        json={"bullet_text": "Did some work", "cv_context": "", "target_role": "Engineer"},
        headers=auth_headers(user),
    )

    assert _balance(db_session, user) == 3
    assert [r.reason for r in _ledger(db_session, user.id)][-2:] == [
        "spend_rewrite", "refund_failed_rewrite"
    ]


def test_rewrite_without_credits_is_402(
    client, make_user, auth_headers, db_session, monkeypatch
):
    import app.services.ai_service as ai
    monkeypatch.setattr(ai, "is_ai_enabled", lambda: True)

    user = make_user(email="rwbroke@test.com")

    resp = client.post(
        "/analysis/rewrite-bullet",
        json={"bullet_text": "x", "cv_context": "", "target_role": "Engineer"},
        headers=auth_headers(user),
    )

    assert resp.status_code == 402


def test_a_free_price_charges_nothing(
    client, make_user, auth_headers, db_session, monkeypatch
):
    """Prices live in settings so they can be tuned without a deploy, and zero
    has to mean free - CreditService refuses a zero-value spend, so the helper
    short-circuits instead."""
    import app.services.ai_service as ai
    monkeypatch.setattr(ai, "is_ai_enabled", lambda: True)
    monkeypatch.setattr(ai, "ai_rewrite_bullet", lambda **kw: "Rewritten")
    monkeypatch.setattr(settings, "CREDIT_REWRITE", 0)

    user = make_user(email="rwfree@test.com")

    resp = client.post(
        "/analysis/rewrite-bullet",
        json={"bullet_text": "x", "cv_context": "", "target_role": "Engineer"},
        headers=auth_headers(user),
    )

    assert resp.status_code == 200
    assert _balance(db_session, user) == 0
    assert _ledger(db_session, user.id) == []


# ── plan_type no longer buys anything ─────────────────────────────────────────

def test_a_premium_flag_does_not_replace_credits(
    client, make_user, auth_headers, db_session, monkeypatch
):
    """The whole point of one currency: a leftover premium flag must not open a
    feature the user has no credits for."""
    import app.services.ai_service as ai
    monkeypatch.setattr(ai, "is_ai_enabled", lambda: True)

    user = make_user(email="stillbroke@test.com", plan_type="premium")

    resp = client.post(
        "/analysis/rewrite-bullet",
        json={"bullet_text": "x", "cv_context": "", "target_role": "Engineer"},
        headers=auth_headers(user),
    )

    assert resp.status_code == 402


def test_a_free_user_with_credits_gets_the_feature(
    client, make_user, auth_headers, db_session, monkeypatch
):
    """And the other direction - no more "this is for Pro users" when the user
    is holding credits."""
    import app.services.ai_service as ai
    monkeypatch.setattr(ai, "is_ai_enabled", lambda: True)
    monkeypatch.setattr(ai, "ai_rewrite_bullet", lambda **kw: "Rewritten")

    user = make_user(email="freewithcredits@test.com", plan_type="free")
    CreditService.grant(db_session, user, 3, "grant_signup")

    resp = client.post(
        "/analysis/rewrite-bullet",
        json={"bullet_text": "x", "cv_context": "", "target_role": "Engineer"},
        headers=auth_headers(user),
    )

    assert resp.status_code == 200
