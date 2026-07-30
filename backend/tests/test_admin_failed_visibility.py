# -*- coding: utf-8 -*-
"""Failed uploads must be visible in the admin content list.

The list was built from AnalysisResult rows, but a failed upload never creates
one - so image-only CVs rejected by the parser were invisible. That is exactly
the case the founder needs to audit: was the CV genuinely an image, or did the
detector reject a good file? Admin can open the CV via cv_id to judge.
"""

from app.models.cv import CV


def _cv(db, *, filename: str, status: str, token: str, text: str | None = None) -> CV:
    cv = CV(
        user_id=None,
        original_filename=filename,
        stored_filename=f"{token}-stored.pdf",
        file_path=f"/nonexistent/{token}.pdf",
        file_type="pdf",
        file_size=10,
        status=status,
        session_token=token,
        client_ip="203.0.113.77",
        extracted_text=text,
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return cv


def test_failed_upload_appears_in_admin_list(client, db_session, make_user, auth_headers):
    admin = make_user(email="admin-failed@test.com", role="admin")
    _cv(db_session, filename="image-only-cv.pdf",
        status="failed_no_text", token="tok_admin_failed")

    res = client.get("/hq-portal/analyses?limit=100", headers=auth_headers(admin))
    assert res.status_code == 200

    item = next(
        (i for i in res.json()["items"] if i["cv_filename"] == "image-only-cv.pdf"),
        None,
    )
    assert item is not None, "a failed upload must be listed so admin can audit it"
    assert item["status"] == "failed_no_text"
    assert item["score"] is None, "there is no score for an upload that never analysed"
    assert item["id"] is None, "there is no analysis record to open or delete"
    # cv_id is what lets admin open the actual file and judge the detector.
    assert item["cv_id"] > 0


def test_generic_failure_is_also_listed(client, db_session, make_user, auth_headers):
    admin = make_user(email="admin-failed2@test.com", role="admin")
    _cv(db_session, filename="crashed-cv.pdf",
        status="failed", token="tok_admin_failed2")

    res = client.get("/hq-portal/analyses?limit=100", headers=auth_headers(admin))
    item = next(
        (i for i in res.json()["items"] if i["cv_filename"] == "crashed-cv.pdf"), None
    )
    assert item is not None
    assert item["status"] == "failed"
