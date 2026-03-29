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

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status, Form, BackgroundTasks, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.cv import CVResponse, CVDetailResponse, CVListResponse
from app.services.cv_service import CVService
from app.limiter import limiter
from app.utils.hashids import decode_id

logger = logging.getLogger("cvision.routers.cv")

router = APIRouter(prefix="/cvs", tags=["CV Management"])


@router.post(
    "/upload",
    response_model=CVResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a CV file",
)
@limiter.limit("5/minute")
async def upload_cv(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="CV file (PDF or TXT, max 5MB)"),
    target_domain: str = Form("Software Engineering", description="Target profession domain (e.g., Software Engineering or Industrial Engineering)"),
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
    # The upload_cv service validates, saves, and creates the record quickly
    cv = await CVService.upload_cv(file, target_domain, current_user, db)
    
    # Delegate parsing and analysis to background task
    background_tasks.add_task(CVService.process_analysis_background, cv.id)

    return CVResponse(
        id=cv.id,
        original_filename=cv.original_filename,
        file_type=cv.file_type,
        file_size=cv.file_size,
        status=cv.status,
        uploaded_at=cv.uploaded_at,
        has_analysis=cv.analysis_result is not None,
        target_domain=cv.target_domain,
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
                target_domain=cv.target_domain,
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
    cv_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get detailed information about a specific CV, including a preview
    of the extracted text (first 500 characters).
    Users can only access their own CVs.
    """
    db_cv_id = decode_id(cv_id)
    cv = CVService.get_cv(db_cv_id, current_user, db)

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
        target_domain=cv.target_domain,
        extracted_text_preview=(
            cv.extracted_text[:500] if cv.extracted_text else None
        ),
    )


@router.get(
    "/{cv_id}/download",
    response_class=FileResponse,
    summary="Download original CV file",
)
def download_cv(
    cv_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Download or view the original CV file (PDF/txt).
    """
    db_cv_id = decode_id(cv_id)
    cv = CVService.get_cv(db_cv_id, current_user, db)

    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CV with id {cv_id} not found",
        )

    from pathlib import Path
    from app.config import settings
    import os

    target_path = Path(cv.file_path).resolve()
    base_path = Path(settings.upload_path).resolve()

    if not target_path.is_relative_to(base_path):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Path traversal detected.",
        )

    if not target_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File physically missing from server.",
        )

    return FileResponse(
        path=cv.file_path,
        filename=cv.original_filename,
        # Determine media type based on extension
        media_type="application/pdf" if cv.file_type == "pdf" else "text/plain",
        content_disposition_type="inline"  # Allows viewing in browser without forcing download
    )


class HighlightRequest(BaseModel):
    snippets: list[str] = []


@router.post(
    "/{cv_id}/preview",
    summary="Get PDF with highlighted problem areas",
)
def get_highlighted_pdf(
    cv_id: str,
    body: HighlightRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the original PDF with red highlight annotations
    drawn over the specified text snippets.
    """
    import os
    import io
    import fitz  # PyMuPDF
    from fastapi.responses import StreamingResponse

    db_cv_id = decode_id(cv_id)
    cv = CVService.get_cv(db_cv_id, current_user, db)

    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CV with id {cv_id} not found",
        )

    if cv.file_type != "pdf":
        raise HTTPException(
            status_code=400,
            detail="Highlighting is only supported for PDF files.",
        )

    from pathlib import Path
    from app.config import settings
    
    target_path = Path(cv.file_path).resolve()
    base_path = Path(settings.upload_path).resolve()

    if not target_path.is_relative_to(base_path):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Path traversal detected.",
        )

    if not target_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File physically missing from server.",
        )

    snippets = body.snippets
    if not snippets:
        # No highlights requested, just return the original
        return FileResponse(
            path=cv.file_path,
            filename=cv.original_filename,
            media_type="application/pdf",
            content_disposition_type="inline",
        )

    try:
        doc = fitz.open(cv.file_path)

        for page in doc:
            for snippet in snippets:
                # Search for each snippet on the page
                text_instances = page.search_for(snippet)
                for inst in text_instances:
                    # Add a red-ish highlight annotation
                    highlight = page.add_highlight_annot(inst)
                    # Set highlight color to red (RGB)
                    highlight.set_colors(stroke=(1.0, 0.2, 0.2))
                    highlight.set_opacity(0.4)
                    highlight.update()

        # Write annotated PDF to memory buffer
        pdf_bytes = doc.tobytes()
        doc.close()

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "inline; filename=highlighted_cv.pdf",
            },
        )

    except Exception as e:
        logger.error(f"Failed to highlight PDF: {e}")
        # Fallback: return the original PDF
        return FileResponse(
            path=cv.file_path,
            filename=cv.original_filename,
            media_type="application/pdf",
            content_disposition_type="inline",
        )


@router.delete(
    "/{cv_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a CV",
)
def delete_cv(
    cv_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a CV and its associated file from storage.
    Also removes any related analysis results, suggestions, and recommendations
    via cascade delete.
    Users can only delete their own CVs.
    """
    db_cv_id = decode_id(cv_id)
    cv = CVService.get_cv(db_cv_id, current_user, db)

    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CV with id {cv_id} not found",
        )

    CVService.delete_cv(cv, db)

    return None
