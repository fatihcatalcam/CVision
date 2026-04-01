"""
Dashboard schemas — response validation for user dashboard summaries.
"""

from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    """Metrics for the user's dashboard."""
    total_cvs: int
    total_analyses: int
    average_score: float | None
    latest_score: float | None

    model_config = {"from_attributes": True}
