# -*- coding: utf-8 -*-
"""Searching, filtering and paging in the HQ panel happen on the server.

All of this used to be done in the browser over whatever rows had been fetched -
a fixed first hundred. So "find this user" and "show me the failures" silently
stopped working past the hundredth row, and gave no sign that they had. At ~50
users nobody would notice; the failure arrives quietly at 101.

Also covers the two operational counts the overview had no answer for: uploads
stuck mid-processing, and CVs whose PDF destroyed its own Turkish characters.
"""

import uuid
from datetime import datetime, timedelta, timezone

import pytest

from app.config import settings


@pytest.fixture
def admin(make_user):
    return make_user(email=f"hq-{uuid.uuid4().hex[:8]}@test.com", role="admin")


@pytest.fixture
def get(client, auth_headers):
    def _get(admin, path):
        resp = client.get(path, headers=auth_headers(admin))
        assert resp.status_code == 200, resp.text
        return resp.json()

    return _get


# ── user search ───────────────────────────────────────────────────────────────

def test_search_finds_a_user_by_name_or_email(make_user, admin, get):
    make_user(email="findme@needle.test", full_name="Zeynep Yildiz")
    make_user(email="other@haystack.test", full_name="Ahmet Kaya")

    by_name = get(admin, "/hq-portal/users?q=zeynep")
    by_email = get(admin, "/hq-portal/users?q=needle")

    assert [u["email"] for u in by_name["users"]] == ["findme@needle.test"]
    assert [u["email"] for u in by_email["users"]] == ["findme@needle.test"]


def test_search_reaches_past_the_first_page(make_user, admin, get):
    """The bug this replaces: filtering in the browser could only ever see the
    rows already fetched, so a match further down did not exist."""
    target = make_user(email="deep@needle.test", full_name="Deep Match")
    for i in range(30):
        make_user(email=f"filler{i}@haystack.test", full_name=f"Filler {i}")

    # Page one on its own does not contain the target...
    page_one = get(admin, "/hq-portal/users?skip=0&limit=25")
    assert target.email not in [u["email"] for u in page_one["users"]]

    # ...but searching finds it anyway, because the query hits the table.
    found = get(admin, "/hq-portal/users?q=deep@needle.test")
    assert [u["email"] for u in found["users"]] == [target.email]


def test_total_reflects_the_search_not_the_table(make_user, admin, get):
    """`total` drives the pager. Returning the unfiltered count would page
    someone through empty screens."""
    make_user(email="unique@needle.test", full_name="Only One")
    for i in range(5):
        make_user(email=f"n{i}@haystack.test", full_name=f"Noise {i}")

    assert get(admin, "/hq-portal/users?q=needle")["total"] == 1


def test_no_query_still_lists_everyone(make_user, admin, get):
    make_user(email="a@list.test")
    make_user(email="b@list.test")

    assert get(admin, "/hq-portal/users")["total"] >= 3  # the two plus the admin


# ── content status filter ─────────────────────────────────────────────────────

def test_status_filter_selects_one_outcome(make_user, make_cv, admin, get):
    owner = make_user(email="statuses@test.com")
    make_cv(owner, status="completed")
    make_cv(owner, status="failed_no_text")
    make_cv(owner, status="failed")

    only_image = get(admin, "/hq-portal/analyses?status=failed_no_text")

    assert only_image["total"] == 1
    assert only_image["items"][0]["status"] == "failed_no_text"


def test_in_flight_covers_both_unfinished_states(make_user, make_cv, admin, get):
    """pending and processing are one thing to an operator - work that has not
    come back - so the filter treats them as one."""
    owner = make_user(email="inflight@test.com")
    make_cv(owner, status="pending")
    make_cv(owner, status="processing")
    make_cv(owner, status="completed")

    assert get(admin, "/hq-portal/analyses?status=in_flight")["total"] == 2


def test_content_search_matches_the_filename_and_the_owner(
    make_user, make_cv, admin, get
):
    owner = make_user(email="cvowner@needle.test", full_name="Owner Name")
    make_cv(owner, original_filename="senior-backend.pdf")
    other = make_user(email="someone@haystack.test", full_name="Someone Else")
    make_cv(other, original_filename="unrelated.pdf")

    by_file = get(admin, "/hq-portal/analyses?q=senior-backend")
    by_owner = get(admin, "/hq-portal/analyses?q=cvowner@needle.test")

    assert by_file["total"] == 1
    assert by_file["items"][0]["cv_filename"] == "senior-backend.pdf"
    assert by_owner["total"] == 1


def test_an_unfiltered_list_still_includes_failures(make_user, make_cv, admin, get):
    """The filter must not become a de-facto exclusion of failed uploads, which
    were invisible here once before."""
    owner = make_user(email="unfiltered@test.com")
    make_cv(owner, status="failed")

    statuses = [i["status"] for i in get(admin, "/hq-portal/analyses")["items"]]
    assert "failed" in statuses


# ── operational counts ────────────────────────────────────────────────────────

def test_stuck_jobs_counts_only_the_old_ones(make_user, make_cv, admin, get, db_session):
    """Everything in flight is counted as in flight; only the ones past the
    recovery timeout are stuck. A fresh upload is not a problem."""
    owner = make_user(email="stuck@test.com")
    fresh = make_cv(owner, status="processing")
    old = make_cv(owner, status="pending")

    old.uploaded_at = datetime.now(timezone.utc) - timedelta(
        minutes=settings.STUCK_JOB_TIMEOUT_MINUTES + 5
    )
    db_session.commit()

    data = get(admin, "/hq-portal/overview")

    assert data["jobs_in_flight"] == 2
    assert data["stuck_jobs"] == 1
    assert fresh.status == "processing"


def test_completed_work_is_not_in_flight(make_user, make_cv, admin, get):
    owner = make_user(email="done@test.com")
    make_cv(owner, status="completed")

    assert get(admin, "/hq-portal/overview")["jobs_in_flight"] == 0


def test_charset_loss_counts_analyses_with_that_finding(
    make_user, make_cv, admin, get, db_session
):
    from app.models.analysis import AnalysisResult

    owner = make_user(email="charset@test.com")

    def _analysis(cv, findings):
        row = AnalysisResult(
            cv_id=cv.id, overall_score=70.0, ats_score=70.0, keyword_score=70.0,
            completeness_score=70.0, experience_score=70.0,
            layout_xray={"available": True, "findings": findings},
        )
        db_session.add(row)
        return row

    _analysis(make_cv(owner), [{"type": "charset_loss", "severity": "high"}])
    # A different finding must not be counted, and neither must no X-Ray at all.
    _analysis(make_cv(owner), [{"type": "header_footer_content", "severity": "info"}])
    _analysis(make_cv(owner), [])
    db_session.commit()

    assert get(admin, "/hq-portal/overview")["charset_loss_count"] == 1


# ── referrals ─────────────────────────────────────────────────────────────────

def test_referrals_group_invitees_under_their_inviter(
    make_user, make_cv, admin, get, db_session
):
    inviter = make_user(email="inviter@test.com", full_name="The Inviter")
    paid = make_user(email="paid@test.com")
    unpaid = make_user(email="unpaid@test.com")

    paid.referred_by_id = inviter.id
    paid.referral_rewarded_at = datetime.now(timezone.utc)
    unpaid.referred_by_id = inviter.id
    db_session.commit()

    make_cv(paid)  # the invitee who actually used the product

    data = get(admin, "/hq-portal/referrals")
    group = next(g for g in data["groups"] if g["inviter_id"] == inviter.id)

    assert group["invited"] == 2
    assert group["rewarded"] == 1
    assert group["credits_earned"] == settings.CREDIT_REFERRAL
    assert data["total_credits_paid"] == settings.CREDIT_REFERRAL


def test_an_invitee_with_no_analyses_is_visible_as_such(
    make_user, admin, get, db_session
):
    """The farm signal. The reward only fires after a first analysis, so a row
    of zeroes is someone who signed up and stopped."""
    inviter = make_user(email="farmer@test.com")
    for i in range(3):
        m = make_user(email=f"sock{i}@test.com")
        m.referred_by_id = inviter.id
    db_session.commit()

    group = next(
        g for g in get(admin, "/hq-portal/referrals")["groups"]
        if g["inviter_id"] == inviter.id
    )

    assert group["invited"] == 3
    assert group["rewarded"] == 0
    assert group["credits_earned"] == 0
    assert [m["analyses"] for m in group["invitees"]] == [0, 0, 0]


def test_nobody_invited_is_an_empty_page_not_an_error(client, auth_headers, make_user):
    admin = make_user(email=f"noref-{uuid.uuid4().hex[:8]}@test.com", role="admin")

    resp = client.get("/hq-portal/referrals", headers=auth_headers(admin))

    assert resp.status_code == 200
    assert resp.json()["total_rewarded"] == 0


# ── still admin-only ──────────────────────────────────────────────────────────

def test_a_normal_user_cannot_read_the_referral_list(client, make_user, auth_headers):
    plain = make_user(email="notadmin@test.com")

    resp = client.get("/hq-portal/referrals", headers=auth_headers(plain))

    assert resp.status_code == 403
