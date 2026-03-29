"""
Suggestion schemas — response validation for improvement suggestions.
"""

from pydantic import BaseModel


class SuggestionResponse(BaseModel):
    """Individual improvement suggestion."""
    id: int
    category: str
    priority: str
    message: str
    snippets: list[str] = []

    model_config = {"from_attributes": True}
