"""
Sentry initialization, guarded by the SENTRY_DSN setting.

When SENTRY_DSN is empty (local dev, CI, tests) this is a complete no-op and
imports nothing from sentry_sdk, so no secret or network access is required in
those environments. Production sets SENTRY_DSN in the Render dashboard.
"""
import logging

from app.config import settings

logger = logging.getLogger("cvision.observability")


def _sentry_init(**kwargs) -> None:
    """Thin wrapper around sentry_sdk.init so tests can patch it cheaply."""
    import sentry_sdk

    sentry_sdk.init(**kwargs)


def init_sentry() -> bool:
    """Initialize Sentry if a DSN is configured. Returns True if initialized."""
    if not settings.SENTRY_DSN:
        return False

    _sentry_init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
    )
    logger.info("Sentry initialized.")
    return True
