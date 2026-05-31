"""The cvs table gains processing_started_at + retry_count with safe defaults."""


def test_new_cv_has_recovery_defaults(make_user, make_cv):
    user = make_user(email="rec@test.com")
    cv = make_cv(user, status="pending")
    assert cv.retry_count == 0
    assert cv.processing_started_at is None
