"""
Alembic migration runner used at application startup.

Replaces the old `Base.metadata.create_all()` + raw ALTER patches. It makes
`alembic upgrade head` safe across three DB states:

  * fresh DB (no tables, no alembic_version) -> upgrade from base builds all.
  * legacy pre-Alembic prod DB (tables exist, but no alembic_version) -> stamp
    the catch-up baseline revision (its schema already matches), THEN upgrade
    so the post-baseline migrations (e.g. recovery columns) are applied.
  * already-migrated DB (alembic_version present) -> just upgrade.
"""
import logging

from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from sqlalchemy import inspect

logger = logging.getLogger("cvision.db_migrations")

# The revision the legacy prod schema is equivalent to. A pre-Alembic DB is
# stamped here so only genuinely-new migrations run afterwards.
CATCHUP_BASELINE_REVISION = "d1e2f3a4b5c6"


def _make_config() -> Config:
    # alembic.ini lives in the backend/ working directory; env.py pulls the URL
    # from app settings, so no sqlalchemy.url override is needed here.
    return Config("alembic.ini")


def _current_revision(engine) -> str | None:
    with engine.connect() as conn:
        return MigrationContext.configure(conn).get_current_revision()


def _has_table(engine, name: str) -> bool:
    return inspect(engine).has_table(name)


def run_migrations(engine) -> str:
    """Bring the DB up to head, baselining a legacy prod DB if needed.

    Returns one of "fresh", "baselined", "upgraded" (for logging/tests).
    """
    cfg = _make_config()
    current = _current_revision(engine)

    if current is None:
        if _has_table(engine, "users"):
            logger.info(
                "Legacy DB detected (tables present, no alembic_version); "
                "stamping baseline %s then upgrading.",
                CATCHUP_BASELINE_REVISION,
            )
            command.stamp(cfg, CATCHUP_BASELINE_REVISION)
            command.upgrade(cfg, "head")
            return "baselined"
        logger.info("Fresh DB detected; building schema from migrations.")
        command.upgrade(cfg, "head")
        return "fresh"

    logger.info("DB at revision %s; upgrading to head.", current)
    command.upgrade(cfg, "head")
    return "upgraded"
