"""
Access-isolation tests for CV endpoints.

These are the highest-value security tests in the suite: they prove one user can
never read, download, or delete another user's CV through the real HTTP path
(auth → hashid decode → CVService.get_cv ownership check). A regression here is a
data-leak, so every ownership branch is pinned down:

  - owner can read their own CV                              → 200
  - a different user is forbidden                            → 403
  - an admin may read any CV (escape hatch by design)        → 200
  - a non-existent id                                        → 404
  - a tampered/garbage hashid                                → 400
  - listing returns ONLY the caller's CVs (no cross-tenant)  → scoped totals
  - a different user cannot delete; the row survives         → 403 + still present
  - the owner can delete their own CV                        → 204 + row gone

Requests use real JWTs (auth_headers) and IDs are hashid-encoded exactly as the
frontend sends them (encode_id), so the full production access path is exercised.
"""

from app.utils.hashids import encode_id


def test_owner_can_read_own_cv(client, make_user, auth_headers, make_cv):
    owner = make_user(email="owner@test.com")
    cv = make_cv(owner, original_filename="owner_cv.pdf")

    resp = client.get(f"/cvs/{encode_id(cv.id)}", headers=auth_headers(owner))

    assert resp.status_code == 200
    assert resp.json()["original_filename"] == "owner_cv.pdf"


def test_other_user_cannot_read_cv(client, make_user, auth_headers, make_cv):
    owner = make_user(email="owner@test.com")
    intruder = make_user(email="intruder@test.com")
    cv = make_cv(owner)

    resp = client.get(f"/cvs/{encode_id(cv.id)}", headers=auth_headers(intruder))

    assert resp.status_code == 403
    # The app's custom HTTPException handler standardizes every error body to
    # {"error", "message", "status"} — there is no FastAPI-default "detail" key.
    assert "Forbidden" in resp.json()["message"]


def test_admin_can_read_any_cv(client, make_user, auth_headers, make_cv):
    owner = make_user(email="owner@test.com")
    admin = make_user(email="admin@test.com", role="admin")
    cv = make_cv(owner, original_filename="owner_cv.pdf")

    resp = client.get(f"/cvs/{encode_id(cv.id)}", headers=auth_headers(admin))

    assert resp.status_code == 200
    assert resp.json()["original_filename"] == "owner_cv.pdf"


def test_nonexistent_cv_returns_404(client, make_user, auth_headers):
    user = make_user(email="user@test.com")

    # A validly-encoded id that no row matches.
    resp = client.get(f"/cvs/{encode_id(999_999_999)}", headers=auth_headers(user))

    assert resp.status_code == 404


def test_tampered_hashid_returns_400(client, make_user, auth_headers):
    user = make_user(email="user@test.com")

    # Garbage that hashids cannot decode → decode_id raises HTTP 400.
    resp = client.get("/cvs/not-a-real-hashid", headers=auth_headers(user))

    assert resp.status_code == 400


def test_list_is_scoped_to_caller(client, make_user, auth_headers, make_cv):
    alice = make_user(email="alice@test.com")
    bob = make_user(email="bob@test.com")
    make_cv(alice)
    make_cv(alice)
    make_cv(bob)

    alice_resp = client.get("/cvs/", headers=auth_headers(alice))
    bob_resp = client.get("/cvs/", headers=auth_headers(bob))

    assert alice_resp.status_code == 200
    assert bob_resp.status_code == 200
    assert alice_resp.json()["total"] == 2
    assert bob_resp.json()["total"] == 1


def test_other_user_cannot_delete_cv(client, make_user, auth_headers, make_cv, db_session):
    from app.models.cv import CV

    owner = make_user(email="owner@test.com")
    intruder = make_user(email="intruder@test.com")
    cv = make_cv(owner)
    cv_id = cv.id

    resp = client.delete(f"/cvs/{encode_id(cv_id)}", headers=auth_headers(intruder))

    assert resp.status_code == 403
    # The row must survive an unauthorized delete attempt.
    assert db_session.query(CV).filter(CV.id == cv_id).first() is not None


def test_owner_can_delete_own_cv(client, make_user, auth_headers, make_cv, db_session):
    from app.models.cv import CV

    owner = make_user(email="owner@test.com")
    cv = make_cv(owner)
    cv_id = cv.id

    resp = client.delete(f"/cvs/{encode_id(cv_id)}", headers=auth_headers(owner))

    assert resp.status_code == 204
    assert db_session.query(CV).filter(CV.id == cv_id).first() is None
