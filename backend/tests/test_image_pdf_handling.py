# -*- coding: utf-8 -*-
"""Image-only PDFs must fail with a distinct, actionable reason.

A real founder-reported CV (designed in Canva, exported as a flattened image)
extracted 0 characters of text, so validate_extraction raised a bare ValueError
and the background task marked it "failed" - the user saw a generic "analysis
failed" with no way to understand that their CV is an image no ATS can read.

These guard the distinct EmptyTextError -> status "failed_no_text" path, which
the frontend turns into a specific localized message.
"""

import fitz  # PyMuPDF
import pytest

from app.database import SessionLocal
from app.models.cv import CV
from app.models.user import User
from app.auth.hashing import hash_password
from app.parsing.base_parser import EmptyTextError
from app.parsing.pdf_parser import PdfParser
from app.parsing.txt_parser import TxtParser
from app.services.cv_service import CVService


def test_empty_text_error_is_a_value_error():
    # Existing `except ValueError` / `except Exception` sites must still catch it.
    assert issubclass(EmptyTextError, ValueError)


def test_validate_extraction_raises_on_blank_text():
    with pytest.raises(EmptyTextError):
        TxtParser().validate_extraction("   \n  ", "blank.txt")


def test_validate_extraction_raises_on_too_short_text():
    # Below MIN_TEXT_LENGTH: effectively unreadable, same guidance applies.
    with pytest.raises(EmptyTextError):
        TxtParser().validate_extraction("too short", "tiny.txt")


def test_validate_extraction_passes_real_text():
    text = "John Doe " * 20  # comfortably over MIN_TEXT_LENGTH
    assert TxtParser().validate_extraction(text, "ok.txt").strip()


def test_image_only_pdf_raises_empty_text_error(tmp_path):
    # A page with no text layer reproduces the founder's Canva-exported CV:
    # PyMuPDF's get_text returns nothing.
    pdf_path = tmp_path / "image_only.pdf"
    doc = fitz.open()
    doc.new_page()  # blank page, zero text
    doc.save(str(pdf_path))
    doc.close()

    with pytest.raises(EmptyTextError):
        PdfParser().extract_text(pdf_path)


def _make_cv_and_run(monkeypatch, extract_side_effect):
    """Run the background task with a stubbed extract_text, return final status.

    The task opens its own SessionLocal (outside the test's rollback), so this
    commits real rows and cleans them up, mirroring test_pipeline_processing_started.
    """
    monkeypatch.setattr(
        CVService, "extract_text",
        staticmethod(lambda path, ftype: (_ for _ in ()).throw(extract_side_effect)),
    )

    setup = SessionLocal()
    try:
        user = User(
            full_name="Img User", email="imgpdf@test.com",
            password_hash=hash_password("Passw0rd!"), role="user", plan_type="free",
        )
        setup.add(user)
        setup.commit()
        setup.refresh(user)
        cv = CV(
            user_id=user.id, original_filename="r.pdf",
            stored_filename="imgpdf-unique.pdf", file_path="/nonexistent/x.pdf",
            file_type="pdf", file_size=10, status="pending",
        )
        setup.add(cv)
        setup.commit()
        setup.refresh(cv)
        cv_id, user_id = cv.id, user.id
    finally:
        setup.close()

    try:
        CVService.process_analysis_background(cv_id)
        check = SessionLocal()
        try:
            return check.query(CV).filter(CV.id == cv_id).first().status
        finally:
            check.close()
    finally:
        cleanup = SessionLocal()
        try:
            cleanup.query(CV).filter(CV.id == cv_id).delete()
            cleanup.query(User).filter(User.id == user_id).delete()
            cleanup.commit()
        finally:
            cleanup.close()


def test_background_task_marks_image_pdf_as_failed_no_text(monkeypatch):
    status = _make_cv_and_run(
        monkeypatch, EmptyTextError("No text could be extracted")
    )
    assert status == "failed_no_text"


def test_background_task_marks_other_errors_as_plain_failed(monkeypatch):
    # A genuine crash (not an image PDF) still maps to the generic failure.
    status = _make_cv_and_run(monkeypatch, RuntimeError("something else broke"))
    assert status == "failed"
