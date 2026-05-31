"""
Startup recovery sweep for the in-process CV analysis pipeline.

If the Render instance restarts/redeploys mid-analysis, a CV can be left stuck
in `pending` or `processing` forever (no retry, no queue). This sweep runs once
on boot: it re-queues interrupted jobs (bounded by MAX_JOB_RETRIES) and fails
the ones that have exhausted their retries.

Poison jobs (whose processing logic throws) already self-mark `failed` inside
CVService.process_analysis_background's except block, so this sweep only ever
sees genuinely INTERRUPTED jobs — re-queueing them is the right default.
"""
import logging
import threading
from datetime import datetime, timedelta, timezone
from typing import Callable

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.cv import CV

logger = logging.getLogger("cvision.services.job_recovery")


def _default_dispatch(cv_id: int) -> None:
    """Re-run analysis on a daemon thread so startup is not blocked."""
    from app.services.cv_service import CVService

    threading.Thread(
        target=CVService.process_analysis_background,
        args=(cv_id,),
        daemon=True,
    ).start()


def recover_stuck_jobs(
    db: Session,
    *,
    timeout_minutes: int,
    max_retries: int,
    dispatch: Callable[[int], None] = _default_dispatch,
) -> dict:
    """Re-queue or fail stuck CV jobs. Returns {"recovered": n, "failed": m}."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=timeout_minutes)

    stuck = (
        db.query(CV)
        .filter(
            or_(
                and_(CV.status == "pending", CV.uploaded_at < cutoff),
                and_(
                    CV.status == "processing",
                    or_(
                        CV.processing_started_at.is_(None),
                        CV.processing_started_at < cutoff,
                    ),
                ),
            )
        )
        .all()
    )

    recovered = 0
    failed = 0
    for cv in stuck:
        if cv.retry_count < max_retries:
            cv.retry_count += 1
            cv.status = "pending"
            cv.processing_started_at = None
            db.commit()
            dispatch(cv.id)
            recovered += 1
        else:
            cv.status = "failed"
            db.commit()
            failed += 1
            logger.warning(
                "CV %s exceeded %s retries; marked failed.", cv.id, max_retries
            )

    if recovered or failed:
        logger.info("Recovery sweep: %s recovered, %s failed.", recovered, failed)
    return {"recovered": recovered, "failed": failed}
