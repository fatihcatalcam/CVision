"""
CV service — business logic for CV upload, retrieval, parsing, and deletion.
Handles file storage, text extraction, and database operations.
"""

import logging
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.models.cv import CV
from app.models.user import User
from app.parsing.parser_factory import (
    get_parser,
    get_extension_from_filename,
    ALLOWED_EXTENSIONS,
)

logger = logging.getLogger("cvision.services.cv")


class CVService:
    """Handles all CV-related business logic."""

    @staticmethod
    def validate_file(file: UploadFile) -> tuple[str, str]:
        """
        Validate the uploaded file's name, extension, and size.

        Returns:
            Tuple of (original_filename, file_extension).

        Raises:
            ValueError: If validation fails.
        """
        if not file.filename:
            raise ValueError("File must have a filename.")

        extension = get_extension_from_filename(file.filename)

        return file.filename, extension

    @staticmethod
    async def save_file(file: UploadFile, extension: str) -> tuple[str, Path, int]:
        """
        Save the uploaded file to disk with a UUID-based name.

        Returns:
            Tuple of (stored_filename, file_path, file_size_bytes).

        Raises:
            ValueError: If the file exceeds the maximum size.
        """
        # Generate UUID-based filename to prevent path traversal and collisions
        stored_filename = f"{uuid.uuid4().hex}.{extension}"
        file_path = settings.upload_path / stored_filename

        # Read file content and check size
        content = await file.read()
        file_size = len(content)

        if file_size == 0:
            raise ValueError("Uploaded file is empty.")

        if file_size > settings.max_file_size_bytes:
            raise ValueError(
                f"File size ({file_size / (1024 * 1024):.1f} MB) exceeds "
                f"maximum allowed size ({settings.MAX_FILE_SIZE_MB} MB)."
            )

        # Write to disk
        file_path.write_bytes(content)
        logger.info(
            f"Saved file: {stored_filename} ({file_size} bytes) to {file_path}"
        )

        return stored_filename, file_path, file_size

    @staticmethod
    def extract_text(file_path: Path, extension: str) -> str:
        """
        Extract text from the uploaded file using the appropriate parser.

        Returns:
            Extracted text string.

        Raises:
            ValueError: If text extraction fails.
        """
        parser = get_parser(extension)
        return parser.extract_text(file_path)

    @staticmethod
    async def upload_cv(
        file: UploadFile,
        target_domain: str,
        user: User,
        db: Session,
    ) -> CV:
        """
        Full upload pipeline: validate → save → extract text → persist to DB.

        Args:
            file: The uploaded file from the request.
            target_domain: The target profession domain for the CV analysis.
            user: The authenticated user performing the upload.
            db: Database session.

        Returns:
            The created CV record.

        Raises:
            ValueError: On validation or extraction failure.
        """
        # Step 1: Validate file
        original_filename, extension = CVService.validate_file(file)

        # Step 2: Save to disk
        stored_filename, file_path, file_size = await CVService.save_file(
            file, extension
        )

        # Step 3: Create DB record with 'processing' status
        cv = CV(
            user_id=user.id,
            original_filename=original_filename,
            stored_filename=stored_filename,
            file_path=str(file_path),
            file_type=extension,
            file_size=file_size,
            status="processing",
            target_domain=target_domain,
        )
        db.add(cv)
        db.commit()
        db.refresh(cv)

        logger.info(f"CV record created: id={cv.id}, user={user.id}")

        # Step 4: Extract text
        try:
            extracted_text = CVService.extract_text(file_path, extension)
            cv.extracted_text = extracted_text
            cv.status = "completed"
            logger.info(
                f"Text extraction successful for CV {cv.id}: "
                f"{len(extracted_text)} chars"
            )
        except ValueError as e:
            cv.status = "failed"
            logger.warning(f"Text extraction failed for CV {cv.id}: {e}")
            # We still keep the record — user can see it failed
            db.commit()
            raise ValueError(str(e))

        db.commit()
        db.refresh(cv)

        return cv

    @staticmethod
    def list_user_cvs(
        user: User,
        db: Session,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[CV], int]:
        """
        List all CVs belonging to a user with pagination.

        Returns:
            Tuple of (list of CVs, total count).
        """
        query = db.query(CV).filter(CV.user_id == user.id)
        total = query.count()
        cvs = (
            query
            .order_by(CV.uploaded_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return cvs, total

    @staticmethod
    def get_cv(cv_id: int, user: User, db: Session) -> CV | None:
        """
        Get a specific CV by ID, ensuring it belongs to the requesting user.
        """
        return (
            db.query(CV)
            .filter(CV.id == cv_id, CV.user_id == user.id)
            .first()
        )

    @staticmethod
    def delete_cv(cv: CV, db: Session) -> None:
        """
        Delete a CV record and its file from disk.
        """
        # Remove the physical file
        file_path = Path(cv.file_path)
        if file_path.exists():
            file_path.unlink()
            logger.info(f"Deleted file: {file_path}")
        else:
            logger.warning(f"File not found for deletion: {file_path}")

        # Remove the DB record (cascades to analysis, suggestions, etc.)
        db.delete(cv)
        db.commit()

        logger.info(f"Deleted CV record: id={cv.id}")
