import os
from collections.abc import AsyncGenerator
from importlib import import_module

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient


def pytest_configure() -> None:
    os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")
    os.environ.setdefault("JWT_SECRET_KEY", "test-only-jwt-secret-0123456789abcdef")
    os.environ.setdefault("ENVIRONMENT", "test")
    from app.core.rate_limit import limiter

    limiter.enabled = False


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as test_client:
        yield test_client


@pytest_asyncio.fixture
async def db_client() -> AsyncGenerator[AsyncClient, None]:
    test_database_url = os.environ.get("TEST_DATABASE_URL")
    if not test_database_url:
        pytest.skip("TEST_DATABASE_URL is not set; skipping database-dependent test.")

    from sqlalchemy.ext.asyncio import (
        AsyncSession,
        async_sessionmaker,
        create_async_engine,
    )

    from app.database.base import Base
    from app.database.connection import get_db
    from app.main import app

    import_module("app.models")

    engine = create_async_engine(test_database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
        await engine.dispose()
