"""
Email service - sends transactional emails via Resend HTTP API.
"""

import logging
import resend
import secrets
import string
from datetime import datetime, timedelta

from app.config import settings

logger = logging.getLogger("cvision.services.email")


def generate_reset_code() -> str:
    """Generate a 5-character case-sensitive alphanumeric reset code (e.g. A3b2X)."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(5))


def get_reset_code_expiry() -> datetime:
    """Return expiry timestamp 10 minutes from now."""
    return datetime.utcnow() + timedelta(minutes=10)


def send_reset_password_email(to_email: str, code: str, full_name: str) -> bool:
    """Send password reset email with the alphanumeric code via Resend."""
    if not settings.RESEND_API_KEY:
        logger.warning("Resend API key not configured - skipping email send. Reset code: %s", code)
        return False

    resend.api_key = settings.RESEND_API_KEY

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
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": [to_email],
            "subject": "CVision - Şifre Sıfırlama Kodunuz",
            "html": html_body,
        })
        logger.info("Password reset email sent to %s", to_email)
        return True

    except Exception as e:
        logger.error("Failed to send password reset email to %s: %s", to_email, e)
        return False


def send_welcome_email(to_email: str, full_name: str) -> None:
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set, skipping welcome email.")
        return

    first_name = full_name.strip().split()[0]

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #111111;">
      <p>Hi {first_name},</p>

      <p>I saw you just signed up for CVision. Thank you, it genuinely means a lot.</p>

      <p>My name is Fatih, I am a computer engineering student and I built CVision by myself.
      I started it because I kept seeing people send out dozens of applications and hear nothing back.
      Most of the time the problem is not their experience. It is that ATS systems filter them out
      before a human ever sees the CV. I wanted to make that invisible wall visible.</p>

      <p><strong>Here is what CVision can do for you:</strong></p>
      <ul>
        <li><strong>ATS score</strong> — see exactly how recruiters' systems read your CV</li>
        <li><strong>Keyword analysis</strong> — find out which keywords are missing for your target role</li>
        <li><strong>AI suggestions</strong> — specific, actionable fixes, not generic advice</li>
        <li><strong>Job match</strong> — paste any job description and see how your CV stacks up</li>
        <li><strong>AI cover letter</strong> — generate a tailored cover letter in seconds</li>
      </ul>

      <p>One tip to get the most out of it: use the Job Match feature. Upload your CV,
      paste the job description you are applying for, and CVision will show you exactly
      what is missing. That is where most people see the biggest improvement.</p>

      <p>Your first analysis is completely free and fully unlocked. No credit card needed.</p>

      <p>If anything is unclear, broken, or you just want to share feedback, reply directly
      to this email. I read every message.</p>

      <p>Good luck with your applications.</p>

      <p>Fatih<br>
      Founder, CVision<br>
      <a href="https://www.cvisionapp.com">www.cvisionapp.com</a></p>
    </body>
    </html>
    """

    resend.api_key = settings.RESEND_API_KEY
    try:
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": [to_email],
            "subject": "Welcome to CVision, a quick note from the founder",
            "html": html_body,
        })
        logger.info("Welcome email sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send welcome email to %s: %s", to_email, e)
