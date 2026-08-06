# -*- coding: utf-8 -*-
"""A failed analysis must not cost the user a credit.

Founder-reported: someone uploaded an image-only CV through /try. It failed
(no text layer), and because the daily anonymous limit counts uploads rather
than successful analyses, they could not retry even after fixing their CV -
they were pushed into signing up instead. The same held for registered users,
whose weekly count is incremented at upload time, before the analysis runs.

If we could not produce an analysis, the user did not get what they paid a
credit for.
"""

from datetime import datetime, timezone

from app.database import SessionLocal
from app.models.cv import CV
from app.models.user import User
from app.auth.hashing import hash_password
from app.parsing.base_parser import EmptyTextError
from app.services.anonymous_service import AnonymousService
from app.services.cv_service import CVService


def _anon_cv(db, ip: str, status: str, token: str) -> CV:
    cv = CV(
        user_id=None,
        original_filename="r.pdf",
        stored_filename=f"{token}-stored.pdf",
        file_path=f"/nonexistent/{token}.pdf",
        file_type="pdf",
        file_size=10,
        status=status,
        session_token=token,
        client_ip=ip,
        uploaded_at=datetime.now(timezone.utc),
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return cv


def test_failed_anon_upload_does_not_consume_the_daily_allowance(db_session):
    ip = "203.0.113.99"
    _anon_cv(db_session, ip, "failed_no_text", "tok_q_imgfail")

    assert AnonymousService.count_recent_anon_by_ip(db_session, ip, hours=24) == 0, (
        "an image-only CV that failed must leave the free daily analysis intact"
    )


def test_generic_failure_also_does_not_consume_the_allowance(db_session):
    ip = "203.0.113.98"
    _anon_cv(db_session, ip, "failed", "tok_q_genfail")

    assert AnonymousService.count_recent_anon_by_ip(db_session, ip, hours=24) == 0, (
        "our own crash must not cost the user their analysis"
    )


def test_successful_anon_upload_still_consumes_the_allowance(db_session):
    ip = "203.0.113.97"
    _anon_cv(db_session, ip, "completed", "tok_q_ok")

    assert AnonymousService.count_recent_anon_by_ip(db_session, ip, hours=24) == 1


def test_in_flight_upload_still_counts(db_session):
    """Processing/pending must count, or one IP could flood parallel uploads."""
    ip = "203.0.113.96"
    _anon_cv(db_session, ip, "processing", "tok_q_busy")

    assert AnonymousService.count_recent_anon_by_ip(db_session, ip, hours=24) == 1


def _run_background_with_failure(monkeypatch, error: Exception) -> int:
    """Run the real background task for a registered user's CV, return their
    credit balance afterwards.

    Goes through process_analysis_background rather than calling _mark_failed
    directly, so the refund is exercised on the path a genuine failure takes."""
    monkeypatch.setattr(
        CVService, "extract_text",
        staticmethod(lambda path, ftype: (_ for _ in ()).throw(error)),
    )

    setup = SessionLocal()
    try:
        user = User(
            full_name="Quota User", email="quotarefund@test.com",
            password_hash=hash_password("Passw0rd!"), role="user", plan_type="free",
            credits=2,  # what is left after paying for this upload
        )
        setup.add(user)
        setup.commit()
        setup.refresh(user)
        cv = CV(
            user_id=user.id, original_filename="r.pdf",
            stored_filename="quota-refund-unique.pdf", file_path="/nonexistent/q.pdf",
            file_type="pdf", file_size=10, status="pending",
        )
        setup.add(cv)
        setup.commit()
        setup.refresh(cv)
        cv_id, user_id = cv.id, user.id
    finally:
        setup.close()

    try:
        CVService.process_analysis_background(cv_id)
        check = SessionLocal()
        try:
            return check.query(User).filter(User.id == user_id).first().credits
        finally:
            check.close()
    finally:
        cleanup = SessionLocal()
        try:
            cleanup.query(CV).filter(CV.id == cv_id).delete()
            cleanup.query(User).filter(User.id == user_id).delete()
            cleanup.commit()
        finally:
            cleanup.close()


def test_image_pdf_failure_refunds_the_registered_users_credit(monkeypatch):
    balance = _run_background_with_failure(monkeypatch, EmptyTextError("no text"))
    assert balance == 3, "the credit spent on the upload must come back"


def test_generic_failure_refunds_the_registered_users_credit(monkeypatch):
    balance = _run_background_with_failure(monkeypatch, RuntimeError("boom"))
    assert balance == 3, "our own crash must not cost the user a credit"
