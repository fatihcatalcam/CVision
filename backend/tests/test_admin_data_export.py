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
