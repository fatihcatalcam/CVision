# -*- coding: utf-8 -*-
"""Unlocking a report is a purchase, and it sticks.

Two things changed at once here. Locking used to be a property of the VIEWER -
"is this user premium" - which meant a lapsed subscription silently re-locked
results the user had already paid for. It is now a property of the REPORT, so
what was bought stays bought.

That also fixes a bug in the welcome perk. The old rule computed "is this their
first analysis?" per request as total_analyses == 1, so uploading a second CV
re-locked the first report. The perk is now written onto the row at creation.

Charging at unlock rather than at upload is deliberate: one credit to see the
score and the teasers, the rest only once the user has decided the answer is
worth having.
"""

import pytest

from app.config import settings
from app.models.analysis import AnalysisResult
from app.models.credit_transaction import CreditTransaction
from app.services.credit_service import CreditService
from app.utils.hashids import encode_id


def _analysis(db, cv, *, unlocked=False) -> AnalysisResult:
    row = AnalysisResult(
        cv_id=cv.id, overall_score=72.0, ats_score=72.0, keyword_score=72.0,
        completeness_score=72.0, experience_score=72.0,
        ai_suggestions=[
            {"category": "impact", "priority": "high", "message": "First tip"},
            {"category": "skills", "priority": "medium", "message": "Second tip"},
        ],
        is_unlocked=unlocked,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _ledger(db, user_id):
    return (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user_id)
        .order_by(CreditTransaction.id)
        .all()
    )


# ── the purchase ──────────────────────────────────────────────────────────────

def test_unlocking_charges_and_opens_the_report(
    client, make_user, auth_headers, make_cv, db_session
):
    user = make_user(email="unlock@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")
    cv = make_cv(user)
    _analysis(db_session, cv)

    resp = client.post(f"/analysis/{encode_id(cv.id)}/unlock", headers=auth_headers(user))

    assert resp.status_code == 200
    assert resp.json()["ai_suggestions"][1]["is_locked"] is False
    db_session.expire_all()
    assert db_session.get(type(user), user.id).credits == 3 - settings.CREDIT_UNLOCK


def test_the_charge_names_the_cv(client, make_user, auth_headers, make_cv, db_session):
    user = make_user(email="unlockref@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")
    cv = make_cv(user)
    _analysis(db_session, cv)

    client.post(f"/analysis/{encode_id(cv.id)}/unlock", headers=auth_headers(user))

    last = _ledger(db_session, user.id)[-1]
    assert (last.reason, last.ref_id, last.delta) == (
        "spend_unlock", str(cv.id), -settings.CREDIT_UNLOCK
    )


def test_unlocking_twice_only_charges_once(
    client, make_user, auth_headers, make_cv, db_session
):
    """A double-click, a retry or a stale tab must not bill the user twice."""
    user = make_user(email="twice@test.com")
    CreditService.grant(db_session, user, 5, "grant_signup")
    cv = make_cv(user)
    _analysis(db_session, cv)

    client.post(f"/analysis/{encode_id(cv.id)}/unlock", headers=auth_headers(user))
    resp = client.post(f"/analysis/{encode_id(cv.id)}/unlock", headers=auth_headers(user))

    assert resp.status_code == 200
    db_session.expire_all()
    assert db_session.get(type(user), user.id).credits == 5 - settings.CREDIT_UNLOCK


def test_an_empty_balance_cannot_unlock(
    client, make_user, auth_headers, make_cv, db_session
):
    user = make_user(email="poor@test.com")
    cv = make_cv(user)
    _analysis(db_session, cv)

    resp = client.post(f"/analysis/{encode_id(cv.id)}/unlock", headers=auth_headers(user))

    assert resp.status_code == 402
    db_session.expire_all()
    assert db_session.get(AnalysisResult, _analysis_id(db_session, cv)).is_unlocked is False


def _analysis_id(db, cv) -> int:
    return db.query(AnalysisResult).filter(AnalysisResult.cv_id == cv.id).one().id


# ── what the lock is now attached to ──────────────────────────────────────────

def test_an_unlocked_report_stays_unlocked_for_a_free_user(
    client, make_user, auth_headers, make_cv, db_session
):
    """The regression the old rule caused: gating on the viewer's plan meant a
    report the user had already earned locked itself again later."""
    user = make_user(email="stays@test.com", plan_type="free")
    cv = make_cv(user)
    _analysis(db_session, cv, unlocked=True)

    resp = client.get(f"/analysis/{encode_id(cv.id)}/results", headers=auth_headers(user))

    assert resp.json()["ai_suggestions"][1]["is_locked"] is False


def test_a_locked_report_stays_locked_for_a_premium_user(
    client, make_user, auth_headers, make_cv, db_session
):
    """The other direction: plan_type no longer buys anything on its own, so a
    premium flag cannot open a report nobody paid to unlock."""
    user = make_user(email="premlock@test.com", plan_type="premium")
    cv = make_cv(user)
    _analysis(db_session, cv, unlocked=False)

    resp = client.get(f"/analysis/{encode_id(cv.id)}/results", headers=auth_headers(user))

    assert resp.json()["ai_suggestions"][1]["is_locked"] is True


def test_an_admin_still_sees_everything(
    client, make_user, auth_headers, make_cv, db_session
):
    owner = make_user(email="owner2@test.com")
    admin = make_user(email="admin2@test.com", role="admin")
    cv = make_cv(owner)
    _analysis(db_session, cv, unlocked=False)

    resp = client.get(f"/analysis/{encode_id(cv.id)}/results", headers=auth_headers(admin))

    assert resp.json()["ai_suggestions"][1]["is_locked"] is False


# ── the report is open only if it was paid for ────────────────────────────────

def test_a_normal_first_analysis_is_locked(make_user, make_cv, db_session):
    """The regression this pins.

    `is_first` used to unlock the report as a welcome perk, left over from the
    weekly-quota days. Under credits that pays twice: signup already grants
    exactly enough for one Pro analysis. So a new account picked Normal, was
    charged 1 credit, and got the entire Pro report - which then became every
    new user's idea of what Normal includes, and nobody had a reason to buy the
    upgrade they had already been given.
    """
    from app.services.analysis_service import AnalysisService

    user = make_user(email="firstnormal@test.com")
    cv = make_cv(user, extracted_text="Some CV text", unlock_requested=False)

    assert AnalysisService._is_users_first_analysis(cv, db_session) is True

    row = _analysis(db_session, cv, unlocked=bool(cv.unlock_requested))
    assert row.is_unlocked is False


def test_a_pro_first_analysis_is_open(make_user, make_cv, db_session):
    """Paying up front still buys the whole report on the very first one."""
    user = make_user(email="firstpro@test.com")
    cv = make_cv(user, extracted_text="Some CV text", unlock_requested=True)

    row = _analysis(db_session, cv, unlocked=bool(cv.unlock_requested))
    assert row.is_unlocked is True
