"""
Weekly-quota enforcement tests for CVService.upload_cv.

upload_cv runs the quota gate under a `SELECT ... FOR UPDATE` row lock and only
saves the file AFTER the gate passes, so a rejected upload must never leave an
orphan file or CV row. These tests pin that contract down:

  - count increments by exactly 1 per successful upload
  - a free user is blocked once they hit FREE_WEEKLY_LIMIT      → HTTP 403
  - an expired quota window resets the counter and reopens it
  - a premium user gets the higher PREMIUM_WEEKLY_LIMIT
  - a rejected (over-quota) upload creates no CV row            → no orphan

The disk write (CVService.save_file) is stubbed out: these tests are about the
quota arithmetic and the "no orphan on reject" guarantee, not file I/O. The async
service method is driven from sync tests via asyncio.run.

Note on concurrency: true two-connection race testing of the row lock is an
integration concern (it needs committed rows on separate connections, which the
per-test rollback fixture intentionally prevents). Here we verify the
single-caller gate logic that the lock protects.
"""

import asyncio
import io
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

import pytest
from fastapi import HTTPException
from starlette.datastructures import Headers, UploadFile

from app.config import settings
from app.models.cv import CV
from app.models.user import User
from app.services.cv_service import CVService


@pytest.fixture
def stub_save_file(monkeypatch):
    """
    Replace CVService.save_file with an async stub that performs no disk I/O and
    returns a unique stored_filename each call (the column is UNIQUE, so repeated
    uploads in one test must not collide).
    """
    async def _fake_save_file(file, extension):
        name = f"{uuid.uuid4().hex}.{extension}"
        return name, Path("uploads") / name, 1234, b"%PDF-1.4 stub"

    monkeypatch.setattr(CVService, "save_file", staticmethod(_fake_save_file))


def _make_upload() -> UploadFile:
    """A minimal, validation-passing PDF upload (content_type drives validate_file)."""
    return UploadFile(
        file=io.BytesIO(b"%PDF-1.4 fake cv bytes"),
        filename="resume.pdf",
        headers=Headers({"content-type": "application/pdf"}),
    )


def _upload(user, db) -> CV:
    """Drive the async upload pipeline from a sync test."""
    return asyncio.run(
        CVService.upload_cv(_make_upload(), "Software Engineering", user, db)
    )


def _refresh_count(db, user_id: int) -> int:
    return db.query(User).filter(User.id == user_id).first().analysis_count


def test_count_increments_per_upload(make_user, db_session, stub_save_file):
    user = make_user(email="counter@test.com")  # free, count=0, no window

    _upload(user, db_session)

    assert _refresh_count(db_session, user.id) == 1


def test_free_user_blocked_at_limit(make_user, db_session, stub_save_file):
    user = make_user(email="freecap@test.com")

    # Exhaust the free allowance exactly.
    for _ in range(settings.FREE_WEEKLY_LIMIT):
        _upload(user, db_session)

    assert _refresh_count(db_session, user.id) == settings.FREE_WEEKLY_LIMIT

    # The next upload must be rejected with 403.
    with pytest.raises(HTTPException) as exc:
        _upload(user, db_session)

    assert exc.value.status_code == 403
    # Count must not have moved past the limit.
    assert _refresh_count(db_session, user.id) == settings.FREE_WEEKLY_LIMIT


def test_expired_window_resets_count(make_user, db_session, stub_save_file):
    user = make_user(email="expired@test.com")
    # Simulate a maxed-out, already-expired window.
    user.analysis_count = settings.FREE_WEEKLY_LIMIT
    user.quota_reset_at = datetime.now(timezone.utc) - timedelta(days=1)
    db_session.commit()

    # Window expired → counter resets to 0, then this upload increments to 1.
    _upload(user, db_session)

    refreshed = db_session.query(User).filter(User.id == user.id).first()
    assert refreshed.analysis_count == 1
    assert refreshed.quota_reset_at > datetime.now(timezone.utc)


def test_premium_user_gets_higher_limit(make_user, db_session, stub_save_file):
    user = make_user(email="premium@test.com", plan_type="premium")
    # At the FREE limit but well under the PREMIUM limit, in an active window.
    user.analysis_count = settings.FREE_WEEKLY_LIMIT
    user.quota_reset_at = datetime.now(timezone.utc) + timedelta(days=3)
    db_session.commit()

    # A free user would be blocked here; premium must be allowed through.
    _upload(user, db_session)

    assert _refresh_count(db_session, user.id) == settings.FREE_WEEKLY_LIMIT + 1


def test_rejected_upload_leaves_no_cv(make_user, db_session, stub_save_file):
    user = make_user(email="noorphan@test.com")
    user.analysis_count = settings.FREE_WEEKLY_LIMIT
    user.quota_reset_at = datetime.now(timezone.utc) + timedelta(days=3)
    db_session.commit()

    with pytest.raises(HTTPException):
        _upload(user, db_session)

    # The quota gate raises BEFORE the CV row is created → zero orphans.
    assert db_session.query(CV).filter(CV.user_id == user.id).count() == 0
