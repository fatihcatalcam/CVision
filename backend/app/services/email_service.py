"""
Email service — sends transactional emails via SMTP.
"""

import logging
import smtplib
import random
import secrets
import string
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger("cvision.services.email")


def generate_verification_code() -> str:
    """Generate a 5-digit numeric verification code."""
    return str(random.randint(10000, 99999))


def get_code_expiry() -> datetime:
    """Return expiry timestamp 10 minutes from now."""
    return datetime.utcnow() + timedelta(minutes=10)


def generate_reset_code() -> str:
    """Generate a 5-character case-sensitive alphanumeric reset code (e.g. A3b2X)."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(5))


def get_reset_code_expiry() -> datetime:
    """Return expiry timestamp 10 minutes from now."""
    return datetime.utcnow() + timedelta(minutes=10)


def send_verification_email(to_email: str, code: str, full_name: str) -> bool:
    """
    Send verification email with the 5-digit code.
    Returns True on success, False on failure.
    """
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME:
        logger.warning("SMTP not configured — skipping email send. Code: %s", code)
        return False

    subject = "CVision — E-posta Doğrulama Kodunuz"
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background:#0a0a12; color:#e2e8f0; margin:0; padding:0;">
      <div style="max-width:480px; margin:40px auto; background:#13131f; border-radius:16px; border:1px solid #2d2d4a; overflow:hidden;">
        <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:32px; text-align:center;">
          <h1 style="color:white; margin:0; font-size:24px; font-weight:900; letter-spacing:-0.5px;">CVision.</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:white; font-size:20px; margin:0 0 8px;">Merhaba, {full_name.split()[0]}!</h2>
          <p style="color:#94a3b8; font-size:14px; margin:0 0 28px; line-height:1.6;">
            Hesabını aktif etmek için aşağıdaki doğrulama kodunu kullan. Kod <strong style="color:#e2e8f0;">10 dakika</strong> geçerlidir.
          </p>
          <div style="background:#0a0a12; border:2px solid #4f46e5; border-radius:12px; padding:24px; text-align:center; margin-bottom:28px;">
            <span style="font-size:40px; font-weight:900; letter-spacing:12px; color:white; font-family:monospace;">{code}</span>
          </div>
          <p style="color:#64748b; font-size:12px; margin:0; line-height:1.6;">
            Bu kodu hiç kimseyle paylaşma. CVision ekibi senden kod istemez.
          </p>
        </div>
        <div style="padding:16px 32px; border-top:1px solid #2d2d4a;">
          <p style="color:#475569; font-size:11px; margin:0; text-align:center;">
            Bu e-postayı sen talep etmediysen dikkate alma.
          </p>
        </div>
      </div>
    </body>
    </html>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            if settings.SMTP_TLS:
                server.starttls()
                server.ehlo()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())

        logger.info("Verification email sent to %s", to_email)
        return True

    except Exception as e:
        logger.error("Failed to send verification email to %s: %s", to_email, e)
        return False


def send_reset_password_email(to_email: str, code: str, full_name: str) -> bool:
    """Send password reset email with the alphanumeric code."""
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME:
        logger.warning("SMTP not configured — skipping email send. Reset code: %s", code)
        return False

    subject = "CVision — Şifre Sıfırlama Kodunuz"
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background:#0a0a12; color:#e2e8f0; margin:0; padding:0;">
      <div style="max-width:480px; margin:40px auto; background:#13131f; border-radius:16px; border:1px solid #2d2d4a; overflow:hidden;">
        <div style="background:linear-gradient(135deg,#dc2626,#9333ea); padding:32px; text-align:center;">
          <h1 style="color:white; margin:0; font-size:24px; font-weight:900; letter-spacing:-0.5px;">CVision.</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:white; font-size:20px; margin:0 0 8px;">Şifre Sıfırlama</h2>
          <p style="color:#94a3b8; font-size:14px; margin:0 0 8px; line-height:1.6;">
            Merhaba, <strong style="color:#e2e8f0;">{full_name.split()[0]}</strong>!
          </p>
          <p style="color:#94a3b8; font-size:14px; margin:0 0 28px; line-height:1.6;">
            Aşağıdaki kodu kullanarak şifreni sıfırlayabilirsin. Kod <strong style="color:#e2e8f0;">10 dakika</strong> geçerlidir.
            Büyük/küçük harf duyarlıdır, dikkatli gir.
          </p>
          <div style="background:#0a0a12; border:2px solid #9333ea; border-radius:12px; padding:24px; text-align:center; margin-bottom:28px;">
            <span style="font-size:36px; font-weight:900; letter-spacing:14px; color:white; font-family:monospace;">{code}</span>
          </div>
          <p style="color:#64748b; font-size:12px; margin:0; line-height:1.6;">
            Bu isteği sen yapmadıysan bu e-postayı dikkate alma ve şifreni değiştirme.
          </p>
        </div>
        <div style="padding:16px 32px; border-top:1px solid #2d2d4a;">
          <p style="color:#475569; font-size:11px; margin:0; text-align:center;">
            CVision Support Team &bull; Bu e-postayı sen talep etmediysen dikkate alma.
          </p>
        </div>
      </div>
    </body>
    </html>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            if settings.SMTP_TLS:
                server.starttls()
                server.ehlo()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())

        logger.info("Password reset email sent to %s", to_email)
        return True

    except Exception as e:
        logger.error("Failed to send password reset email to %s: %s", to_email, e)
        return False
