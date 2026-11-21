from __future__ import annotations

import logging
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.database.base import Base
from app.database.connection import get_db
from app.models import User

REGISTRATION_UNAVAILABLE_DETAIL = "Registration is temporarily unavailable. Please try again later."
AUTHENTICATION_UNAVAILABLE_DETAIL = "Authentication is temporarily unavailable."
DUPLICATE_EMAIL_DETAIL = "This email is already registered."


def _registration_payload(email: str = "alias@example.com") -> dict[str, object]:
    return {
        "full_name": "Alias User",
        "email": email,
        "phone_number": "03001234567",
        "password": "SecurePass123",
        "confirm_password": "SecurePass123",
        "accept_terms": True,
    }


@pytest_asyncio.fixture
async def signup_db() -> AsyncGenerator[tuple[AsyncClient, async_sessionmaker], None]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    from app.main import app

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
            yield client, session_factory
    finally:
        app.dependency_overrides.clear()
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
        await engine.dispose()


def test_database_configured_rejects_placeholders(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "DATABASE_URL", "postgresql+asyncpg://USER:PASSWORD@HOST/DBNAME")
    assert settings.database_configured is False

    monkeypatch.setattr(settings, "DATABASE_URL", "postgresql+asyncpg://user:pass@db.example.com/app")
    assert settings.database_configured is False

    monkeypatch.setattr(settings, "DATABASE_URL", "")
    assert settings.database_configured is False

    monkeypatch.setattr(settings, "DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")
    assert settings.database_configured is True


@pytest.mark.asyncio
async def test_register_accepts_phone_number_alias_and_hashes_password(signup_db: tuple[AsyncClient, async_sessionmaker]) -> None:
    client, session_factory = signup_db
    response = await client.post("/api/v1/auth/register", json=_registration_payload())
    assert response.status_code == 201, response.text
    assert response.json()["message"] == "Your account has been created successfully. Verify your email to activate your account."

    async with session_factory() as session:
        user = (await session.scalars(select(User).where(User.email == "alias@example.com"))).first()
        assert user is not None
        assert user.phone == "03001234567"
        assert user.accepted_terms is True
        assert user.password_hash != "SecurePass123"
        assert user.password_hash.startswith("$argon2")


@pytest.mark.asyncio
async def test_registration_validation_blocks_invalid_payloads(signup_db: tuple[AsyncClient, async_sessionmaker]) -> None:
    client, _ = signup_db
    weak = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Weak User",
            "email": "weak@example.com",
            "phone": "03001234567",
            "password": "weakpass",
            "confirm_password": "weakpass",
            "accept_terms": True,
        },
    )
    assert weak.status_code == 422

    mismatch = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Mismatch User",
            "email": "mismatch@example.com",
            "phone": "03001234567",
            "password": "SecurePass123",
            "confirm_password": "DifferentPass123",
            "accept_terms": True,
        },
    )
    assert mismatch.status_code == 422

    terms = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Terms User",
            "email": "terms@example.com",
            "phone": "03001234567",
            "password": "SecurePass123",
            "confirm_password": "SecurePass123",
            "accept_terms": False,
        },
    )
    assert terms.status_code == 422


@pytest.mark.asyncio
async def test_unconfigured_database_registration_returns_safe_503(
    signup_db: tuple[AsyncClient, async_sessionmaker],
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    client, _ = signup_db
    settings = get_settings()
    placeholder = "postgresql+asyncpg://USER:PASSWORD@HOST/DBNAME"
    monkeypatch.setattr(settings, "DATABASE_URL", placeholder)

    with caplog.at_level(logging.ERROR, logger="kamora.auth"):
        response = await client.post("/api/v1/auth/register", json=_registration_payload())

    assert response.status_code == 503
    assert response.json()["detail"] == REGISTRATION_UNAVAILABLE_DETAIL
    assert placeholder not in response.text
    assert placeholder not in caplog.text
    assert "category=database_configuration" in caplog.text


@pytest.mark.asyncio
async def test_duplicate_email_is_classified_safely(
    signup_db: tuple[AsyncClient, async_sessionmaker],
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    import app.api.v1.auth as auth_router

    async def duplicate_register(*args: object, **kwargs: object) -> None:
        raise IntegrityError("INSERT INTO users", None, Exception("duplicate key"))

    monkeypatch.setattr(auth_router, "register_user", duplicate_register)
    client, _ = signup_db

    with caplog.at_level(logging.ERROR, logger="kamora.auth"):
        response = await client.post("/api/v1/auth/register", json=_registration_payload())

    assert response.status_code == 409
    assert response.json()["detail"] == DUPLICATE_EMAIL_DETAIL
    assert "duplicate key" not in response.text
    assert "category=duplicate_email" in caplog.text


@pytest.mark.asyncio
async def test_registration_sqlalchemy_error_returns_sanitized_503(
    signup_db: tuple[AsyncClient, async_sessionmaker],
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    import app.api.v1.auth as auth_router

    async def broken_register(*args: object, **kwargs: object) -> None:
        raise SQLAlchemyError("connection detail that must not leak")

    monkeypatch.setattr(auth_router, "register_user", broken_register)
    client, _ = signup_db

    with caplog.at_level(logging.ERROR, logger="kamora.auth"):
        response = await client.post("/api/v1/auth/register", json=_registration_payload())

    assert response.status_code == 503
    assert response.json()["detail"] == REGISTRATION_UNAVAILABLE_DETAIL
    assert "connection detail that must not leak" not in response.text
    assert "connection detail that must not leak" not in caplog.text
    assert "category=database_unavailable" in caplog.text


@pytest.mark.asyncio
async def test_database_failure_returns_sanitized_503_with_cors() -> None:
    from app.main import app

    async def failing_get_db() -> AsyncGenerator[AsyncSession, None]:
        raise OSError("simulated database outage")
        yield

    app.dependency_overrides[get_db] = failing_get_db
    try:
        transport = ASGITransport(app=app, raise_app_exceptions=False)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            response = await client.post(
                "/api/v1/auth/register",
                headers={"Origin": "http://localhost:3002"},
                json=_registration_payload("offline@example.com"),
            )
        assert response.status_code == 503
        assert response.json()["detail"] == REGISTRATION_UNAVAILABLE_DETAIL
        assert response.headers["access-control-allow-origin"] == "http://localhost:3002"
        assert response.headers["x-request-id"]
        assert response.json()["category"] == "database_unavailable"
        assert "sslmode" not in response.text
        assert "traceback" not in response.text.lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_login_database_failure_returns_sanitized_503_with_cors() -> None:
    from app.main import app

    async def failing_get_db() -> AsyncGenerator[AsyncSession, None]:
        raise OSError("simulated database outage")
        yield

    app.dependency_overrides[get_db] = failing_get_db
    try:
        transport = ASGITransport(app=app, raise_app_exceptions=False)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            response = await client.post(
                "/api/v1/auth/login",
                headers={"Origin": "http://localhost:3002"},
                json={"email": "offline@example.com", "password": "SecurePass123", "remember_me": True},
            )
        assert response.status_code == 503
        assert response.json()["detail"] == AUTHENTICATION_UNAVAILABLE_DETAIL
        assert response.headers["access-control-allow-origin"] == "http://localhost:3002"
        assert response.headers["x-request-id"]
        assert response.json()["category"] == "database_unavailable"
        assert "traceback" not in response.text.lower()
    finally:
        app.dependency_overrides.clear()
