"""
Shared pytest fixtures for the CVision backend test suite.

────────────────────────────────────────────────────────────────────────────
TEST DATABASE SETUP  (read this once before running the suite)
────────────────────────────────────────────────────────────────────────────
Tests run against a SEPARATE, disposable Supabase Postgres project — never the
production database. You provide its connection string two ways (either works):

  1. Environment variable:
         setx TEST_DATABASE_URL "postgresql://...@db.<ref>.supabase.co:5432/postgres"
     (open a new terminal afterwards so the variable is picked up)

  2. A backend/.env.test file (auto-loaded by this module). Example contents:
         TEST_DATABASE_URL=postgresql://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres
     IMPORTANT: add `.env.test` to .gitignore — it holds credentials.

If TEST_DATABASE_URL is missing, the suite aborts with a clear message instead
of silently falling back to anything dangerous.

This module forces the ENTIRE app (including direct SessionLocal() usage in
background tasks) onto the test database by setting DATABASE_URL in the
environment BEFORE any app module is imported. Environment variables take
precedence over the values in the real `.env`, so production credentials in
`.env` cannot leak into the test run.
"""

import os

# ── 1. Load .env.test (if present) and resolve the test database URL ─────────
try:
    from dotenv import load_dotenv

    # Loaded relative to the current working directory (run pytest from backend/).
    load_dotenv(".env.test")
except Exception:  # python-dotenv missing or file unreadable — env vars still work
    pass

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")
if not TEST_DATABASE_URL:
    raise RuntimeError(
        "TEST_DATABASE_URL is not set. Point it at a DEDICATED Supabase test "
        "project (never production). Set it as an environment variable or in a "
        "backend/.env.test file. See the docstring at the top of this file."
    )

# ── 2. Force the whole app onto the test DB BEFORE importing any app module ──
# Set these in os.environ so pydantic Settings (env vars > .env file) uses them.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production-use-only")
os.environ.setdefault("OPENAI_API_KEY", "")          # AI disabled by default in tests
os.environ.setdefault("OPENAI_ENABLED", "false")
os.environ.setdefault("CORS_ORIGINS", "http://testserver")

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient


# ── 3. Session-scoped engine + schema, built from the SQLAlchemy models ──────
@pytest.fixture(scope="session")
def test_engine():
    """
    A single engine bound to the test database for the whole test session.

    The schema is created from Base.metadata (the ORM models), which faithfully
    mirrors production because every table — including job_descriptions,
    cv_jd_matches, cover_letters — has a corresponding model. The raw ALTER
    patches in main.py's lifespan are a production-migration concern and are not
    needed here.
    """
    # Importing app modules now is safe: DATABASE_URL was set above.
    from app.database import Base
    # Import models so Base.metadata is fully populated before create_all.
    import app.models  # noqa: F401

    engine = create_engine(TEST_DATABASE_URL, future=True)
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture(scope="session", autouse=True)
def _seed_reference_data(test_engine):
    """
    Seed the immutable reference tables (skills, role_profiles) once per session.

    These are read-only lookup rows the analysis engine depends on. They are
    committed to the test DB and persist across tests; per-test writes are still
    isolated by the transaction-rollback `db_session` fixture below.
    """
    from app.main import seed_skills, seed_role_profiles

    SessionSeed = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)
    db = SessionSeed()
    try:
        seed_skills(db)
        seed_role_profiles(db)
    finally:
        db.close()


# ── 4. Function-scoped session with transaction-rollback isolation ───────────
@pytest.fixture
def db_session(test_engine):
    """
    A SQLAlchemy session wrapped in an outer transaction that is ALWAYS rolled
    back at the end of the test. Even though application code calls
    `db.commit()` freely, those commits land on a SAVEPOINT that is discarded,
    so no test ever leaves rows behind. Tests are fully isolated and order-
    independent.

    NOTE: this covers code that receives a session via dependency injection
    (the request path). Background tasks that open their own SessionLocal()
    bypass this rollback — we'll handle those explicitly when we test them.
    """
    connection = test_engine.connect()
    outer = connection.begin()
    SessionTest = sessionmaker(
        bind=connection, autoflush=False, autocommit=False, expire_on_commit=False
    )
    session = SessionTest()
    nested = connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart_savepoint(sess, trans):
        nonlocal nested
        if not nested.is_active:
            nested = connection.begin_nested()

    try:
        yield session
    finally:
        event.remove(session, "after_transaction_end", _restart_savepoint)
        session.close()
        if outer.is_active:
            outer.rollback()
        connection.close()


# ── 5. TestClient with get_db overridden and rate limiting disabled ──────────
@pytest.fixture
def client(db_session):
    """
    FastAPI TestClient whose `get_db` dependency yields the rollback-scoped
    `db_session`, so HTTP requests and assertions share one transaction.

    Instantiated without the `with` block on purpose: that skips the lifespan
    startup (seeding / raw schema patches), which we don't want re-running on
    every test — schema and seeds are handled by the session fixtures above.
    """
    from app.main import app
    from app.dependencies import get_db

    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db

    # slowapi limiter is global; disable it so per-test request bursts don't 429.
    previous_enabled = getattr(app.state.limiter, "enabled", True)
    app.state.limiter.enabled = False

    test_client = TestClient(app)
    try:
        yield test_client
    finally:
        app.dependency_overrides.clear()
        app.state.limiter.enabled = previous_enabled


# ── 6. OpenAI guard: no test ever hits the real API ──────────────────────────
@pytest.fixture(autouse=True)
def _no_real_openai(monkeypatch):
    """
    Hard safety net: force ai_service._get_client() to return None in every test
    by default. The AI functions all short-circuit to their graceful fallback
    when the client is None, so this also exercises one of the fallback paths.

    To test the *happy* AI path or the structured-output→JSON fallback, a test
    can override this by monkeypatching `app.services.ai_service._get_client`
    to return a configured fake client (see the `mock_openai_client` helper).
    """
    monkeypatch.setattr(
        "app.services.ai_service._get_client", lambda: None, raising=True
    )


@pytest.fixture
def mock_openai_client(monkeypatch):
    """
    Helper for tests that need a *working* (fake) OpenAI client. Returns a
    MagicMock standing in for the OpenAI SDK client; the test configures its
    return values, then this fixture wires it in as ai_service._get_client().

    Example:
        def test_ai_happy_path(mock_openai_client, ...):
            parsed = CVAnalysis(executive_summary="...", strengths=[...], ...)
            mock_openai_client.beta.chat.completions.parse.return_value = (
                SimpleNamespace(choices=[SimpleNamespace(
                    message=SimpleNamespace(parsed=parsed))])
            )
            ...
    """
    from unittest.mock import MagicMock

    fake_client = MagicMock(name="FakeOpenAIClient")
    monkeypatch.setattr(
        "app.services.ai_service._get_client", lambda: fake_client, raising=True
    )
    # is_ai_enabled() also checks settings; make sure it reports enabled.
    monkeypatch.setattr(
        "app.services.ai_service.is_ai_enabled", lambda: True, raising=True
    )
    return fake_client


# ── 7. Auth helpers: create users and build Bearer headers ───────────────────
@pytest.fixture
def make_user(db_session):
    """
    Factory that inserts a User into the test DB and returns it.

    Usage:
        user = make_user()                                  # default free user
        admin = make_user(email="a@x.com", role="admin")
        pro = make_user(email="p@x.com", plan_type="premium")
    """
    from app.models.user import User
    from app.auth.hashing import hash_password

    created: list = []

    def _make(
        email: str = "user@test.com",
        password: str = "Passw0rd!",
        full_name: str = "Test User",
        role: str = "user",
        plan_type: str = "free",
        **extra,
    ) -> "User":
        user = User(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            role=role,
            plan_type=plan_type,
            **extra,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        created.append(user)
        return user

    return _make


@pytest.fixture
def make_cv(db_session):
    """
    Factory that inserts a CV row owned by `owner` and returns it.

    `file_path` deliberately points at a non-existent path so delete_cv exercises
    its "file already gone" branch without touching the real filesystem. Each row
    gets a unique `stored_filename` (DB unique constraint) via uuid.

    Usage:
        cv = make_cv(user)                       # completed pdf, default domain
        cv = make_cv(user, status="pending")
    """
    import uuid as _uuid
    from app.models.cv import CV

    def _make(
        owner,
        *,
        original_filename: str = "resume.pdf",
        file_type: str = "pdf",
        file_size: int = 1024,
        status: str = "completed",
        target_domain: str = "Software Engineering",
        extracted_text: str | None = None,
        file_content: bytes | None = None,
        **extra,
    ) -> "CV":
        stored = f"{_uuid.uuid4().hex}.{file_type}"
        cv = CV(
            user_id=owner.id,
            original_filename=original_filename,
            stored_filename=stored,
            file_path=f"/nonexistent/{stored}",
            file_type=file_type,
            file_size=file_size,
            status=status,
            target_domain=target_domain,
            extracted_text=extracted_text,
            file_content=file_content,
            **extra,
        )
        db_session.add(cv)
        db_session.commit()
        db_session.refresh(cv)
        return cv

    return _make


@pytest.fixture
def auth_headers():
    """
    Build an Authorization header for a given user, using the SAME token factory
    the production login endpoint uses ({"sub": str(user.id)}), so tests exercise
    the real auth path.

    Usage:
        resp = client.get("/cvs/", headers=auth_headers(user))
    """
    from app.auth.jwt_handler import create_access_token

    def _headers(user) -> dict:
        token = create_access_token(data={"sub": str(user.id)})
        return {"Authorization": f"Bearer {token}"}

    return _headers
