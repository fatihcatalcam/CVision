"""process_analysis_background sets processing_started_at when work begins."""
from app.database import SessionLocal
from app.models.cv import CV
from app.models.user import User
from app.auth.hashing import hash_password
from app.services.cv_service import CVService


def test_processing_started_at_is_set(monkeypatch):
    # Background task uses its own SessionLocal -> commit real rows, clean up.
    monkeypatch.setattr(CVService, "extract_text", staticmethod(lambda path, ftype: "text"))
    monkeypatch.setattr(
        "app.services.analysis_service.AnalysisService.run_analysis",
        staticmethod(lambda cv, db, ui_language=None: None),
    )

    setup = SessionLocal()
    try:
        user = User(
            full_name="Pipe User", email="pipe@test.com",
            password_hash=hash_password("Passw0rd!"), role="user", plan_type="free",
        )
        setup.add(user)
        setup.commit()
        setup.refresh(user)

        cv = CV(
            user_id=user.id, original_filename="r.pdf",
            stored_filename="pipe-unique.pdf", file_path="/nonexistent/pipe.pdf",
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
            done = check.query(CV).filter(CV.id == cv_id).first()
            assert done.processing_started_at is not None
            assert done.status == "completed"
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
