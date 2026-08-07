# -*- coding: utf-8 -*-
"""Invites pay out on a real analysis, not on a signup.

That is the whole security design. Registration is deliberately frictionless -
no email verification, because a wall in front of signup costs more users than
abuse would - so paying at signup would be a credit printer for anyone willing
to type a fake address. Paying when the invited account completes its first
analysis makes every fake account cost a real CV and a real wait, for three
credits.

The once-only guarantee matters as much: a first analysis can be retried, picked
up again by the stuck-job sweep, or raced by two uploads, and none of those may
pay the inviter twice.
"""

import pytest

from app.config import settings
from app.models.credit_transaction import CreditTransaction
from app.models.user import User
from app.services.credit_service import CreditService
from app.services.referral_service import ReferralService


def _ledger(db, user_id):
    return (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user_id)
        .order_by(CreditTransaction.id)
        .all()
    )


# ── codes ─────────────────────────────────────────────────────────────────────

def test_a_code_is_minted_on_first_request(make_user, db_session):
    user = make_user(email="code@test.com")
    assert user.referral_code is None

    code = ReferralService.get_or_create_code(db_session, user)

    assert len(code) == 8
    assert user.referral_code == code


def test_the_same_code_comes_back_every_time(make_user, db_session):
    user = make_user(email="stable@test.com")

    first = ReferralService.get_or_create_code(db_session, user)
    second = ReferralService.get_or_create_code(db_session, user)

    assert first == second


def test_codes_avoid_look_alike_characters(make_user, db_session):
    """These get read off a screen and typed, or dictated. 0/O and 1/I/l cost
    support time and buy no entropy worth having."""
    codes = {
        ReferralService.get_or_create_code(db_session, make_user(email=f"c{i}@test.com"))
        for i in range(15)
    }

    assert not any(set(c) & set("O0I1L") for c in codes)


def test_an_unknown_code_is_ignored_not_rejected(make_user, db_session):
    """A typo in an invite link must never block a signup."""
    invited = make_user(email="typo@test.com")

    ReferralService.attach_inviter(db_session, invited, "NOTACODE")

    assert invited.referred_by_id is None


def test_you_cannot_invite_yourself(make_user, db_session):
    user = make_user(email="self@test.com")
    code = ReferralService.get_or_create_code(db_session, user)

    ReferralService.attach_inviter(db_session, user, code)

    assert user.referred_by_id is None


# ── the reward ────────────────────────────────────────────────────────────────

def test_the_inviter_is_paid_when_the_invite_produces_something(make_user, db_session):
    inviter = make_user(email="inviter@test.com")
    CreditService.grant(db_session, inviter, 3, "grant_signup")
    invited = make_user(email="invited@test.com")
    ReferralService.attach_inviter(
        db_session, invited, ReferralService.get_or_create_code(db_session, inviter)
    )

    paid = ReferralService.reward_inviter(db_session, invited)

    assert paid is True
    db_session.expire_all()
    assert db_session.get(User, inviter.id).credits == 3 + settings.CREDIT_REFERRAL
    assert _ledger(db_session, inviter.id)[-1].reason == "grant_referral"


def test_the_reward_names_the_account_it_was_for(make_user, db_session):
    inviter = make_user(email="inviter2@test.com")
    invited = make_user(email="invited2@test.com")
    ReferralService.attach_inviter(
        db_session, invited, ReferralService.get_or_create_code(db_session, inviter)
    )

    ReferralService.reward_inviter(db_session, invited)

    assert _ledger(db_session, inviter.id)[-1].ref_id == str(invited.id)


def test_the_reward_only_ever_fires_once(make_user, db_session):
    """A retried or re-swept first analysis must not pay again."""
    inviter = make_user(email="inviter3@test.com")
    invited = make_user(email="invited3@test.com")
    ReferralService.attach_inviter(
        db_session, invited, ReferralService.get_or_create_code(db_session, inviter)
    )

    assert ReferralService.reward_inviter(db_session, invited) is True
    assert ReferralService.reward_inviter(db_session, invited) is False
    assert ReferralService.reward_inviter(db_session, invited) is False

    db_session.expire_all()
    assert db_session.get(User, inviter.id).credits == settings.CREDIT_REFERRAL


def test_an_uninvited_account_pays_nobody(make_user, db_session):
    user = make_user(email="organic@test.com")

    assert ReferralService.reward_inviter(db_session, user) is False


def test_signup_alone_pays_nothing(client, make_user, db_session):
    """The point of the whole design: registering is free and instant, so it
    cannot be what triggers the payout."""
    inviter = make_user(email="waiting@test.com")
    code = ReferralService.get_or_create_code(db_session, inviter)
    before = inviter.credits

    resp = client.post(
        "/auth/register",
        json={"full_name": "Invited Person", "email": "fresh-invite@test.com",
              "password": "Passw0rd!", "referral_code": code},
    )

    assert resp.status_code == 201
    invited = db_session.query(User).filter(User.email == "fresh-invite@test.com").one()
    assert invited.referred_by_id == inviter.id      # the link is recorded
    db_session.expire_all()
    assert db_session.get(User, inviter.id).credits == before   # but nothing is paid


# ── the endpoint ──────────────────────────────────────────────────────────────

def test_the_referral_endpoint_reports_code_and_payouts(
    client, make_user, auth_headers, db_session
):
    inviter = make_user(email="panel@test.com")
    paid = make_user(email="paid@test.com")
    pending = make_user(email="pending@test.com")
    code = ReferralService.get_or_create_code(db_session, inviter)
    ReferralService.attach_inviter(db_session, paid, code)
    ReferralService.attach_inviter(db_session, pending, code)
    ReferralService.reward_inviter(db_session, paid)

    resp = client.get("/auth/me/referral", headers=auth_headers(inviter))

    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == code
    assert body["reward"] == settings.CREDIT_REFERRAL
    # Only the invite that actually produced an analysis counts.
    assert body["rewarded_count"] == 1
    # And both pending and paid signups are visible, so a zero payout can be
    # told apart from a link nobody followed.
    assert body["invited_count"] == 2


def test_the_panel_separates_no_clicks_from_no_analyses(
    client, make_user, auth_headers, db_session
):
    """A user whose link nobody has followed reports zero of both. The card
    reads that as "nobody clicked" rather than "something is broken"."""
    lonely = make_user(email="lonely@test.com")

    body = client.get("/auth/me/referral", headers=auth_headers(lonely)).json()

    assert body["invited_count"] == 0
    assert body["rewarded_count"] == 0


# ── the Google signup path ────────────────────────────────────────────────────

def test_google_signup_records_the_inviter(client, make_user, db_session, monkeypatch):
    """The bug this pins: only /auth/register read referral_code, so following
    an invite link and then pressing "Continue with Google" - the easier of the
    two buttons - dropped the referral silently. The inviter could never be paid
    and the invite panel showed zero forever with nothing to explain it.
    """
    import requests

    inviter = make_user(email="ginviter@test.com")
    code = ReferralService.get_or_create_code(db_session, inviter)

    class _FakeResponse:
        status_code = 200

        @staticmethod
        def json():
            return {
                "sub": "google-sub-12345",
                "email": "ginvitee@test.com",
                "email_verified": True,
                "name": "Google Invitee",
            }

    # The endpoint does `import requests as _requests` inside the function, so
    # the module attribute is what has to be patched - a name bound on the
    # router module is never consulted.
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setattr(requests, "get", lambda *a, **k: _FakeResponse())

    resp = client.post(
        "/auth/google",
        json={
            "access_token": "x" * 40,
            "full_name": "Google Invitee",
            "referral_code": code,
        },
    )

    assert resp.status_code == 200, resp.text
    invited = db_session.query(User).filter(User.email == "ginvitee@test.com").one()
    assert invited.referred_by_id == inviter.id
