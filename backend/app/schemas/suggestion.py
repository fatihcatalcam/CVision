"""
Suggestion schemas — response validation for improvement suggestions.
"""

from pydantic import BaseModel, field_validator
from app.utils.hashids import encode_id


class SuggestionResponse(BaseModel):
    """Individual improvement suggestion."""
    id: str
    category: str
    priority: str
    message: str
    snippets: list[str] = []

    model_config = {"from_attributes": True}

    @field_validator('id', mode='before')
    @classmethod
    def encode_ids(cls, v):
        if isinstance(v, int):
            return encode_id(v)
        return v
