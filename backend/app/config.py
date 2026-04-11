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
    
    # ---- Plan Limits ----
    FREE_WEEKLY_LIMIT: int = 3
    PREMIUM_WEEKLY_LIMIT: int = 50

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
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_ENABLED: bool = True  # Automatically disabled if key is empty

    # ---- iyzico ----
    IYZICO_API_KEY: str = ""
    IYZICO_SECRET_KEY: str = ""
    IYZICO_BASE_URL: str = "https://sandbox-api.iyzipay.com"

    # ---- Stripe ----
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # ---- App URLs ----
    BACKEND_URL: str = "http://167.86.89.146:8001"
    FRONTEND_URL: str = "http://167.86.89.146"

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
    )


# Singleton instance used throughout the application
settings = Settings()
