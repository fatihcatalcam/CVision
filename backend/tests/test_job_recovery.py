"""recover_stuck_jobs re-queues interrupted CVs (bounded) and leaves fresh ones."""
from datetime import datetime, timedelta, timezone

from app.services.job_recovery import recover_stuck_jobs


def _old(minutes):
    return datetime.now(timezone.utc) - timedelta(minutes=minutes)


def test_stuck_processing_job_is_requeued(make_user, make_cv, db_session):
    user = make_user(email="sweep1@test.com")
    cv = make_cv(user, status="processing")
    cv.processing_started_at = _old(30)
    db_session.commit()

    dispatched = []
    result = recover_stuck_jobs(
        db_session, timeout_minutes=10, max_retries=3,
        dispatch=dispatched.append,
    )

    db_session.refresh(cv)
    assert cv.status == "pending"
    assert cv.retry_count == 1
    assert cv.processing_started_at is None
    assert dispatched == [cv.id]
    assert result == {"recovered": 1, "failed": 0}


def test_job_at_retry_cap_is_failed(make_user, make_cv, db_session):
    user = make_user(email="sweep2@test.com")
    cv = make_cv(user, status="processing", retry_count=3)
    cv.processing_started_at = _old(30)
    db_session.commit()

    dispatched = []
    result = recover_stuck_jobs(
        db_session, timeout_minutes=10, max_retries=3,
        dispatch=dispatched.append,
    )

    db_session.refresh(cv)
    assert cv.status == "failed"
    assert dispatched == []
    assert result == {"recovered": 0, "failed": 1}


def test_fresh_pending_job_is_left_alone(make_user, make_cv, db_session):
    user = make_user(email="sweep3@test.com")
    cv = make_cv(user, status="pending")  # uploaded_at defaults to now()
    db_session.commit()

    dispatched = []
    result = recover_stuck_jobs(
        db_session, timeout_minutes=10, max_retries=3,
        dispatch=dispatched.append,
    )

    db_session.refresh(cv)
    assert cv.status == "pending"
    assert cv.retry_count == 0
    assert dispatched == []
    assert result == {"recovered": 0, "failed": 0}


def test_stale_pending_job_is_requeued(make_user, make_cv, db_session):
    user = make_user(email="sweep4@test.com")
    cv = make_cv(user, status="pending")
    # Force an old uploaded_at so the pending job counts as stuck.
    cv.uploaded_at = _old(30)
    db_session.commit()

    dispatched = []
    result = recover_stuck_jobs(
        db_session, timeout_minutes=10, max_retries=3,
        dispatch=dispatched.append,
    )

    db_session.refresh(cv)
    assert cv.status == "pending"
    assert cv.retry_count == 1
    assert dispatched == [cv.id]
    assert result == {"recovered": 1, "failed": 0}
