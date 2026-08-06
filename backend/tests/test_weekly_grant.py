# -*- coding: utf-8 -*-
"""Signup credits, and the weekly grant that is claimed rather than accrued.

The grant is handed out when the user shows up, not by a scheduled job. That is
a deliberate product choice: an account away for five weeks collects one grant on
its return, not five, so the balance rewards turning up rather than existing.

/auth/me is where it hooks in - the endpoint the frontend calls on load, which
already did a lazy quota reset in exactly this shape. Login itself is the wrong
place: the access token lasts an hour, so someone using the product daily may go
weeks without hitting the login endpoint at all.

The cap is a gate, not a ceiling. At or above it the grant is skipped but the
clock still advances, so a large balance cannot queue up grants to collect later.
"""

from datetime import datetime, timedelta, timezone

import pytest

from app.config import settings
from app.models.credit_transaction import CreditTransaction
from app.models.user import User
from app.services.credit_service import CreditService


def _ledger(db, user_id):
    return (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user_id)
        .order_by(CreditTransaction.id)
        .all()
    )


def _age_the_clock(db, user, days: int):
    """Backdate the last grant so the next check sees `days` elapsed."""
    user.credits_granted_at = datetime.now(timezone.utc) - timedelta(days=days)
    db.commit()


# ── signup ────────────────────────────────────────────────────────────────────

def test_registration_grants_the_opening_balance(client, db_session):
    resp = client.post(
        "/auth/register",
        json={"full_name": "New Person", "email": "opening@test.com",
              "password": "Passw0rd!"},
    )

    assert resp.status_code == 201
    user = db_session.query(User).filter(User.email == "opening@test.com").one()
    assert user.credits == settings.CREDIT_SIGNUP
    rows = _ledger(db_session, user.id)
    assert [r.reason for r in rows] == ["grant_signup"]


def test_registration_starts_the_weekly_clock(client, db_session):
    """Without this the very first /auth/me would see a null timestamp, read it
    as "never granted" and hand out a weekly grant on day one - so a new account
    would open at 5 credits, not 3."""
    client.post(
        "/auth/register",
        json={"full_name": "Clock", "email": "clock@test.com", "password": "Passw0rd!"},
    )

    user = db_session.query(User).filter(User.email == "clock@test.com").one()
    assert user.credits_granted_at is not None


# ── the weekly grant ──────────────────────────────────────────────────────────

def test_nothing_is_granted_before_a_week_has_passed(make_user, db_session):
    user = make_user(email="early@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")
    _age_the_clock(db_session, user, days=6)

    granted = CreditService.claim_weekly_grant(db_session, user)

    assert granted is False
    assert user.credits == 3


def test_a_week_later_the_grant_lands(make_user, db_session):
    user = make_user(email="due@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")
    _age_the_clock(db_session, user, days=7)

    granted = CreditService.claim_weekly_grant(db_session, user)

    assert granted is True
    assert user.credits == 3 + settings.CREDIT_WEEKLY
    assert _ledger(db_session, user.id)[-1].reason == "grant_weekly"


def test_a_long_absence_still_only_pays_once(make_user, db_session):
    """Five weeks away is one grant, not five - the whole point of claiming on
    arrival instead of accruing on a schedule."""
    user = make_user(email="away@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")
    _age_the_clock(db_session, user, days=35)

    CreditService.claim_weekly_grant(db_session, user)

    assert user.credits == 3 + settings.CREDIT_WEEKLY


def test_claiming_twice_in_a_row_pays_once(make_user, db_session):
    user = make_user(email="double@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")
    _age_the_clock(db_session, user, days=8)

    assert CreditService.claim_weekly_grant(db_session, user) is True
    assert CreditService.claim_weekly_grant(db_session, user) is False
    assert user.credits == 3 + settings.CREDIT_WEEKLY


# ── the cap ───────────────────────────────────────────────────────────────────

def test_no_grant_at_or_above_the_cap(make_user, db_session):
    user = make_user(email="rich@test.com")
    CreditService.grant(db_session, user, settings.CREDIT_WEEKLY_CAP, "purchase")
    _age_the_clock(db_session, user, days=7)

    granted = CreditService.claim_weekly_grant(db_session, user)

    assert granted is False
    assert user.credits == settings.CREDIT_WEEKLY_CAP


def test_a_skipped_grant_still_advances_the_clock(make_user, db_session):
    """Otherwise a balance that sits above the cap for months would bank every
    missed week and collect them all the moment it dropped below."""
    user = make_user(email="clocked@test.com")
    CreditService.grant(db_session, user, settings.CREDIT_WEEKLY_CAP, "purchase")
    _age_the_clock(db_session, user, days=30)

    CreditService.claim_weekly_grant(db_session, user)          # skipped
    CreditService.spend(db_session, user, settings.CREDIT_WEEKLY_CAP,
                        "spend_analysis")                       # now at 0
    granted = CreditService.claim_weekly_grant(db_session, user)

    assert granted is False, "the clock was reset by the skipped check"
    assert user.credits == 0


def test_dropping_below_the_cap_resumes_grants(make_user, db_session):
    user = make_user(email="resume@test.com")
    CreditService.grant(db_session, user, settings.CREDIT_WEEKLY_CAP, "purchase")
    _age_the_clock(db_session, user, days=7)
    CreditService.claim_weekly_grant(db_session, user)           # skipped, clock reset

    CreditService.spend(db_session, user, 5, "spend_analysis")
    _age_the_clock(db_session, user, days=7)

    assert CreditService.claim_weekly_grant(db_session, user) is True


# ── through the endpoint ──────────────────────────────────────────────────────

def test_auth_me_claims_the_grant(client, make_user, auth_headers, db_session):
    user = make_user(email="viame@test.com")
    CreditService.grant(db_session, user, 1, "grant_signup")
    _age_the_clock(db_session, user, days=9)

    resp = client.get("/auth/me", headers=auth_headers(user))

    assert resp.status_code == 200
    assert resp.json()["credits"] == 1 + settings.CREDIT_WEEKLY


def test_auth_me_reports_the_balance(client, make_user, auth_headers, db_session):
    """The frontend renders the header from this payload, so the field has to be
    on the response schema, not just in the database."""
    user = make_user(email="report@test.com")
    CreditService.grant(db_session, user, 4, "grant_signup")
    _age_the_clock(db_session, user, days=0)     # not due, so nothing is added

    resp = client.get("/auth/me", headers=auth_headers(user))

    assert resp.json()["credits"] == 4


# ── every way into the product ────────────────────────────────────────────────

def test_google_signup_opens_the_account_too(client, db_session, monkeypatch):
    """There is more than one door in, and a Google account that starts at zero
    credits cannot run a single analysis. This nearly shipped: the opening
    balance was added to the email/password path only.
    """
    class _FakeResponse:
        status_code = 200

        @staticmethod
        def json():
            return {
                "email": "viagoogle@test.com", "sub": "google-uid-123",
                "name": "Google Person", "email_verified": True,
            }

    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "test-client-id")
    import requests as _requests
    monkeypatch.setattr(_requests, "get", lambda *a, **k: _FakeResponse())

    resp = client.post(
        "/auth/google",
        json={"access_token": "f" * 40, "full_name": "Google Person"},
    )

    assert resp.status_code == 200, resp.text
    user = db_session.query(User).filter(User.email == "viagoogle@test.com").one()
    assert user.credits == settings.CREDIT_SIGNUP
    assert user.credits_granted_at is not None
    assert [r.reason for r in _ledger(db_session, user.id)] == ["grant_signup"]
