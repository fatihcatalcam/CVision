"""/health returns 200 when the DB answers and 503 when it does not."""
from sqlalchemy.exc import OperationalError

from app.main import app
from app.dependencies import get_db


def test_health_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "healthy"
    assert body["database"] == "up"


def test_health_db_down(client):
    class _BrokenSession:
        def execute(self, *a, **k):
            raise OperationalError("SELECT 1", {}, Exception("down"))

    def _broken_get_db():
        yield _BrokenSession()

    app.dependency_overrides[get_db] = _broken_get_db
    try:
        resp = client.get("/health")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert resp.status_code == 503
    body = resp.json()
    assert body["status"] == "unhealthy"
    assert body["database"] == "down"
