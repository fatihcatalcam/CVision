"""
Email service - sends transactional emails via Resend HTTP API.
"""

import logging
import resend
import secrets
import string
from datetime import datetime, timedelta

from app.config import settings
from app.services import email_templates

logger = logging.getLogger("cvision.services.email")


def check_email_config() -> None:
    """Log loudly at startup when outbound mail cannot possibly work.

    Every send failure here is swallowed into a log line, so a misconfiguration
    is invisible: users simply never get their welcome or reset mail and nothing
    surfaces. That is exactly how the resend.dev default went unnoticed. This
    turns the two fatal cases into something you see on the first boot.
    """
    if not settings.RESEND_API_KEY:
        logger.warning(
            "EMAIL DISABLED: RESEND_API_KEY is empty. Welcome and password-reset "
            "mails will be skipped."
        )
        return
    if "resend.dev" in settings.EMAIL_FROM:
        logger.error(
            "EMAIL BROKEN: EMAIL_FROM is %r, which is Resend's shared test "
            "address. It only delivers to the Resend account owner and returns "
            "403 for every other recipient. Set EMAIL_FROM to an address on a "
            "domain verified in Resend.",
            settings.EMAIL_FROM,
        )
        return
    logger.info("Email configured: sending as %s", settings.EMAIL_FROM)


def _send(to_email: str, subject: str, html_body: str) -> bool:
    """Send one mail via Resend, returning whether it was accepted.

    Reply-To is set on every message because the domain has receiving disabled -
    without it a reply to EMAIL_FROM goes nowhere, and the welcome mail asks for
    replies directly.
    """
    resend.api_key = settings.RESEND_API_KEY
    payload = {
        "from": settings.EMAIL_FROM,
        "to": [to_email],
        "subject": subject,
        "html": html_body,
    }
    if settings.EMAIL_REPLY_TO:
        payload["reply_to"] = settings.EMAIL_REPLY_TO

    try:
        resend.Emails.send(payload)
        logger.info("Sent %r to %s", subject, to_email)
        return True
    except Exception as e:
        logger.error("Failed to send %r to %s: %s", subject, to_email, e)
        return False


def generate_reset_code() -> str:
    """Generate a 5-character case-sensitive alphanumeric reset code (e.g. A3b2X)."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(5))


def get_reset_code_expiry() -> datetime:
    """Return expiry timestamp 10 minutes from now."""
    return datetime.utcnow() + timedelta(minutes=10)


def send_reset_password_email(
    to_email: str, code: str, full_name: str, language: str | None = None
) -> bool:
    """Send the password-reset code in the user's language."""
    if not settings.RESEND_API_KEY:
        logger.warning(
            "Resend API key not configured - skipping email send. Reset code: %s", code
        )
        return False

    subject, html = email_templates.reset_password(
        code, full_name.strip().split()[0], language
    )
    return _send(to_email, subject, html)


def send_welcome_email(to_email: str, full_name: str, language: str | None = None) -> None:
    """Send the founder's welcome letter in the user's language."""
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set, skipping welcome email.")
        return

    subject, html = email_templates.welcome(full_name.strip().split()[0], language)
    _send(to_email, subject, html)
