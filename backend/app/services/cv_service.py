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
    ALLOWED_MIME_TYPES,
)

logger = logging.getLogger("cvision.services.cv")


class CVService:
    """Handles all CV-related business logic."""

    @staticmethod
    def validate_file(file: UploadFile) -> tuple[str, str]:
        """
        Validate the uploaded file's name, extension, MIME type, and size.

        Returns:
            Tuple of (original_filename, file_extension).

        Raises:
            ValueError: If validation fails.
        """
        if not file.filename:
            raise ValueError("File must have a filename.")

        extension = get_extension_from_filename(file.filename)
        
        # Stricter MIME type checking against parser_factory declarations
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise ValueError(
                f"Invalid file MIME type '{file.content_type}'. "
                f"Supported types: {', '.join(ALLOWED_MIME_TYPES.keys())}"
            )

        # Cross-check MIME correlates to extension
        if ALLOWED_MIME_TYPES[file.content_type] != extension:
            raise ValueError(
                f"File extension '.{extension}' does not match its content type '{file.content_type}'."
            )

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
        Upload pipeline: validate → save → create DB record -> fast return.
        
        The analysis must be dispatched to background_process_cv separately.
        """
        # Step 1: Validate file
        original_filename, extension = CVService.validate_file(file)

        # Step 2: Save to disk
        stored_filename, file_path, file_size = await CVService.save_file(
            file, extension
        )

        from fastapi import HTTPException
        from datetime import datetime, timezone, timedelta
        
        # Atomic Quota Check & Increment
        user_db = db.query(User).filter(User.id == user.id).with_for_update().first()
        now = datetime.now(timezone.utc)
        now_naive = datetime.utcnow()

        def _as_naive(dt):
            return dt.replace(tzinfo=None) if dt.tzinfo else dt

        if user_db.quota_reset_at and _as_naive(user_db.quota_reset_at) < now_naive:
            user_db.analysis_count = 0
            user_db.quota_reset_at = now_naive + timedelta(days=7)
        elif not user_db.quota_reset_at:
            user_db.quota_reset_at = now_naive + timedelta(days=7)
            
        limit = settings.PREMIUM_WEEKLY_LIMIT if user_db.plan_type == "premium" else settings.FREE_WEEKLY_LIMIT
        
        if user_db.analysis_count >= limit:
            raise HTTPException(status_code=403, detail="Weekly upload quota exceeded.")
            
        user_db.analysis_count += 1

        # Step 3: Create DB record with 'pending' status
        cv = CV(
            user_id=user.id,
            original_filename=original_filename,
            stored_filename=stored_filename,
            file_path=str(file_path),
            file_type=extension,
            file_size=file_size,
            status="pending",
            target_domain=target_domain,
        )
        db.add(cv)
        db.commit()
        db.refresh(cv)

        logger.info(f"CV record created: id={cv.id}, user={user.id}")
        return cv

    @staticmethod
    def process_analysis_background(cv_id: int):
        """
        Background task to handle parsing and analysis automatically.
        """
        from app.database import SessionLocal
        from app.services.analysis_service import AnalysisService
        
        db = SessionLocal()
        logger.info(f"Background task starting for CV {cv_id}")
        
        try:
            # Check exist and lock
            cv = db.query(CV).filter(CV.id == cv_id).first()
            if not cv:
                logger.error(f"CV {cv_id} not found for background processing")
                return
                
            logger.info(f"Background task starting for CV {cv_id} (User {cv.user_id})")
                
            # Update status
            cv.status = "processing"
            db.commit()
            
            # 1. Parse Text
            cv.extracted_text = CVService.extract_text(Path(cv.file_path), cv.file_type)
            db.commit()
            
            # 2. Run Engine
            logger.info("Text processing completed, launching analysis engine...")
            AnalysisService.run_analysis(cv, db)
            
            # 3. Mark as completed after analysis
            cv.status = "completed"
            db.commit()
            logger.info(f"Background task successfully completed for CV {cv_id}")
            
        except Exception as e:
            import traceback
            with open("crash_log.txt", "w") as f:
                f.write(traceback.format_exc())
            logger.error(f"Background task failed for CV {cv_id}: {str(e)}")
            # Fallback handling
            db.rollback()
            cv = db.query(CV).filter(CV.id == cv_id).first()
            if cv:
                cv.status = "failed"
                db.commit()
        finally:
            db.close()

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
        Get a specific CV by ID. 
        Enforces user isolation by raising an error if the user tries to access a CV they don't own.
        """
        from fastapi import HTTPException
        
        cv = db.query(CV).filter(CV.id == cv_id).first()
        
        if cv is None:
            return None
            
        if cv.user_id != user.id and user.role != "admin":
            logger.warning(f"SECURITY: User {user.id} attempted to access CV {cv_id} owned by {cv.user_id}")
            raise HTTPException(
                status_code=403,
                detail="Forbidden: You do not have permission to access this CV."
            )
            
        return cv

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
