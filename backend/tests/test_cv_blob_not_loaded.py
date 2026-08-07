# -*- coding: utf-8 -*-
"""The stored PDF must not ride along on queries that never look at it.

`cvs.file_content` holds the raw upload so files survive Render's ephemeral
disk. As an ordinary column it was also SELECTed by every query returning CV
objects - the dashboard history, the user's CV list, the data export, the
startup recovery sweep, and the HQ content list at 25 rows a page. Screens that
show a filename and a date were pulling megabytes of PDF across the network,
which is what pushed the Supabase project past its egress quota (5,073 / 5 GB)
while the database itself sat at 10% of its size limit.

Deferring it fixes that, and these keep it deferred: it is a one-word change to
undo by accident, and the damage is invisible - nothing breaks, the bill just
grows.
"""

from sqlalchemy import inspect

from app.models.cv import CV
from app.services.cv_service import CVService


def _unloaded(obj) -> set:
    return inspect(obj).unloaded


def test_listing_cvs_does_not_fetch_the_pdf(make_user, make_cv, db_session):
    """The user's own CV list: filenames and dates, no blobs."""
    user = make_user(email="blob-list@test.com")
    for _ in range(3):
        make_cv(user, file_content=b"%PDF-1.4 pretend this is a megabyte")
    db_session.expire_all()

    cvs, total = CVService.list_user_cvs(user, db_session)

    assert total == 3
    for cv in cvs:
        assert "file_content" in _unloaded(cv)


def test_the_admin_content_list_does_not_fetch_pdfs(
    client, make_user, auth_headers, make_cv, db_session
):
    """25 rows a page, each one a whole PDF, on a screen showing filenames."""
    admin = make_user(email="blob-admin@test.com", role="admin")
    owner = make_user(email="blob-owner@test.com")
    make_cv(owner, file_content=b"%PDF-1.4 pretend this is a megabyte")
    db_session.expire_all()

    resp = client.get("/hq-portal/analyses?limit=25", headers=auth_headers(admin))
    assert resp.status_code == 200

    for cv in db_session.query(CV).all():
        assert "file_content" in _unloaded(cv)


def test_reading_the_blob_still_works_when_it_is_wanted(
    make_user, make_cv, db_session
):
    """Deferring must not break the download routes - accessing the attribute
    loads it on demand."""
    user = make_user(email="blob-read@test.com")
    payload = b"%PDF-1.4 the real bytes"
    cv = make_cv(user, file_content=payload)
    db_session.expire_all()

    fetched = db_session.query(CV).filter(CV.id == cv.id).one()
    assert "file_content" in _unloaded(fetched)      # absent until asked for

    assert fetched.file_content == payload           # and correct when it is
    assert "file_content" not in _unloaded(fetched)


def test_writing_a_new_cv_still_stores_the_bytes(make_user, make_cv, db_session):
    user = make_user(email="blob-write@test.com")
    payload = b"%PDF-1.4 stored on upload"

    cv = make_cv(user, file_content=payload)
    db_session.expire_all()

    assert db_session.query(CV).filter(CV.id == cv.id).one().file_content == payload
