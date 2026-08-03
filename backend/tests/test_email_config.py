# -*- coding: utf-8 -*-
"""Outbound mail must not be able to break silently again.

Nobody had ever received a welcome or password-reset mail: EMAIL_FROM defaulted
to onboarding@resend.dev, Resend's shared test address, which returns 403 for
any recipient other than the account owner. Every send failure is swallowed into
a log line, so there was nothing to notice - it took reading Resend's dashboard
by chance to find it.

These pin down the default, the Reply-To (the domain has receiving disabled, and
the welcome mail asks for replies), and the startup check that now shouts.
"""

import logging

import pytest

from app.config import settings
from app.services import email_service


def test_default_from_address_is_not_the_resend_test_domain():
    # The regression that mattered. A default pointing at resend.dev means an
    # unset EMAIL_FROM silently breaks production mail.
    assert "resend.dev" not in settings.EMAIL_FROM


def test_default_from_address_uses_the_verified_domain():
    assert "cvisionapp.com" in settings.EMAIL_FROM


def test_send_sets_reply_to(monkeypatch):
    sent: dict = {}
    monkeypatch.setattr(settings, "RESEND_API_KEY", "test-key")
    monkeypatch.setattr(settings, "EMAIL_REPLY_TO", "founder@example.com")
    monkeypatch.setattr(
        email_service.resend.Emails, "send", lambda payload: sent.update(payload)
    )

    assert email_service._send("user@example.com", "Subject", "<p>hi</p>") is True
    assert sent["reply_to"] == "founder@example.com"
    assert sent["to"] == ["user@example.com"]


def test_send_reports_failure_instead_of_raising(monkeypatch):
    # Callers run inside a BackgroundTask; an exception here would surface as a
    # 500 on a registration that actually succeeded.
    monkeypatch.setattr(settings, "RESEND_API_KEY", "test-key")

    def _boom(payload):
        raise RuntimeError("resend is down")

    monkeypatch.setattr(email_service.resend.Emails, "send", _boom)

    assert email_service._send("user@example.com", "Subject", "<p>hi</p>") is False


def test_welcome_email_is_skipped_without_an_api_key(monkeypatch):
    called = False

    def _track(payload):
        nonlocal called
        called = True

    monkeypatch.setattr(settings, "RESEND_API_KEY", "")
    monkeypatch.setattr(email_service.resend.Emails, "send", _track)

    email_service.send_welcome_email("user@example.com", "Ada Lovelace")

    assert called is False


@pytest.mark.parametrize(
    "from_address,level,needle",
    [
        ("CVision <onboarding@resend.dev>", logging.ERROR, "EMAIL BROKEN"),
        ("Fatih from CVision <fatih@cvisionapp.com>", logging.INFO, "Email configured"),
    ],
)
def test_startup_check_flags_the_test_domain(
    monkeypatch, caplog, from_address, level, needle
):
    monkeypatch.setattr(settings, "RESEND_API_KEY", "test-key")
    monkeypatch.setattr(settings, "EMAIL_FROM", from_address)

    with caplog.at_level(logging.INFO, logger="cvision.services.email"):
        email_service.check_email_config()

    matching = [r for r in caplog.records if r.levelno == level and needle in r.message]
    assert matching, f"expected a {logging.getLevelName(level)} mentioning {needle!r}"


def test_startup_check_warns_when_the_key_is_missing(monkeypatch, caplog):
    monkeypatch.setattr(settings, "RESEND_API_KEY", "")

    with caplog.at_level(logging.INFO, logger="cvision.services.email"):
        email_service.check_email_config()

    assert any("EMAIL DISABLED" in r.message for r in caplog.records)
