# -*- coding: utf-8 -*-
"""Uploading costs one credit, and a failure gives it back.

Replaces the weekly-quota gate these tests used to cover. The contract that
carried over unchanged is the important one: the charge happens BEFORE anything
is written to disk, so a rejected upload can never leave an orphan file or a CV
row behind. What changed is the currency and the status code - 402 rather than
403, because "you have run out of credits" is a payment problem, not a
permissions one, and the frontend can branch on it to offer a top-up.

The refund matters more than it looks. The credit is taken at upload time, before
anyone knows whether the PDF is even parseable, so an image-only CV would
otherwise charge a user for a result they never received.

save_file is stubbed: this is about the charge, the refund and the no-orphan
guarantee, not disk I/O.
"""

import asyncio
import io
import uuid
from pathlib import Path

import pytest
from fastapi import HTTPException
from starlette.datastructures import Headers, UploadFile

from app.config import settings
from app.models.cv import CV
from app.models.credit_transaction import CreditTransaction
from app.models.user import User
from app.services.credit_service import CreditService
from app.services.cv_service import CVService


@pytest.fixture
def stub_save_file(monkeypatch):
    """No disk I/O, unique stored_filename per call (the column is UNIQUE)."""
    async def _fake_save_file(file, extension):
        name = f"{uuid.uuid4().hex}.{extension}"
        return name, Path("uploads") / name, 1234, b"%PDF-1.4 stub"

    monkeypatch.setattr(CVService, "save_file", staticmethod(_fake_save_file))


def _make_upload() -> UploadFile:
    return UploadFile(
        file=io.BytesIO(b"%PDF-1.4 fake cv bytes"),
        filename="resume.pdf",
        headers=Headers({"content-type": "application/pdf"}),
    )


def _upload(user, db) -> CV:
    return asyncio.run(
        CVService.upload_cv(_make_upload(), "Software Engineering", user, db)
    )


def _balance(db, user_id: int) -> int:
    return db.query(User).filter(User.id == user_id).first().credits


def _ledger(db, user_id: int):
    return (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user_id)
        .order_by(CreditTransaction.id)
        .all()
    )


# ── the charge ────────────────────────────────────────────────────────────────

def test_an_upload_costs_one_credit(make_user, db_session, stub_save_file):
    user = make_user(email="spend@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")

    _upload(user, db_session)

    assert _balance(db_session, user.id) == 2


def test_the_charge_is_recorded_against_the_cv(make_user, db_session, stub_save_file):
    """ref_id has to point at something, or a user asking "what was this credit
    for" gets an answer that is just the word "analysis"."""
    user = make_user(email="ref@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")

    cv = _upload(user, db_session)

    last = _ledger(db_session, user.id)[-1]
    assert last.delta == -1
    assert last.reason == "spend_analysis"
    assert last.ref_id == str(cv.id)


def test_uploads_keep_charging_until_the_balance_runs_out(
    make_user, db_session, stub_save_file
):
    user = make_user(email="drain@test.com")
    CreditService.grant(db_session, user, 2, "grant_signup")

    _upload(user, db_session)
    _upload(user, db_session)

    assert _balance(db_session, user.id) == 0
    with pytest.raises(HTTPException) as exc:
        _upload(user, db_session)
    assert exc.value.status_code == 402


# ── the refusal ───────────────────────────────────────────────────────────────

def test_an_empty_balance_is_refused_with_402(make_user, db_session, stub_save_file):
    user = make_user(email="broke@test.com")

    with pytest.raises(HTTPException) as exc:
        _upload(user, db_session)

    assert exc.value.status_code == 402


def test_a_refused_upload_leaves_no_cv_row(make_user, db_session, stub_save_file):
    """The charge runs before the file is written, so a rejection cannot leave an
    orphan behind - this is the guarantee that carried over from the quota gate."""
    user = make_user(email="orphan@test.com")

    with pytest.raises(HTTPException):
        _upload(user, db_session)

    assert db_session.query(CV).filter(CV.user_id == user.id).count() == 0


def test_a_refused_upload_writes_no_ledger_row(make_user, db_session, stub_save_file):
    user = make_user(email="noledger@test.com")
    CreditService.grant(db_session, user, 1, "grant_signup")
    _upload(user, db_session)                       # balance now 0
    before = len(_ledger(db_session, user.id))

    with pytest.raises(HTTPException):
        _upload(user, db_session)

    assert len(_ledger(db_session, user.id)) == before


# ── the refund ────────────────────────────────────────────────────────────────

def test_a_failed_analysis_gives_the_credit_back(make_user, db_session, stub_save_file):
    user = make_user(email="refund@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")
    cv = _upload(user, db_session)
    assert _balance(db_session, user.id) == 2
    db_session.commit()

    CVService._mark_failed(db_session, cv.id, "failed_no_text")

    assert _balance(db_session, user.id) == 3
    last = _ledger(db_session, user.id)[-1]
    assert last.delta == 1
    assert last.reason == "refund_failed_analysis"
    assert last.ref_id == str(cv.id)


def test_the_refund_shows_up_in_the_ledger_as_its_own_event(
    make_user, db_session, stub_save_file
):
    """Spend and refund are two rows, not one cancelled out. A balance that
    returns to where it started still has to explain the round trip."""
    user = make_user(email="trail@test.com")
    CreditService.grant(db_session, user, 3, "grant_signup")
    cv = _upload(user, db_session)
    db_session.commit()

    CVService._mark_failed(db_session, cv.id, "failed")

    reasons = [r.reason for r in _ledger(db_session, user.id)]
    assert reasons == ["grant_signup", "spend_analysis", "refund_failed_analysis"]


def test_an_anonymous_failure_refunds_nobody(db_session):
    """Anonymous /try uploads have no owner and never spent a credit. The refund
    path must not blow up on cv.user_id being NULL."""
    cv = CV(
        user_id=None, original_filename="anon.pdf",
        stored_filename=f"{uuid.uuid4().hex}.pdf", file_path="/nonexistent/x.pdf",
        file_type="pdf", file_size=10, status="pending",
        session_token="tok_anon_refund", client_ip="203.0.113.9",
    )
    db_session.add(cv)
    db_session.commit()

    CVService._mark_failed(db_session, cv.id, "failed_no_text")

    db_session.expire_all()
    assert db_session.get(CV, cv.id).status == "failed_no_text"


# ── the full analysis ─────────────────────────────────────────────────────────
# `unlock=True` is the only path the upload endpoint takes now; the service
# still accepts `unlock=False`, and the test below it covers that default,
# because the flag is what the background task reads to decide whether the
# report lands open. The ledger reason stays "spend_analysis_pro": renaming it
# would split one spend into two names across the existing history.

def _upload_pro(user, db) -> CV:
    return asyncio.run(
        CVService.upload_cv(
            _make_upload(), "Software Engineering", user, db, unlock=True
        )
    )


def test_a_pro_analysis_costs_analysis_plus_unlock(
    make_user, db_session, stub_save_file
):
    user = make_user(email="pro@test.com")
    CreditService.grant(db_session, user, 5, "grant_signup")

    _upload_pro(user, db_session)

    expected = settings.CREDIT_ANALYSIS + settings.CREDIT_UNLOCK
    assert _balance(db_session, user.id) == 5 - expected
    last = _ledger(db_session, user.id)[-1]
    assert last.reason == "spend_analysis_pro"
    assert last.delta == -expected


def test_pro_is_charged_as_one_spend(make_user, db_session, stub_save_file):
    """Two separate charges would let the unlock fail after the analysis
    succeeded, leaving a paid-for report the user cannot open."""
    user = make_user(email="oneshot@test.com")
    CreditService.grant(db_session, user, 5, "grant_signup")

    _upload_pro(user, db_session)

    spends = [r for r in _ledger(db_session, user.id) if r.delta < 0]
    assert len(spends) == 1


def test_pro_marks_the_cv_so_the_report_lands_unlocked(
    make_user, db_session, stub_save_file
):
    """The purchase happens before the analysis exists, so the intent has to
    survive on the CV until the background task reads it."""
    user = make_user(email="marked@test.com")
    CreditService.grant(db_session, user, 5, "grant_signup")

    cv = _upload_pro(user, db_session)

    assert cv.unlock_requested is True


def test_a_normal_upload_is_not_marked(make_user, db_session, stub_save_file):
    user = make_user(email="plain@test.com")
    CreditService.grant(db_session, user, 5, "grant_signup")

    cv = _upload(user, db_session)

    assert cv.unlock_requested is False


def test_pro_is_refused_when_only_a_normal_analysis_is_affordable(
    make_user, db_session, stub_save_file
):
    user = make_user(email="tooshort@test.com")
    CreditService.grant(db_session, user, settings.CREDIT_ANALYSIS, "grant_signup")

    with pytest.raises(HTTPException) as exc:
        _upload_pro(user, db_session)

    assert exc.value.status_code == 402
    assert _balance(db_session, user.id) == settings.CREDIT_ANALYSIS


def test_a_failed_pro_analysis_refunds_the_whole_price(
    make_user, db_session, stub_save_file
):
    """They paid for a report and an unlock and received neither."""
    user = make_user(email="profail@test.com")
    CreditService.grant(db_session, user, 5, "grant_signup")
    cv = _upload_pro(user, db_session)
    db_session.commit()

    CVService._mark_failed(db_session, cv.id, "failed_no_text")

    assert _balance(db_session, user.id) == 5


# ── the endpoint ──────────────────────────────────────────────────────────────

def test_the_endpoint_always_buys_the_full_report(
    client, make_user, auth_headers, db_session, stub_save_file, monkeypatch
):
    """There is one analysis now, and it includes the report.

    The Normal/Pro choice is gone from the uploader. The server does not take
    the client's word for the price either: this posts `tier=normal`, the way a
    browser holding the old JavaScript would, and expects to be charged for the
    full analysis anyway. Honouring it would let a stale tab keep buying the
    cheap tier indefinitely.
    """
    # TestClient runs background tasks inline, and this stub PDF has no text -
    # the analysis would fail and refund, hiding the charge under test.
    monkeypatch.setattr(
        CVService, "process_analysis_background", staticmethod(lambda *a, **k: None)
    )
    user = make_user(email="always-full@test.com")
    CreditService.grant(db_session, user, 5, "grant_signup")

    resp = client.post(
        "/cvs/upload",
        headers=auth_headers(user),
        files={"file": ("resume.pdf", b"%PDF-1.4 fake cv bytes", "application/pdf")},
        data={"target_domain": "Software Engineering", "tier": "normal"},
    )

    assert resp.status_code in (200, 201), resp.text
    db_session.expire_all()

    expected = settings.CREDIT_ANALYSIS + settings.CREDIT_UNLOCK
    assert _balance(db_session, user.id) == 5 - expected

    cv = db_session.query(CV).filter(CV.user_id == user.id).one()
    assert cv.unlock_requested is True, "the report must land already open"
