"""
CV schemas — request/response validation for CV upload and retrieval.
"""

from datetime import datetime
from pydantic import BaseModel, field_validator
from app.utils.hashids import encode_id


class CVResponse(BaseModel):
    """CV metadata returned in API responses."""
    id: str
    original_filename: str
    file_type: str
    file_size: int
    status: str
    uploaded_at: datetime
    has_analysis: bool = False
    target_domain: str | None = None
    model_config = {"from_attributes": True}

    @field_validator('id', mode='before')
    @classmethod
    def encode_cv_id(cls, v):
        if isinstance(v, int):
            return encode_id(v)
        return v


class CVDetailResponse(BaseModel):
    """Detailed CV response including extracted text preview."""
    id: str
    original_filename: str
    file_type: str
    file_size: int
    status: str
    uploaded_at: datetime
    target_domain: str | None = None
    extracted_text_preview: str | None = None  # First 500 chars
    model_config = {"from_attributes": True}

    @field_validator('id', mode='before')
    @classmethod
    def encode_cv_id(cls, v):
        if isinstance(v, int):
            return encode_id(v)
        return v


class CVListResponse(BaseModel):
    """Paginated list of CVs."""
    cvs: list[CVResponse]
    total: int
