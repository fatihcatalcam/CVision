# -*- coding: utf-8 -*-
"""Transactional mail must follow the language the account was created in.

Before users.language existed there was no signal to go on, so the copy was
hardcoded: the welcome mail English, the reset mail Turkish. Every user got at
least one of them in a language they had not chosen - a German user asking to
reset their password received "Şifre Sıfırlama Kodunuz".

Only Turkish and English have copy. Everything else resolves to English, which
is deliberate (see email_templates), so es/de/fr are asserted here as English
rather than treated as gaps.
"""

import pytest

from app.config import settings
from app.services import email_service, email_templates


@pytest.fixture
def captured(monkeypatch):
    """Capture the Resend payload instead of sending."""
    box: dict = {}
    monkeypatch.setattr(settings, "RESEND_API_KEY", "test-key")
    monkeypatch.setattr(
        email_service.resend.Emails, "send", lambda payload: box.update(payload)
    )
    return box


# ── resolve ───────────────────────────────────────────────────────────────────

@pytest.mark.parametrize(
    "given,expected",
    [
        ("tr", "tr"),
        ("TR", "tr"),
        ("tr-TR", "tr"),
        ("en", "en"),
        ("en-GB", "en"),
        # No copy for these; English is the documented fallback, not an oversight.
        ("es", "en"),
        ("de", "en"),
        ("fr", "en"),
        # Accounts created before the column existed.
        (None, "en"),
        ("", "en"),
    ],
)
def test_resolve_collapses_to_a_language_we_have_copy_for(given, expected):
    assert email_templates.resolve(given) == expected


# ── Welcome ───────────────────────────────────────────────────────────────────

def test_turkish_user_gets_the_turkish_welcome(captured):
    email_service.send_welcome_email("a@test.com", "Rabia Algan", "tr")

    assert captured["subject"] == "CVision'a hoş geldin - kurucudan kısa bir not"
    assert "Merhaba Rabia" in captured["html"]
    assert "Kurucu, CVision" in captured["html"]


def test_english_user_gets_the_english_welcome(captured):
    email_service.send_welcome_email("a@test.com", "Ada Lovelace", "en")

    assert captured["subject"] == "Welcome to CVision, a quick note from the founder"
    assert "Hi Ada" in captured["html"]
    assert "Founder, CVision" in captured["html"]


def test_legacy_user_without_a_language_gets_english(captured):
    email_service.send_welcome_email("a@test.com", "Ada Lovelace", None)

    assert captured["subject"] == "Welcome to CVision, a quick note from the founder"


def test_unsupported_language_falls_back_to_english(captured):
    email_service.send_welcome_email("a@test.com", "Hans Zimmer", "de")

    assert captured["subject"] == "Welcome to CVision, a quick note from the founder"
    assert "Hi Hans" in captured["html"]


# ── Password reset ────────────────────────────────────────────────────────────

def test_turkish_user_gets_the_turkish_reset(captured):
    email_service.send_reset_password_email("a@test.com", "A3b2X", "Rabia Algan", "tr")

    assert captured["subject"] == "CVision - Şifre Sıfırlama Kodunuz"
    assert "Şifre Sıfırlama" in captured["html"]
    assert "A3b2X" in captured["html"]


def test_english_user_no_longer_gets_a_turkish_reset(captured):
    # This is the bug that motivated the change.
    email_service.send_reset_password_email("a@test.com", "A3b2X", "Hans Zimmer", "de")

    assert captured["subject"] == "CVision - Your password reset code"
    assert "Şifre" not in captured["html"]
    assert "Password reset" in captured["html"]
    assert "A3b2X" in captured["html"]


# ── End to end through the API ────────────────────────────────────────────────

def test_registration_stores_the_language(client, db_session):
    from app.models.user import User

    resp = client.post(
        "/auth/register",
        json={
            "full_name": "Rabia Algan",
            "email": "lang-tr@test.com",
            "password": "Passw0rd!",
            "language": "tr",
        },
    )

    assert resp.status_code == 201
    user = db_session.query(User).filter(User.email == "lang-tr@test.com").one()
    assert user.language == "tr"


def test_registration_without_a_language_is_still_accepted(client, db_session):
    from app.models.user import User

    resp = client.post(
        "/auth/register",
        json={
            "full_name": "Ada Lovelace",
            "email": "lang-none@test.com",
            "password": "Passw0rd!",
        },
    )

    assert resp.status_code == 201
    user = db_session.query(User).filter(User.email == "lang-none@test.com").one()
    assert user.language is None
