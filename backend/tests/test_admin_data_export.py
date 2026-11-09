# -*- coding: utf-8 -*-
"""Knowing what CVision's users actually are, rather than what they clicked.

The HQ "Top Domains" chart plots cvs.target_domain - the value from the
uploader's dropdown - and that dropdown pre-selects "Other". So a chart showing
110 "Other" against 15 everything-else cannot tell two very different problems
apart: nobody touches the dropdown, or the domain list does not cover the people
turning up. They need opposite fixes.

The AI already decides what a CV really is, and the pipeline used that value to
regenerate career recommendations and then dropped it. Storing it makes the
question answerable, and the CSV is for the questions the panel was not built
for.
"""

import csv
import io
import uuid

from app.models.analysis import AnalysisResult


def _email() -> str:
    return f"export-{uuid.uuid4().hex[:10]}@test.com"


def _analysis(db, cv, **fields) -> AnalysisResult:
    row = AnalysisResult(
        cv_id=cv.id, overall_score=72.0, ats_score=72.0, keyword_score=72.0,
        completeness_score=72.0, experience_score=72.0, **fields,
    )
    db.add(row)
    db.commit()
    return row


def _csv(client, auth_headers, admin) -> list[dict]:
    resp = client.get("/hq-portal/export/analyses.csv", headers=auth_headers(admin))
    assert resp.status_code == 200
    return list(csv.DictReader(io.StringIO(resp.text)))


# ── the detected domain is kept ───────────────────────────────────────────────

def test_the_overview_reports_selected_and_detected_side_by_side(
    client, make_user, auth_headers, make_cv, db_session
):
    admin = make_user(email=_email(), role="admin")
    owner = make_user(email=_email())

    # Two people left the dropdown alone; the AI read them as real fields.
    for detected in ("Software Engineering", "Finance & Accounting"):
        cv = make_cv(owner, target_domain="Other")
        _analysis(db_session, cv, detected_domain=detected)

    data = client.get("/hq-portal/overview", headers=auth_headers(admin)).json()

    selected = {d["domain"]: d["count"] for d in data["top_domains"]}
    detected = {d["domain"]: d["count"] for d in data["detected_domains"]}

    assert selected.get("Other") == 2                  # what they clicked
    assert detected == {                               # what they actually are
        "Software Engineering": 1,
        "Finance & Accounting": 1,
    }


def test_analyses_without_a_detected_domain_are_left_out_not_counted_as_other(
    client, make_user, auth_headers, make_cv, db_session
):
    """Rows from before this was stored, and any analysis where the AI was
    unavailable, have no answer - and an absent answer must not be mistaken for
    "Other", which is the very value under suspicion."""
    admin = make_user(email=_email(), role="admin")
    owner = make_user(email=_email())
    _analysis(db_session, make_cv(owner, target_domain="Other"))   # no detection

    data = client.get("/hq-portal/overview", headers=auth_headers(admin)).json()

    assert data["detected_domains"] == []


# ── the CSV ───────────────────────────────────────────────────────────────────

def test_the_export_separates_a_real_choice_from_an_untouched_dropdown(
    client, make_user, auth_headers, make_cv, db_session
):
    admin = make_user(email=_email(), role="admin")
    owner = make_user(email=_email())
    left_alone = make_cv(owner, target_domain="Other")
    chosen = make_cv(owner, target_domain="Software Engineering")
    _analysis(db_session, left_alone, detected_domain="Healthcare & Biomedical")
    _analysis(db_session, chosen, detected_domain="Software Engineering")

    by_id = {r["cv_id"]: r for r in _csv(client, auth_headers, admin)}

    assert by_id[str(left_alone.id)]["domain_left_at_default"] == "yes"
    assert by_id[str(left_alone.id)]["detected_domain"] == "Healthcare & Biomedical"
    assert by_id[str(chosen.id)]["domain_left_at_default"] == "no"


def test_failed_uploads_are_in_the_export(
    client, make_user, auth_headers, make_cv, db_session
):
    """Usually the rows worth looking at - an image-only PDF never produces an
    analysis, so a report driven by AnalysisResult would not show it at all."""
    admin = make_user(email=_email(), role="admin")
    owner = make_user(email=_email())
    failed = make_cv(owner, status="failed_no_text")

    row = {r["cv_id"]: r for r in _csv(client, auth_headers, admin)}[str(failed.id)]

    assert row["status"] == "failed_no_text"
    assert row["overall_score"] == ""       # blank, not a misleading zero


def test_the_export_carries_no_cv_text_or_file_bytes(
    client, make_user, auth_headers, make_cv, db_session
):
    """A spreadsheet gets mailed around and left in Downloads. It should hold
    counts, not the contents of people's CVs."""
    admin = make_user(email=_email(), role="admin")
    owner = make_user(email=_email())
    secret = "Fatih Catalcam, born 1789, lives at a very specific address"
    make_cv(owner, extracted_text=secret, file_content=b"%PDF-1.4 raw bytes")

    resp = client.get("/hq-portal/export/analyses.csv", headers=auth_headers(admin))

    assert secret not in resp.text
    assert "%PDF" not in resp.text


def test_anonymous_uploads_are_marked_and_carry_no_email(
    client, make_user, auth_headers, make_cv, db_session
):
    admin = make_user(email=_email(), role="admin")
    owner = make_user(email=_email())
    anon = make_cv(owner)
    anon.user_id = None
    db_session.commit()

    row = {r["cv_id"]: r for r in _csv(client, auth_headers, admin)}[str(anon.id)]

    assert row["is_anonymous"] == "yes"
    assert row["user_email"] == ""


def test_the_export_is_admin_only(client, make_user, auth_headers):
    plain = make_user(email=_email())

    resp = client.get("/hq-portal/export/analyses.csv", headers=auth_headers(plain))

    assert resp.status_code == 403


# ── what each person did ─────────────────────────────────────────────────────
#
# 412 users and no sale: the question became whether anyone comes back and
# reaches the paid steps. Each row carries its owner's totals so a pivot by
# user_id answers it.

def test_each_row_carries_its_owners_journey(
    client, make_user, auth_headers, make_cv, db_session
):
    from datetime import datetime, timedelta, timezone

    from app.models.cover_letter import CoverLetter
    from app.models.cv_jd_match import CVJDMatch
    from app.models.job_description import JobDescription
    from app.services.credit_service import CreditService

    admin = make_user(email=_email(), role="admin")
    signed_up = datetime.now(timezone.utc) - timedelta(days=10)
    owner = make_user(email=_email(), google_id="g-123", language="tr", created_at=signed_up)
    CreditService.grant(db_session, owner, 3, "grant_signup")
    CreditService.grant(db_session, owner, 10, "purchase")

    first = make_cv(owner, uploaded_at=signed_up + timedelta(hours=1))
    CreditService.spend(db_session, owner, 3, "spend_analysis_pro", ref_id=str(first.id))
    second = make_cv(owner, uploaded_at=signed_up + timedelta(days=4))
    CreditService.spend(db_session, owner, 3, "spend_analysis_pro", ref_id=str(second.id))

    jd = JobDescription(user_id=owner.id, raw_text="a job")
    db_session.add(jd)
    db_session.commit()
    db_session.add(CVJDMatch(cv_id=second.id, jd_id=jd.id, match_score=60))
    db_session.add(CoverLetter(cv_id=second.id, jd_id=jd.id, content="Dear team"))
    db_session.commit()

    by_id = {r["cv_id"]: r for r in _csv(client, auth_headers, admin)}
    a, b = by_id[str(first.id)], by_id[str(second.id)]

    assert (a["user_upload_number"], b["user_upload_number"]) == ("1", "2")
    assert (a["days_after_signup"], b["days_after_signup"]) == ("0", "4")
    assert (b["cv_matches"], b["cv_cover_letters"]) == ("1", "1")
    assert (a["cv_matches"], a["cv_cover_letters"]) == ("0", "0")
    for row in (a, b):
        assert row["source"] == "app"
        assert row["signup_method"] == "google"
        assert row["user_language"] == "tr"
        assert row["user_uploads"] == "2"
        assert (row["user_matches"], row["user_cover_letters"]) == ("1", "1")
        assert row["user_credits_bought"] == "10"
        assert row["user_credits_spent"] == "6"
        assert row["user_credits_now"] == "7"
        assert row["user_last_active_at"] != ""
        assert int(row["user_days_active"]) >= 4


def test_an_upload_made_before_signup_came_from_try(
    client, make_user, auth_headers, make_cv, db_session
):
    from datetime import datetime, timedelta, timezone

    admin = make_user(email=_email(), role="admin")
    now = datetime.now(timezone.utc)
    owner = make_user(email=_email(), created_at=now)
    claimed = make_cv(owner, uploaded_at=now - timedelta(minutes=5))

    row = {r["cv_id"]: r for r in _csv(client, auth_headers, admin)}[str(claimed.id)]

    assert row["source"] == "try_claimed"
    assert row["signup_method"] == "email"


def test_an_unclaimed_try_upload_has_no_owner_columns(
    client, make_user, auth_headers, make_cv, db_session
):
    admin = make_user(email=_email(), role="admin")
    anon = make_cv(make_user(email=_email()))
    anon.user_id = None
    db_session.commit()

    row = {r["cv_id"]: r for r in _csv(client, auth_headers, admin)}[str(anon.id)]

    assert row["source"] == "try_unclaimed"
    assert row["user_uploads"] == ""
    assert row["user_upload_number"] == ""
