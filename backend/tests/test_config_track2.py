"""Track 2 config: recovery + Sentry settings have sane defaults."""
from app.config import settings


def test_recovery_defaults():
    assert settings.STUCK_JOB_TIMEOUT_MINUTES == 10
    assert settings.MAX_JOB_RETRIES == 3


def test_sentry_defaults_disabled():
    # Empty DSN means Sentry is a no-op (see app/observability.py).
    assert settings.SENTRY_DSN == ""
    assert settings.SENTRY_TRACES_SAMPLE_RATE == 0.0
