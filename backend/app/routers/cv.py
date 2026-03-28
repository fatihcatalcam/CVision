"""
CV router — handles CV upload, retrieval, listing, and deletion.
All endpoints require authentication.

Endpoints:
    POST   /cvs/upload     — Upload a CV file (PDF or TXT)
    GET    /cvs/           — List current user's CVs
    GET    /cvs/{cv_id}    — Get detailed CV info
    DELETE /cvs/{cv_id}    — Delete a CV and its file

Implements FR4, FR5, FR6, FR7, FR19, FR21, FR22.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.cv import CVResponse, CVDetailResponse, CVListResponse
from app.services.cv_service import CVService

logger = logging.getLogger("cvision.routers.cv")

router = APIRouter(prefix="/cvs", tags=["CV Management"])


@router.post(
    "/upload",
    response_model=CVResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a CV file",
)
async def upload_cv(
    file: UploadFile = File(..., description="CV file (PDF or TXT, max 5MB)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a CV file for analysis.

    - Accepts PDF and TXT files (max 5MB)
    - Extracts text content automatically
    - Stores the file with a UUID-based name for security
    - Returns the created CV metadata

    **Status lifecycle**: pending → processing → completed / failed
    """
    try:
        cv = await CVService.upload_cv(file, current_user, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return CVResponse(
        id=cv.id,
        original_filename=cv.original_filename,
        file_type=cv.file_type,
        file_size=cv.file_size,
        status=cv.status,
        uploaded_at=cv.uploaded_at,
        has_analysis=cv.analysis_result is not None,
    )


@router.get(
    "/",
    response_model=CVListResponse,
    summary="List user's CVs",
)
def list_cvs(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Max records to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all CVs belonging to the authenticated user.
    Supports pagination via `skip` and `limit` query parameters.
    Results are ordered by upload date (newest first).
    """
    cvs, total = CVService.list_user_cvs(current_user, db, skip, limit)

    return CVListResponse(
        cvs=[
            CVResponse(
                id=cv.id,
                original_filename=cv.original_filename,
                file_type=cv.file_type,
                file_size=cv.file_size,
                status=cv.status,
                uploaded_at=cv.uploaded_at,
                has_analysis=cv.analysis_result is not None,
            )
            for cv in cvs
        ],
        total=total,
    )


@router.get(
    "/{cv_id}",
    response_model=CVDetailResponse,
    summary="Get CV details",
)
def get_cv(
    cv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get detailed information about a specific CV, including a preview
    of the extracted text (first 500 characters).
    Users can only access their own CVs.
    """
    cv = CVService.get_cv(cv_id, current_user, db)

    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CV with id {cv_id} not found",
        )

    return CVDetailResponse(
        id=cv.id,
        original_filename=cv.original_filename,
        file_type=cv.file_type,
        file_size=cv.file_size,
        status=cv.status,
        uploaded_at=cv.uploaded_at,
        extracted_text_preview=(
            cv.extracted_text[:500] if cv.extracted_text else None
        ),
    )


@router.delete(
    "/{cv_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a CV",
)
def delete_cv(
    cv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a CV and its associated file from storage.
    Also removes any related analysis results, suggestions, and recommendations
    via cascade delete.
    Users can only delete their own CVs.
    """
    cv = CVService.get_cv(cv_id, current_user, db)

    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CV with id {cv_id} not found",
        )

    CVService.delete_cv(cv, db)

    return None
