"""
Application configuration loaded from environment variables.
Uses pydantic-settings for type-safe config with .env file support.
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central configuration for the CVision backend.
    Values are loaded from .env file or environment variables.
    """

    # ---- Database ----
    DATABASE_URL: str = "sqlite:///./cvision.db"

    # ---- JWT Authentication ----
    SECRET_KEY: str  # No default, must be set in .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    APP_NAME: str = "CVision"
    DEBUG: bool = False
    CORS_ORIGINS: str = ""  # Comma-separated string in .env
    
    # ---- Plan Limits (legacy) ----
    # Superseded by the credit prices below. Kept until the quota columns are
    # dropped, so nothing that still reads them breaks mid-migration.
    FREE_WEEKLY_LIMIT: int = 3
    PREMIUM_WEEKLY_LIMIT: int = 50

    # ---- Credit prices ----
    # In settings rather than a constants module so pricing can be tuned from
    # the environment without a deploy - the first months of a paid product are
    # mostly finding out what a credit is worth.
    CREDIT_ANALYSIS: int = 1
    CREDIT_UNLOCK: int = 2          # unlock the full report on one analysis
    CREDIT_MATCH: int = 1
    CREDIT_COVER_LETTER: int = 2
    CREDIT_REWRITE: int = 1
    # Grants
    CREDIT_SIGNUP: int = 3          # one analysis plus its unlock
    CREDIT_WEEKLY: int = 2
    CREDIT_REFERRAL: int = 3
    # The weekly grant is skipped at or above this balance. Stops a dormant
    # account banking a year of grants, which would remove any reason to buy;
    # someone sitting on a purchased balance does not need the handout either.
    CREDIT_WEEKLY_CAP: int = 12
    # What one month of the existing Pro subscription hands over. plan_type no
    # longer gates anything, so without this a purchase would take the money and
    # deliver nothing. Set high on purpose until real credit packs replace the
    # subscription: over-delivering to the first payers costs almost nothing at
    # ~$0.008 of compute per analysis, while under-delivering to someone who
    # already paid cannot be undone.
    CREDIT_PREMIUM_PURCHASE: int = 200

    # Credit packs, as "<lemon_variant_id>:<credits>" pairs.
    #
    # The money lives in Lemon Squeezy - a variant carries its own price - so
    # this maps a purchase back to what it bought and nothing more. Keeping it
    # in the environment means prices and pack sizes can be changed in the Lemon
    # dashboard and here without a deploy, which is the whole point while the
    # right numbers are still unknown.
    #
    # Empty means packs are not for sale yet, and the checkout says so rather
    # than taking money for an unknown variant.
    CREDIT_PACKS: str = ""

    @property
    def credit_packs(self) -> dict[str, int]:
        """{variant_id: credits}. Malformed entries are skipped, not fatal - a
        typo in an env var must not take the whole app down at import time."""
        packs: dict[str, int] = {}
        for entry in self.CREDIT_PACKS.split(","):
            entry = entry.strip()
            if not entry or ":" not in entry:
                continue
            variant, _, amount = entry.partition(":")
            try:
                credits = int(amount)
            except ValueError:
                continue
            if variant.strip() and credits > 0:
                packs[variant.strip()] = credits
        return packs

    # ---- Job recovery (Track 2) ----
    # A pending/processing CV older than this is considered stuck and swept.
    STUCK_JOB_TIMEOUT_MINUTES: int = 10
    # Max times the startup sweep re-queues a stuck job before marking it failed.
    MAX_JOB_RETRIES: int = 3

    @property
    def cors_origins_list(self) -> list[str]:
        if not self.CORS_ORIGINS:
            return []
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # ---- File Upload ----
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 5

    # ---- OpenAI ----
    OPENAI_API_KEY: str = ""
    # Benchmarked on a real Turkish CV against gpt-4o-mini, gpt-5.5 and
    # gpt-5.6-luna. 4o-mini under-extracted skills (it missed Google Ads and
    # Meta Ads on a digital-marketing CV, which deflates the ATS score and made
    # it advise adding SEO to a CV that already had it). The 5.5/5.6 reasoning
    # models reject temperature != 1, which would make skill extraction
    # non-deterministic - unacceptable for a scoring tool - and 5.5 took 48s.
    # 5.4-mini is more accurate at the same latency for ~$0.008/analysis.
    OPENAI_MODEL: str = "gpt-5.4-mini"
    OPENAI_ENABLED: bool = True  # Automatically disabled if key is empty

    # ---- Email (Resend) ----
    RESEND_API_KEY: str = ""
    # cvisionapp.com is verified in Resend (DKIM + SPF), so send from it. The
    # previous default, onboarding@resend.dev, is Resend's shared test address:
    # it only delivers to the Resend account owner's own inbox and returns 403
    # for everybody else. With no EMAIL_FROM set in the environment that default
    # applied in production, so no user has ever received a welcome or a
    # password-reset mail - the failure is swallowed by a log line.
    EMAIL_FROM: str = "Fatih from CVision <fatih@cvisionapp.com>"
    # Receiving is not enabled on the domain, so replies to EMAIL_FROM would
    # bounce. The welcome mail explicitly asks people to reply, hence a Reply-To
    # pointing at a mailbox that actually exists.
    EMAIL_REPLY_TO: str = "fthctlcm@outlook.com"

    # ---- iyzico ----
    IYZICO_API_KEY: str = ""
    IYZICO_SECRET_KEY: str = ""
    IYZICO_BASE_URL: str = "https://sandbox-api.iyzipay.com"

    # ---- LemonSqueezy ----
    LEMONSQUEEZY_API_KEY: str = ""
    LEMONSQUEEZY_STORE_ID: str = ""
    LEMONSQUEEZY_VARIANT_ID: str = ""
    LEMONSQUEEZY_WEBHOOK_SECRET: str = ""

    # ---- Google OAuth ----
    GOOGLE_CLIENT_ID: str = ""

    # ---- Observability (Track 2) ----
    # Empty DSN disables Sentry entirely (see app/observability.py).
    SENTRY_DSN: str = ""
    SENTRY_TRACES_SAMPLE_RATE: float = 0.0

    # ---- App URLs ----
    BACKEND_URL: str = "https://cvision-p4ny.onrender.com"
    FRONTEND_URL: str = "https://www.cvisionapp.com"

    # Comma-separated IPs exempt from the anonymous /try daily limit
    # (founder/team testing, demos). The per-IP daily cap still applies to
    # everyone else.
    ANON_EXEMPT_IPS: str = ""

    # Computed property for max file size in bytes
    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    # Computed property for absolute upload path
    @property
    def upload_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        # Tolerate unknown env vars (e.g. stale keys from a prior payment
        # provider) instead of crashing Settings() at startup.
        extra="ignore",
    )


# Singleton instance used throughout the application
settings = Settings()
