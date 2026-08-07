# -*- coding: utf-8 -*-
"""The admin content list must be able to link straight to /analysis/<hashid>.

Opening a user's report from the HQ panel goes through the SAME endpoint the
owner uses - GET /analysis/{cv_id}/results - not an admin-only one. That works
because CVService.get_cv exempts admins from the ownership check, which is a
deliberate escape hatch and therefore worth pinning down: if someone ever drops
the `and user.role != "admin"` clause, admins silently lose the panel, and if
someone widens it past admins, every user can read every CV.

The list endpoint also has to hand the frontend a hashid. It returns the raw
integer cv_id for the PDF route, but /analysis/:id decodes a hashid, so without
an encoded field the panel cannot build the link at all.
"""

from app.models.analysis import AnalysisResult
from app.utils.hashids import decode_id, encode_id


def _analysis(db, cv, *, score: float = 72.0) -> AnalysisResult:
    analysis = AnalysisResult(
        cv_id=cv.id,
        overall_score=score,
        ats_score=score,
        keyword_score=score,
        completeness_score=score,
        experience_score=score,
        summary="Test analysis",
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


def test_admin_can_open_another_users_analysis(
    client, make_user, auth_headers, make_cv, db_session
):
    owner = make_user(email="owner@test.com")
    admin = make_user(email="admin@test.com", role="admin")
    cv = make_cv(owner, original_filename="owner_cv.pdf")
    _analysis(db_session, cv)

    resp = client.get(
        f"/analysis/{encode_id(cv.id)}/results", headers=auth_headers(admin)
    )

    assert resp.status_code == 200
    # The response carries the hashid back, so this pins down that the admin got
    # the owner's analysis rather than an empty or substituted one.
    assert resp.json()["cv_id"] == encode_id(cv.id)
    assert resp.json()["scores"]["overall_score"] == 72.0


def test_admin_on_the_free_plan_still_sees_the_unlocked_report(
    client, make_user, auth_headers, make_cv, db_session
):
    # Gating keys off the VIEWER's plan, so a free-plan admin would otherwise
    # open a user's report and get teasers instead of the actual suggestions -
    # useless for the review this link exists to enable.
    owner = make_user(email="owner@test.com", plan_type="premium")
    admin = make_user(email="admin@test.com", role="admin", plan_type="free")
    cv = make_cv(owner)
    analysis = _analysis(db_session, cv)
    analysis.ai_suggestions = [
        {"category": "impact", "priority": "high", "message": "First suggestion"},
        {"category": "skills", "priority": "medium", "message": "Second suggestion"},
    ]
    db_session.commit()

    resp = client.get(
        f"/analysis/{encode_id(cv.id)}/results", headers=auth_headers(admin)
    )

    assert resp.status_code == 200
    suggestions = resp.json()["ai_suggestions"]
    assert len(suggestions) == 2
    # The second one is what a free viewer would get as a locked teaser.
    assert suggestions[1]["is_locked"] is False
    assert suggestions[1]["message"] == "Second suggestion"


def test_free_non_admin_still_gets_the_locked_report(
    client, make_user, auth_headers, make_cv, db_session
):
    # The guard above must not have unlocked gating for ordinary free users.
    owner = make_user(email="free@test.com", plan_type="free")
    first_cv = make_cv(owner)
    _analysis(db_session, first_cv)
    cv = make_cv(owner)  # second analysis - past the first-analysis freebie
    analysis = _analysis(db_session, cv)
    analysis.ai_suggestions = [
        {"category": "impact", "priority": "high", "message": "First suggestion"},
        {"category": "skills", "priority": "medium", "message": "Second suggestion"},
    ]
    db_session.commit()

    resp = client.get(
        f"/analysis/{encode_id(cv.id)}/results", headers=auth_headers(owner)
    )

    assert resp.status_code == 200
    suggestions = resp.json()["ai_suggestions"]
    assert suggestions[1]["is_locked"] is True
    assert suggestions[1]["message"] is None


def test_non_owner_without_admin_is_still_forbidden(
    client, make_user, auth_headers, make_cv, db_session
):
    owner = make_user(email="owner@test.com")
    intruder = make_user(email="intruder@test.com")
    cv = make_cv(owner)
    _analysis(db_session, cv)

    resp = client.get(
        f"/analysis/{encode_id(cv.id)}/results", headers=auth_headers(intruder)
    )

    assert resp.status_code == 403


def test_admin_can_read_analysis_status_of_another_user(
    client, make_user, auth_headers, make_cv
):
    # The page polls /status while an analysis is still running, so the admin
    # needs that route too - otherwise opening an in-flight CV dead-ends.
    owner = make_user(email="owner@test.com")
    admin = make_user(email="admin@test.com", role="admin")
    cv = make_cv(owner, status="processing")

    resp = client.get(
        f"/analysis/{encode_id(cv.id)}/status", headers=auth_headers(admin)
    )

    assert resp.status_code == 200
    assert resp.json()["status"] == "processing"


def test_admin_list_exposes_hashed_cv_id(
    client, make_user, auth_headers, make_cv, db_session
):
    owner = make_user(email="owner@test.com")
    admin = make_user(email="admin@test.com", role="admin")
    cv = make_cv(owner, original_filename="linkable.pdf")
    _analysis(db_session, cv)

    resp = client.get("/hq-portal/analyses?limit=100", headers=auth_headers(admin))

    assert resp.status_code == 200
    row = next(r for r in resp.json()["items"] if r["cv_filename"] == "linkable.pdf")

    # The raw id stays - the CV-file route is keyed on it.
    assert row["cv_id"] == cv.id
    # ...and the hashid the /analysis/:id route needs is alongside it.
    assert decode_id(row["cv_hash"]) == cv.id


def test_hashed_cv_id_is_present_on_failed_uploads_too(
    client, make_user, auth_headers, make_cv
):
    # A failed upload has no analysis, so the panel shows no report link - but
    # the field must still serialize rather than blowing up the whole list.
    owner = make_user(email="owner@test.com")
    admin = make_user(email="admin@test.com", role="admin")
    cv = make_cv(owner, original_filename="image_only.pdf", status="failed_no_text")

    resp = client.get("/hq-portal/analyses?limit=100", headers=auth_headers(admin))

    assert resp.status_code == 200
    row = next(r for r in resp.json()["items"] if r["cv_filename"] == "image_only.pdf")
    assert row["id"] is None
    assert decode_id(row["cv_hash"]) == cv.id


# ── the escape hatch stops at the admin's own reports ─────────────────────────

def test_an_admin_sees_their_own_normal_report_locked(
    client, make_user, auth_headers, make_cv, db_session
):
    """The admin exemption used to apply to any report, including the admin's
    own. That made the founder's account the one account that could never see
    what a paying user sees, and it is how "Normal shows the whole Pro report"
    went unnoticed - the person most likely to test the product was
    structurally blind to the bug.
    """
    admin = make_user(email="selfadmin@test.com", role="admin")
    cv = make_cv(admin)
    row = _analysis(db_session, cv)
    row.is_unlocked = False
    row.ai_suggestions = [
        {"category": "experience", "priority": "high", "message": "First", "rewrite_hint": ""},
        {"category": "skills", "priority": "medium", "message": "Second", "rewrite_hint": ""},
    ]
    db_session.commit()

    resp = client.get(f"/analysis/{encode_id(cv.id)}/results", headers=auth_headers(admin))

    assert resp.status_code == 200
    suggestions = resp.json()["ai_suggestions"]
    assert suggestions[0]["is_locked"] is False       # the free one
    assert suggestions[1]["is_locked"] is True        # and the rest are not


def test_an_admin_still_sees_another_users_report_in_full(
    client, make_user, auth_headers, make_cv, db_session
):
    """The HQ review path is the reason the exemption exists; it must survive."""
    owner = make_user(email="reviewed@test.com")
    admin = make_user(email="reviewer@test.com", role="admin")
    cv = make_cv(owner)
    row = _analysis(db_session, cv)
    row.is_unlocked = False
    row.ai_suggestions = [
        {"category": "experience", "priority": "high", "message": "First", "rewrite_hint": ""},
        {"category": "skills", "priority": "medium", "message": "Second", "rewrite_hint": ""},
    ]
    db_session.commit()

    resp = client.get(f"/analysis/{encode_id(cv.id)}/results", headers=auth_headers(admin))

    assert resp.status_code == 200
    assert [s["is_locked"] for s in resp.json()["ai_suggestions"]] == [False, False]


def test_an_admin_who_paid_sees_their_own_report_in_full(
    client, make_user, auth_headers, make_cv, db_session
):
    """Nothing is taken away from an admin who bought the unlock."""
    admin = make_user(email="paidadmin@test.com", role="admin")
    cv = make_cv(admin)
    row = _analysis(db_session, cv)
    row.is_unlocked = True
    row.ai_suggestions = [
        {"category": "experience", "priority": "high", "message": "First", "rewrite_hint": ""},
        {"category": "skills", "priority": "medium", "message": "Second", "rewrite_hint": ""},
    ]
    db_session.commit()

    resp = client.get(f"/analysis/{encode_id(cv.id)}/results", headers=auth_headers(admin))

    assert [s["is_locked"] for s in resp.json()["ai_suggestions"]] == [False, False]
