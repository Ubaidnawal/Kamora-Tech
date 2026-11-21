from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings, normalized_database_url

settings = get_settings()

_UNCONFIGURED_ENGINE_URL = "postgresql+asyncpg://invalid.invalid/invalid"

try:
    database_url = make_url(normalized_database_url(settings.DATABASE_URL) or _UNCONFIGURED_ENGINE_URL)
except ArgumentError:
    database_url = make_url(_UNCONFIGURED_ENGINE_URL)

connect_args: dict[str, Any] = {}

if database_url.get_backend_name() == "postgresql" and database_url.host not in {None, "invalid.invalid"}:
    connect_args["ssl"] = "require"

engine = create_async_engine(
    database_url,
    echo=settings.ENVIRONMENT.lower() == "development",
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)


class DatabaseConfigurationError(RuntimeError):
    def __init__(self) -> None:
        super().__init__("Database is not configured.")


def require_database_configured() -> None:
    if not get_settings().database_configured:
        raise DatabaseConfigurationError()


async def verify_database_connection() -> bool:
    from sqlalchemy import text

    async with engine.connect() as connection:
        await connection.execute(text("SELECT 1"))
    return True


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
