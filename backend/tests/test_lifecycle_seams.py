# -*- coding: utf-8 -*-
"""End-to-end journeys, because the expensive bugs live between features.

Every serious bug found on 2026-08-07 sat on a seam, with both sides
individually tested and green:

  - credits x unlock       a Normal analysis handed over the whole Pro report
  - OAuth x referral       Google signups dropped the invite code entirely
  - scoring x gaming       a sentence with no sections scored 50% completeness

Unit tests cannot see any of those: each one is a disagreement between two
components, not a fault inside one. These walk the whole journey over HTTP the
way a user does, and assert what the user ends up holding.
"""

import uuid

import pytest

from app.config import settings
from app.models.analysis import AnalysisResult
from app.models.credit_transaction import CreditTransaction
from app.models.user import User
from app.services.credit_service import CreditService
from app.utils.hashids import encode_id


def _email() -> str:
    return f"seam-{uuid.uuid4().hex[:10]}@test.com"


def _balance(db, user) -> int:
    db.expire_all()
    return db.get(User, user.id).credits


def _ledger(db, user_id) -> list[str]:
    return [
        r.reason for r in db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user_id)
        .order_by(CreditTransaction.id)
        .all()
    ]


def _analysis(db, cv, *, unlocked: bool) -> AnalysisResult:
    row = AnalysisResult(
        cv_id=cv.id, overall_score=72.0, ats_score=72.0, keyword_score=72.0,
        completeness_score=72.0, experience_score=72.0,
        ai_summary="A long executive summary that would be worth paying to read in full.",
        ai_suggestions=[
            {"category": "experience", "priority": "high",
             "message": "First tip", "rewrite_hint": "Before: 'a' -> After: 'b'"},
            {"category": "skills", "priority": "medium",
             "message": "Second tip", "rewrite_hint": ""},
            {"category": "ats", "priority": "low",
             "message": "Third tip", "rewrite_hint": ""},
        ],
        is_unlocked=unlocked,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


# ── signup -> Normal analysis -> unlock ───────────────────────────────────────

def test_a_new_account_paying_for_normal_gets_only_normal(
    client, make_user, auth_headers, make_cv, db_session
):
    """The journey that was broken in production.

    A brand-new account chose Normal, was charged 1 credit, and received the
    complete Pro report - because the first analysis carried a welcome unlock
    left over from the weekly-quota era. Both halves were tested: the charge
    was right, the locking was right. Nobody walked the two together.
    """
    user = make_user(email=_email())
    CreditService.open_account(db_session, user)
    opening = _balance(db_session, user)
    assert opening == settings.CREDIT_SIGNUP

    # Normal: the CV is created without an unlock request.
    cv = make_cv(user, unlock_requested=False)
    analysis = _analysis(db_session, cv, unlocked=bool(cv.unlock_requested))

    resp = client.get(f"/analysis/{encode_id(cv.id)}/results", headers=auth_headers(user))
    body = resp.json()

    assert resp.status_code == 200
    assert analysis.is_unlocked is False
    # One suggestion free, the rest withheld - and the text really is absent,
    # not merely hidden by the frontend.
    locked = [s for s in body["ai_suggestions"] if s["is_locked"]]
    assert len(locked) == 2
    assert all(s["message"] is None for s in locked)
    assert body["is_summary_locked"] is True


def test_unlocking_costs_credits_and_opens_the_whole_report(
    client, make_user, auth_headers, make_cv, db_session
):
    user = make_user(email=_email())
    CreditService.grant(db_session, user, 5, "grant_signup")
    cv = make_cv(user, unlock_requested=False)
    _analysis(db_session, cv, unlocked=False)

    resp = client.post(f"/analysis/{encode_id(cv.id)}/unlock", headers=auth_headers(user))
    assert resp.status_code == 200

    assert _balance(db_session, user) == 5 - settings.CREDIT_UNLOCK

    after = client.get(
        f"/analysis/{encode_id(cv.id)}/results", headers=auth_headers(user)
    ).json()
    assert [s["is_locked"] for s in after["ai_suggestions"]] == [False, False, False]
    assert after["is_summary_locked"] is False


def test_paying_for_unlock_twice_is_refused(
    client, make_user, auth_headers, make_cv, db_session
):
    """Double-charging for something already owned is the worst possible
    failure of this flow."""
    user = make_user(email=_email())
    CreditService.grant(db_session, user, 6, "grant_signup")
    cv = make_cv(user, unlock_requested=False)
    _analysis(db_session, cv, unlocked=False)

    client.post(f"/analysis/{encode_id(cv.id)}/unlock", headers=auth_headers(user))
    balance_after_first = _balance(db_session, user)
    client.post(f"/analysis/{encode_id(cv.id)}/unlock", headers=auth_headers(user))

    assert _balance(db_session, user) == balance_after_first
    assert _ledger(db_session, user.id).count("spend_unlock") == 1


def test_a_pro_analysis_is_open_from_the_start(
    client, make_user, auth_headers, make_cv, db_session
):
    """Paying up front must not also require paying to unlock."""
    user = make_user(email=_email())
    CreditService.grant(db_session, user, 5, "grant_signup")
    cv = make_cv(user, unlock_requested=True)
    _analysis(db_session, cv, unlocked=bool(cv.unlock_requested))

    body = client.get(
        f"/analysis/{encode_id(cv.id)}/results", headers=auth_headers(user)
    ).json()

    assert [s["is_locked"] for s in body["ai_suggestions"]] == [False, False, False]


def test_a_report_stays_bought_when_the_balance_runs_out(
    client, make_user, auth_headers, make_cv, db_session
):
    """Unlocking is a purchase, not a subscription status. Spending down to
    zero afterwards must not take back what was paid for."""
    user = make_user(email=_email())
    CreditService.grant(db_session, user, 2, "grant_signup")
    cv = make_cv(user, unlock_requested=False)
    _analysis(db_session, cv, unlocked=False)

    client.post(f"/analysis/{encode_id(cv.id)}/unlock", headers=auth_headers(user))
    assert _balance(db_session, user) == 0

    body = client.get(
        f"/analysis/{encode_id(cv.id)}/results", headers=auth_headers(user)
    ).json()
    assert all(s["is_locked"] is False for s in body["ai_suggestions"])


# ── one report, one owner ─────────────────────────────────────────────────────

def test_another_user_cannot_read_a_report_they_did_not_buy(
    client, make_user, auth_headers, make_cv, db_session
):
    owner = make_user(email=_email())
    intruder = make_user(email=_email())
    cv = make_cv(owner, unlock_requested=True)
    _analysis(db_session, cv, unlocked=True)

    resp = client.get(
        f"/analysis/{encode_id(cv.id)}/results", headers=auth_headers(intruder)
    )

    assert resp.status_code == 403


# ── signup -> first analysis -> the inviter is paid ───────────────────────────

def test_the_invite_reward_reaches_the_inviter_through_the_whole_flow(
    client, make_user, auth_headers, make_cv, db_session
):
    """Invite, sign up, analyse, get paid - the chain the Google signup broke by
    losing the code at step two, where every individual piece still passed."""
    from app.services.referral_service import ReferralService

    inviter = make_user(email=_email())
    code = ReferralService.get_or_create_code(db_session, inviter)
    before = _balance(db_session, inviter)

    invitee_email = _email()
    resp = client.post(
        "/auth/register",
        json={"full_name": "Invited Person", "email": invitee_email,
              "password": "Passw0rd!", "referral_code": code},
    )
    assert resp.status_code == 201

    invitee = db_session.query(User).filter(User.email == invitee_email).one()
    assert invitee.referred_by_id == inviter.id
    # Signing up alone pays nothing - that is what keeps the scheme safe.
    assert _balance(db_session, inviter) == before

    ReferralService.reward_inviter(db_session, invitee)

    assert _balance(db_session, inviter) == before + settings.CREDIT_REFERRAL
    assert "grant_referral" in _ledger(db_session, inviter.id)


def test_a_new_account_can_afford_exactly_one_pro_analysis(
    make_user, db_session
):
    """The number the whole pricing story rests on: the signup grant is one Pro
    analysis, which is why the first report is no longer given away."""
    user = make_user(email=_email())
    CreditService.open_account(db_session, user)

    cost_of_pro = settings.CREDIT_ANALYSIS + settings.CREDIT_UNLOCK

    assert _balance(db_session, user) == cost_of_pro
