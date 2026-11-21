import re
from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError

_PLACEHOLDER_TOKEN = re.compile(
    r"(?<![A-Z0-9_])(?:USER|PASSWORD|HOST|DBNAME)(?![A-Z0-9_])|YOUR[-_]|EXAMPLE(?:\.COM)?|<[^>]+>"
)
_DRIVER_PREFIX = re.compile(r"^postgres(?:ql)?(?:\+[A-Za-z0-9_]+)?://", re.IGNORECASE)


def normalized_database_url(value: str) -> str:
    raw = (value or "").strip().strip("\"").strip("'")
    if not raw:
        return ""
    url = make_url(_DRIVER_PREFIX.sub("postgresql+asyncpg://", raw, count=1))
    query = dict(url.query)
    query.pop("sslmode", None)
    query.pop("ssl", None)
    query.pop("channel_binding", None)
    return url.set(query=query).render_as_string(hide_password=False)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    DATABASE_URL: str = Field(default="", description="Async PostgreSQL URL, for Neon use postgresql+asyncpg://...")
    JWT_SECRET_KEY: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENVIRONMENT: str = "development"
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002,http://127.0.0.1:3002"
    FRONTEND_URL: str = "http://localhost:3000"
    VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24
    PASSWORD_RESET_EXPIRE_MINUTES: int = 30
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 5
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "hello@kamoratech.com"
    BOOTSTRAP_ADMIN_EMAIL: str = ""
    BOOTSTRAP_ADMIN_PASSWORD: str = ""

    @field_validator("BACKEND_CORS_ORIGINS")
    @classmethod
    def parse_cors(cls, value: str) -> str:
        return value

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def database_configured(self) -> bool:
        value = normalized_database_url(self.DATABASE_URL)
        if not value or _PLACEHOLDER_TOKEN.search(value.upper()):
            return False
        try:
            parsed = make_url(value)
        except ArgumentError:
            return False
        return bool(parsed.get_backend_name()) and bool(parsed.host or parsed.database)


@lru_cache
def get_settings() -> Settings:
    return Settings()
