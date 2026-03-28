"""
Recommendations router — retrieves career recommendations for an analysis.
Will be fully implemented in Phase 6.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/recommendations", tags=["Career Recommendations"])


# Placeholder — Phase 6 will add:
# GET /recommendations/{analysis_id}  — Get career recommendations
