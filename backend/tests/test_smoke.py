"""
Throwaway connectivity smoke test.

Its only job is to prove the test harness is wired correctly:
  - the test database is reachable,
  - the schema was created from the models,
  - reference data (skills) seeded,
  - the TestClient + auth helpers work end-to-end.

Once the first real test scenarios land, this file can be deleted.
Run from the backend/ directory:  pytest tests/test_smoke.py -v
"""

from sqlalchemy import text


def test_database_connection(db_session):
    """The test DB answers a trivial query — connection string is valid."""
    assert db_session.execute(text("SELECT 1")).scalar() == 1


def test_schema_and_seed_present(db_session):
    """Tables exist (schema created) and reference data was seeded."""
    from app.models.skill import Skill
    from app.models.role_profile import RoleProfile

    assert db_session.query(Skill).count() > 0
    assert db_session.query(RoleProfile).count() > 0


def test_health_endpoint(client):
    """The TestClient can reach the app and get a healthy response."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


def test_auth_helpers_end_to_end(client, make_user, auth_headers):
    """make_user + auth_headers produce a token the real auth path accepts."""
    user = make_user(email="smoke@test.com")
    resp = client.get("/cvs/", headers=auth_headers(user))
    assert resp.status_code == 200
    assert resp.json()["total"] == 0  # fresh user has no CVs


def test_openai_is_mocked_off_by_default(_no_real_openai):
    """The autouse guard ensures no test reaches the real OpenAI API."""
    from app.services.ai_service import _get_client

    assert _get_client() is None
