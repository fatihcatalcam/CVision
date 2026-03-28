"""
Analysis router — triggers CV analysis and returns results.
Will be fully implemented in Phase 5.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/analysis", tags=["Analysis"])


# Placeholder — Phase 5 will add:
# POST /analysis/{cv_id}          — Trigger analysis for a CV
# GET  /analysis/{cv_id}/results  — Get analysis results
