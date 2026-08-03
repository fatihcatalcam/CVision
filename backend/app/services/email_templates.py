# -*- coding: utf-8 -*-
"""Subject lines and HTML bodies for transactional mail, per language.

Only Turkish and English exist here. The UI ships five languages, but the
welcome mail is a personal letter from the founder and its whole effect comes
from the voice - running that through machine translation into three more
languages would cost more than it gains. Anything that is not Turkish therefore
falls back to English, which is the resolve() rule below.

The Turkish copy is the founder's own wording, not a translation of the English.

── Design ────────────────────────────────────────────────────────────────────
Both mails share _shell(), so they read as one family. Colours are taken from
the running UI rather than invented: the reset mail used to be dark with a
red-to-purple gradient, which appears nowhere in the product. The site is light
and effectively monochrome - warm off-white surfaces, near-black type and
buttons, one warm grey.

Email-specific constraints this file works under:
  - Tables for layout. Outlook's rendering engine is Word; max-width on a div
    is ignored there, so the card is a table with a fixed width.
  - Inline styles only. Gmail strips <style> blocks in some clients.
  - No webfonts. Plus Jakarta Sans cannot load, so the stack falls straight
    through to the same system fonts the site falls back to.
  - Light scheme deliberately: dark-background mail gets mangled by client-side
    dark-mode inversion far more often than light does.
"""

SUPPORTED = ("tr", "en")

# From frontend/src/index.css and components/ui/Button.tsx.
#
# The product reads as monochrome: warm off-white surfaces, near-black type, one
# warm grey for secondary text. --color-primary is a deep navy but it is only
# ever a focus ring and a handful of small icons - the primary button is
# bg-[#111111]. So INK, not navy, is what a user recognises as "the CVision
# button", and these mails use it the same way.
BACKGROUND = "#FBFBFA"
CARD = "#FFFFFF"
BORDER = "#EAEAEA"
INK = "#111111"          # primary button / header band
FOREGROUND = "#111111"
MUTED = "#6B6A65"
SUBTLE = "#F7F6F3"       # the warm grey secondary/ghost buttons hover to

FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
FONT_MONO = "'SF Mono', SFMono-Regular, Menlo, Consolas, monospace"


def resolve(language: str | None) -> str:
    """Collapse any UI language code onto one we have copy for.

    Accepts regional forms ('tr-TR') and None (accounts created before the
    users.language column existed).
    """
    return "tr" if (language or "").strip().lower().startswith("tr") else "en"


def _shell(content: str, preheader: str, width: int = 600) -> str:
    """Wrap body content in the shared card, header and footer.

    `preheader` is the grey line inboxes show next to the subject. Hidden in the
    body itself, but without one the client grabs whatever text comes first,
    which would be the wordmark.
    """
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0; padding:0; background-color:{BACKGROUND};">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">{preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:{BACKGROUND}; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="{width}" cellpadding="0" cellspacing="0" border="0"
               style="width:100%; max-width:{width}px; background-color:{CARD}; border:1px solid {BORDER}; border-radius:12px; overflow:hidden;">
          <tr>
            <td style="background-color:{INK}; padding:24px 32px;">
              <span style="font-family:{FONT}; font-size:20px; font-weight:800; letter-spacing:-0.5px; color:#FFFFFF;">CVision.</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px; font-family:{FONT}; font-size:15px; line-height:1.65; color:{FOREGROUND};">
{content}
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid {BORDER}; padding:16px 32px;">
              <p style="margin:0; font-family:{FONT}; font-size:11px; line-height:1.5; color:{MUTED};">
                CVision &bull; <a href="https://www.cvisionapp.com" style="color:{MUTED}; text-decoration:underline;">www.cvisionapp.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _p(text: str, *, muted: bool = False, top: int = 0) -> str:
    colour = MUTED if muted else FOREGROUND
    return (
        f'<p style="margin:{top}px 0 16px; font-size:15px; line-height:1.65; '
        f'color:{colour};">{text}</p>'
    )


def _bullets(items: list[tuple[str, str]]) -> str:
    """A label/description list. Table rows rather than <ul>, because Outlook
    invents its own list indentation and bullet spacing."""
    rows = "".join(
        f"""<tr>
              <td valign="top" style="padding:0 8px 10px 0; font-size:15px; line-height:1.65; color:{INK};">&bull;</td>
              <td style="padding:0 0 10px; font-size:15px; line-height:1.65; color:{FOREGROUND};">
                <strong>{label}</strong> {body}
              </td>
            </tr>"""
        for label, body in items
    )
    return f'<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">{rows}</table>'


def _tip(text: str) -> str:
    """Callout block for the one piece of advice each welcome mail carries."""
    return (
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" '
        f'style="margin:0 0 16px;"><tr><td style="background-color:{SUBTLE}; '
        f'border-radius:8px; padding:16px 20px; font-size:14px; line-height:1.6; '
        f'color:{FOREGROUND};">{text}</td></tr></table>'
    )


def _signature(role: str) -> str:
    return (
        f'<p style="margin:24px 0 0; font-size:15px; line-height:1.6; color:{FOREGROUND};">'
        f'Fatih<br>'
        f'<span style="color:{MUTED};">{role}</span><br>'
        f'<a href="https://www.cvisionapp.com" style="color:{INK}; text-decoration:none;">www.cvisionapp.com</a>'
        f'</p>'
    )


# ── Welcome ───────────────────────────────────────────────────────────────────

WELCOME_SUBJECT = {
    "en": "Welcome to CVision, a quick note from the founder",
    "tr": "CVision'a hoş geldin - kurucudan kısa bir not",
}

WELCOME_PREHEADER = {
    "en": "Why I built CVision, and the one feature worth trying first.",
    "tr": "CVision'ı neden kurdum ve ilk denemeni önerdiğim özellik.",
}


def _welcome_en(first_name: str) -> str:
    return (
        _p(f"Hi {first_name},")
        + _p("I saw you just signed up for CVision. Thank you, it genuinely means a lot.")
        + _p(
            "My name is Fatih, I am a computer engineering student and I built CVision by "
            "myself. I started it because I kept seeing people send out dozens of "
            "applications and hear nothing back. Most of the time the problem is not their "
            "experience. It is that ATS systems filter them out before a human ever sees "
            "the CV. I wanted to make that invisible wall visible."
        )
        + _p("<strong>Here is what CVision can do for you:</strong>")
        + _bullets([
            ("ATS score:", "see exactly how recruiters' systems read your CV."),
            ("Keyword analysis:", "find out which keywords are missing for your target role."),
            ("AI suggestions:", "specific, actionable fixes, not generic advice."),
            ("Job match:", "paste any job description and see how your CV stacks up."),
            ("AI cover letter:", "generate a tailored cover letter in seconds."),
        ])
        + _tip(
            "🎯 <strong>Quick tip:</strong> use the Job Match feature. Upload your CV, paste "
            "the job description you are applying for, and CVision will show you exactly "
            "what is missing. That is where most people see the biggest improvement."
        )
        + _p("Your first analysis is completely free and fully unlocked. No credit card needed.")
        + _p(
            "If anything is unclear, broken, or you just want to share feedback, reply "
            "directly to this email. I read every message."
        )
        + _p("Good luck with your applications.")
        + _signature("Founder, CVision")
    )


def _welcome_tr(first_name: str) -> str:
    return (
        _p(f"Merhaba {first_name},")
        + _p("CVision'a hoş geldin! Seni aramızda görmek harika.")
        + _p(
            "Ben Fatih. Bilgisayar mühendisliği öğrencisiyim ve CVision'ı tek başıma "
            "geliştirdim. Bu platformu kurdum çünkü çok sayıda başvuru yapıp hiçbir geri "
            "dönüş alamayan adayların yaşadığı hayal kırıklığını görüyordum. Çoğu zaman "
            "asıl sorun yetersiz deneyim değil, CV'lerin bir insan eli değmeden ATS (Aday "
            "Takip Sistemleri) filtrelerine takılmasıydı. Amacım, bu görünmez engeli "
            "ortadan kaldırmak oldu."
        )
        + _p("<strong>CVision ile yapabileceklerin:</strong>")
        + _bullets([
            ("ATS Skoru:", "CV'nin işe alım algoritmalarından nasıl puan aldığını keşfet."),
            ("Anahtar Kelime Analizi:", "İlanın gerektirdiği, ancak CV'nde eksik olan kritik kelimeleri bul."),
            ("Kişiselleştirilmiş YZ Önerileri:", "Sadece sana ve CV'ne özel, anında uygulanabilir tavsiyeler al."),
            ("İlan Eşleştirme:", "Başvuracağın iş ilanını yapıştır, uyum oranını anında gör."),
            ("Otomatik Ön Yazı:", "Başvurduğun pozisyona özel ön yazını saniyeler içinde hazırla."),
        ])
        + _tip(
            "🎯 <strong>Hızlı İpucu:</strong> En iyi sonuç için İlan Eşleştirme özelliğini "
            "denemeni öneririm. CV'ni ve ilgilendiğin iş ilanını eşleştirdiğinde, sistem "
            "sana tam olarak hangi detayları eklemen gerektiğini gösterecektir."
        )
        + _p(
            "Platformu keşfedebilmen için ilk analizin tamamen ücretsiz (kredi kartı "
            "gerektirmez) ve tüm özellikler kullanıma açıktır."
        )
        + _p(
            "Herhangi bir sorun yaşarsan veya bir öneride bulunmak istersen, doğrudan bu "
            "e-postayı yanıtlayabilirsin. Tüm geri bildirimleri şahsen okuyor ve "
            "değerlendiriyorum."
        )
        + _p("Kariyer yolculuğunda başarılar dilerim!")
        + _signature("Kurucu, CVision")
    )


def welcome(first_name: str, language: str | None) -> tuple[str, str]:
    """Return (subject, html) for the welcome mail."""
    lang = resolve(language)
    content = _welcome_tr(first_name) if lang == "tr" else _welcome_en(first_name)
    return WELCOME_SUBJECT[lang], _shell(content, WELCOME_PREHEADER[lang])


# ── Password reset ────────────────────────────────────────────────────────────

RESET_SUBJECT = {
    "en": "CVision - Your password reset code",
    "tr": "CVision - Şifre Sıfırlama Kodunuz",
}

_RESET_COPY = {
    "tr": {
        "preheader": "Kodun 10 dakika geçerli.",
        "heading": "Şifre Sıfırlama",
        "greeting": "Merhaba",
        "intro": (
            "Aşağıdaki kodu kullanarak şifreni sıfırlayabilirsin. Kod <strong>10 dakika</strong> "
            "geçerlidir ve büyük/küçük harf duyarlıdır, dikkatli gir."
        ),
        "disclaimer": (
            "Bu isteği sen yapmadıysan bu e-postayı dikkate alma; şifren değişmeden kalır."
        ),
    },
    "en": {
        "preheader": "Your code is valid for 10 minutes.",
        "heading": "Password reset",
        "greeting": "Hi",
        "intro": (
            "Use the code below to reset your password. It is valid for <strong>10 minutes</strong> "
            "and is case-sensitive, so enter it exactly as shown."
        ),
        "disclaimer": (
            "If you did not request this, ignore this email; your password stays as it is."
        ),
    },
}


def reset_password(code: str, first_name: str, language: str | None) -> tuple[str, str]:
    """Return (subject, html) for the password-reset mail."""
    lang = resolve(language)
    c = _RESET_COPY[lang]

    code_box = (
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" '
        f'style="margin:0 0 20px;"><tr><td align="center" style="background-color:{SUBTLE}; '
        f'border:1px solid {BORDER}; border-radius:8px; padding:22px;">'
        f'<span style="font-family:{FONT_MONO}; font-size:32px; font-weight:700; '
        f'letter-spacing:10px; color:{INK};">{code}</span>'
        f'</td></tr></table>'
    )

    content = (
        f'<h1 style="margin:0 0 12px; font-size:20px; line-height:1.3; font-weight:700; '
        f'color:{FOREGROUND};">{c["heading"]}</h1>'
        + _p(f'{c["greeting"]} <strong>{first_name}</strong>,')
        + _p(c["intro"])
        + code_box
        + f'<p style="margin:0; font-size:13px; line-height:1.6; color:{MUTED};">{c["disclaimer"]}</p>'
    )
    return RESET_SUBJECT[lang], _shell(content, c["preheader"], width=480)
