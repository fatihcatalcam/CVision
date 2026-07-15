"""
Anonymous CV analysis: upload without auth, gated results, claim-on-signup,
IP rate limiting, and cleanup of unclaimed rows.
"""

from datetime import datetime, timezone, timedelta

from app.models.cv import CV
from app.models.analysis import AnalysisResult
from app.utils.hashids import encode_id


def test_cv_can_be_anonymous(db_session):
    """A CV row can exist with no owner and a session token."""
    cv = CV(
        user_id=None,
        original_filename="anon.pdf",
        stored_filename="anon-stored.pdf",
        file_path="/nonexistent/anon-stored.pdf",
        file_type="pdf",
        file_size=1024,
        status="pending",
        session_token="tok_abc123",
        client_ip="203.0.113.7",
    )
    db_session.add(cv)
    db_session.commit()
    db_session.refresh(cv)

    assert cv.id is not None
    assert cv.user_id is None
    assert cv.session_token == "tok_abc123"
    assert cv.client_ip == "203.0.113.7"


def test_anon_migration_chains_and_xray_is_head():
    """The anon migration chains off the lemon migration; the ATS X-Ray
    migration chains off it and is the current head."""
    from alembic.config import Config
    from alembic.script import ScriptDirectory

    cfg = Config("alembic.ini")
    script = ScriptDirectory.from_config(cfg)

    assert script.get_current_head() == "b7c8d9e0f1a2"
    xray = script.get_revision("b7c8d9e0f1a2")
    assert xray.down_revision == "f1a2b3c4d5e6"
    anon = script.get_revision("f1a2b3c4d5e6")
    assert anon.down_revision == "a3b4c5d6e7f8"


def _make_analysis_with_ai(db_session, cv):
    """Attach a minimal AnalysisResult with 3 AI suggestions + a long summary."""
    analysis = AnalysisResult(
        cv_id=cv.id,
        overall_score=78, ats_score=82, keyword_score=71,
        completeness_score=80, experience_score=75,
        summary="Rule-based summary.",
        ai_summary="A" * 400,  # long enough to prove truncation
        ai_suggestions=[
            {"category": "experience", "priority": "high", "message": "First tip", "rewrite_hint": "hint-1"},
            {"category": "skills", "priority": "medium", "message": "Second tip", "rewrite_hint": "hint-2"},
            {"category": "format", "priority": "low", "message": "Third tip", "rewrite_hint": "hint-3"},
        ],
        ai_enhanced=1,
    )
    db_session.add(analysis)
    db_session.commit()
    db_session.refresh(analysis)
    return analysis


def test_force_locked_locks_all_but_first_suggestion(db_session, make_user, make_cv):
    from app.routers.analysis import _build_analysis_response

    owner = make_user(email="anon-owner@test.com")
    cv = make_cv(owner, extracted_text="cv text")
    analysis = _make_analysis_with_ai(db_session, cv)

    resp = _build_analysis_response(
        analysis, current_user=None, is_first_analysis=False, force_locked=True
    )

    assert resp.ai_suggestions[0].is_locked is False
    assert resp.ai_suggestions[0].message == "First tip"
    assert resp.ai_suggestions[1].is_locked is True
    assert resp.ai_suggestions[1].message is None
    # Locked suggestions expose only a short teaser, never the full message.
    assert resp.ai_suggestions[1].teaser is not None
    assert resp.ai_suggestions[1].teaser.startswith("Second tip")
    assert resp.is_summary_locked is True
    assert resp.ai_summary.endswith("...")


def test_anon_ip_count_and_claim_and_cleanup(db_session, make_user):
    from app.services.anonymous_service import AnonymousService

    ip = "203.0.113.9"

    # No anon uploads yet from this IP.
    assert AnonymousService.count_recent_anon_by_ip(db_session, ip, hours=24) == 0

    cv = CV(
        user_id=None, original_filename="a.pdf", stored_filename="a-stored.pdf",
        file_path="/nonexistent/a-stored.pdf", file_type="pdf", file_size=10,
        status="completed", session_token="tok_claim_1", client_ip=ip,
    )
    db_session.add(cv)
    db_session.commit()
    db_session.refresh(cv)

    assert AnonymousService.count_recent_anon_by_ip(db_session, ip, hours=24) == 1

    # Claim onto a real user.
    user = make_user(email="claimer@test.com")
    claimed = AnonymousService.claim(db_session, token="tok_claim_1", user=user)
    assert claimed.id == cv.id
    assert claimed.user_id == user.id
    assert claimed.session_token is None
    assert claimed.client_ip is None

    # Second claim of the same token finds nothing.
    assert AnonymousService.claim(db_session, token="tok_claim_1", user=user) is None


def test_cleanup_removes_old_unclaimed_only(db_session, make_user):
    from app.services.anonymous_service import AnonymousService

    old = CV(
        user_id=None, original_filename="old.pdf", stored_filename="old-stored.pdf",
        file_path="/nonexistent/old-stored.pdf", file_type="pdf", file_size=10,
        status="completed", session_token="tok_old", client_ip="203.0.113.1",
        uploaded_at=datetime.now(timezone.utc) - timedelta(days=8),
    )
    fresh = CV(
        user_id=None, original_filename="fresh.pdf", stored_filename="fresh-stored.pdf",
        file_path="/nonexistent/fresh-stored.pdf", file_type="pdf", file_size=10,
        status="completed", session_token="tok_fresh", client_ip="203.0.113.2",
        uploaded_at=datetime.now(timezone.utc),
    )
    owner = make_user(email="owns-old@test.com")
    owned_old = CV(
        user_id=owner.id, original_filename="owned.pdf", stored_filename="owned-stored.pdf",
        file_path="/nonexistent/owned-stored.pdf", file_type="pdf", file_size=10,
        status="completed", uploaded_at=datetime.now(timezone.utc) - timedelta(days=30),
    )
    db_session.add_all([old, fresh, owned_old])
    db_session.commit()
    fresh_id, owned_id = fresh.id, owned_old.id

    removed = AnonymousService.cleanup_unclaimed(db_session, older_than_days=7)

    assert removed == 1
    assert db_session.query(CV).filter(CV.session_token == "tok_old").first() is None
    assert db_session.query(CV).filter(CV.id == fresh_id).first() is not None   # too new
    assert db_session.query(CV).filter(CV.id == owned_id).first() is not None   # has owner


def test_public_results_are_gated(client, db_session):
    """An anonymous results fetch returns a locked response keyed by token."""
    cv = CV(
        user_id=None, original_filename="r.pdf", stored_filename="r-stored.pdf",
        file_path="/nonexistent/r-stored.pdf", file_type="pdf", file_size=10,
        status="completed", session_token="tok_results", client_ip="203.0.113.20",
        extracted_text="cv text",
    )
    db_session.add(cv)
    db_session.commit()
    db_session.refresh(cv)
    _make_analysis_with_ai(db_session, cv)

    resp = client.get("/public/analysis/tok_results/results")
    assert resp.status_code == 200
    body = resp.json()
    assert body["scores"]["overall_score"] == 78
    assert body["is_summary_locked"] is True
    assert body["ai_suggestions"][0]["is_locked"] is False
    assert body["ai_suggestions"][1]["is_locked"] is True


def test_public_status_and_missing_token(client, db_session):
    cv = CV(
        user_id=None, original_filename="s.pdf", stored_filename="s-stored.pdf",
        file_path="/nonexistent/s-stored.pdf", file_type="pdf", file_size=10,
        status="processing", session_token="tok_status", client_ip="203.0.113.21",
    )
    db_session.add(cv)
    db_session.commit()

    ok = client.get("/public/analysis/tok_status/status")
    assert ok.status_code == 200
    assert ok.json()["status"] == "processing"

    missing = client.get("/public/analysis/does-not-exist/status")
    assert missing.status_code == 404


def test_public_claim_endpoint(client, db_session, make_user, auth_headers):
    cv = CV(
        user_id=None, original_filename="c.pdf", stored_filename="c-stored.pdf",
        file_path="/nonexistent/c-stored.pdf", file_type="pdf", file_size=10,
        status="completed", session_token="tok_claim_ep", client_ip="203.0.113.22",
    )
    db_session.add(cv)
    db_session.commit()
    db_session.refresh(cv)
    cv_id = cv.id

    user = make_user(email="claim-ep@test.com")
    resp = client.post("/public/claim", json={"token": "tok_claim_ep"}, headers=auth_headers(user))
    assert resp.status_code == 200
    assert resp.json()["cv_id"] == encode_id(cv_id)

    refreshed = db_session.query(CV).filter(CV.id == cv_id).first()
    assert refreshed.user_id == user.id
    assert refreshed.session_token is None

    # Claiming again → 404 (nothing unclaimed with that token).
    again = client.post("/public/claim", json={"token": "tok_claim_ep"}, headers=auth_headers(user))
    assert again.status_code == 404


def test_claim_requires_auth(client, db_session):
    resp = client.post("/public/claim", json={"token": "whatever"})
    assert resp.status_code == 401


def test_exempt_ips_bypass_daily_limit(monkeypatch):
    """IPs listed in ANON_EXEMPT_IPS skip the per-IP daily cap; others don't."""
    from app.routers import public

    monkeypatch.setattr(public.settings, "ANON_EXEMPT_IPS", " 203.0.113.99 , 8.8.8.8 ")
    assert public._is_exempt_ip("203.0.113.99") is True
    assert public._is_exempt_ip("8.8.8.8") is True
    assert public._is_exempt_ip("1.2.3.4") is False

    # Empty setting exempts nobody.
    monkeypatch.setattr(public.settings, "ANON_EXEMPT_IPS", "")
    assert public._is_exempt_ip("203.0.113.99") is False


def test_admin_endpoints_survive_ownerless_analyses(client, db_session, make_user, auth_headers):
    """
    Anonymous /try analyses create ownerless CVs (user_id=None). The admin
    dashboard and content endpoints must not crash on `cv.owner is None`;
    they should render the analysis labelled as anonymous.
    """
    admin = make_user(email="admin-anon@test.com", role="admin")

    # Exactly what the public /try flow leaves behind: an ownerless CV + analysis.
    cv = CV(
        user_id=None, original_filename="anon-visitor.pdf",
        stored_filename="anon-visitor-stored.pdf",
        file_path="/nonexistent/anon-visitor-stored.pdf", file_type="pdf",
        file_size=10, status="completed", session_token="tok_admin_anon",
        client_ip="203.0.113.55", extracted_text="cv text",
    )
    db_session.add(cv)
    db_session.commit()
    db_session.refresh(cv)
    _make_analysis_with_ai(db_session, cv)

    # Dashboard overview must not 500 on the ownerless analysis in the activity feed.
    overview = client.get("/hq-portal/overview", headers=auth_headers(admin))
    assert overview.status_code == 200
    assert overview.json()["total_analyses"] >= 1

    # Content list must render the anonymous analysis, labelled as anonymous.
    analyses = client.get("/hq-portal/analyses", headers=auth_headers(admin))
    assert analyses.status_code == 200
    anon = next(i for i in analyses.json()["items"] if i["cv_filename"] == "anon-visitor.pdf")
    assert anon["user_name"] == "Anonymous"
    assert anon["user_email"] == "Anonymous"

    # The dedicated recent-activity endpoint shares the same code path.
    activity = client.get("/hq-portal/recent-activity", headers=auth_headers(admin))
    assert activity.status_code == 200


def test_claimed_cv_is_fully_unlocked(client, db_session, make_user, auth_headers):
    """After claim, the owner's /analysis results are unlocked (first analysis)."""
    cv = CV(
        user_id=None, original_filename="u.pdf", stored_filename="u-stored.pdf",
        file_path="/nonexistent/u-stored.pdf", file_type="pdf", file_size=10,
        status="completed", session_token="tok_unlock", client_ip="203.0.113.30",
        extracted_text="cv text",
    )
    db_session.add(cv)
    db_session.commit()
    db_session.refresh(cv)
    _make_analysis_with_ai(db_session, cv)

    user = make_user(email="unlock@test.com")
    claim = client.post("/public/claim", json={"token": "tok_unlock"}, headers=auth_headers(user))
    assert claim.status_code == 200
    cv_hashid = claim.json()["cv_id"]

    resp = client.get(f"/analysis/{cv_hashid}/results", headers=auth_headers(user))
    assert resp.status_code == 200
    body = resp.json()
    # Every AI suggestion is unlocked now (first analysis for this user).
    assert all(s["is_locked"] is False for s in body["ai_suggestions"])
    assert body["is_summary_locked"] is False
