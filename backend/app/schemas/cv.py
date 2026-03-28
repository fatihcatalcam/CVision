"""
CV schemas — request/response validation for CV upload and retrieval.
"""

from datetime import datetime
from pydantic import BaseModel


class CVResponse(BaseModel):
    """CV metadata returned in API responses."""
    id: int
    original_filename: str
    file_type: str
    file_size: int
    status: str
    uploaded_at: datetime
    has_analysis: bool = False
    target_domain: str | None = None

    model_config = {"from_attributes": True}


class CVDetailResponse(BaseModel):
    """Detailed CV response including extracted text preview."""
    id: int
    original_filename: str
    file_type: str
    file_size: int
    status: str
    uploaded_at: datetime
    target_domain: str | None = None
    extracted_text_preview: str | None = None  # First 500 chars

    model_config = {"from_attributes": True}


class CVListResponse(BaseModel):
    """Paginated list of CVs."""
    cvs: list[CVResponse]
    total: int
