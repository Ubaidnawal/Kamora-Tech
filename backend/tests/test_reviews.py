from __future__ import annotations

from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import hash_password
from app.database.base import Base
from app.database.connection import get_db
from app.models import Product, ProductCategory, ProductStatus, Role, RoleName, User


@pytest_asyncio.fixture
async def reviews_env() -> AsyncGenerator[tuple[AsyncClient, dict[str, str]], None]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        category = ProductCategory(name="Web", slug="web", is_active=True)
        session.add(category)
        await session.flush()
        p1 = Product(
            category_id=category.id,
            name="Product One",
            slug="product-one",
            short_description="One",
            description="One",
            features=[],
            specifications={},
            price=100.0,
            currency="USD",
            status=ProductStatus.active,
            is_active=True,
        )
        p2 = Product(
            category_id=category.id,
            name="Product Two",
            slug="product-two",
            short_description="Two",
            description="Two",
            features=[],
            specifications={},
            price=50.0,
            currency="USD",
            status=ProductStatus.active,
            is_active=True,
        )
        admin_role = Role(name=RoleName.admin, description="Admin")
        admin = User(
            full_name="Admin User",
            email="admin@example.com",
            phone="+10000000000",
            password_hash=hash_password("Admin1234"),
            is_active=True,
            is_verified=True,
        )
        admin.roles.append(admin_role)
        session.add_all([p1, p2, admin])
        await session.commit()
        ids = {"p1": p1.id, "p1_slug": p1.slug, "p2": p2.id, "p2_slug": p2.slug}

    from app.main import app

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
            yield client, ids
    finally:
        app.dependency_overrides.clear()
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
        await engine.dispose()


def csrf(client: AsyncClient) -> dict[str, str]:
    token = client.cookies.get("csrf_token", "")
    return {"X-CSRF-Token": token} if token else {}


async def register_verify_login(client: AsyncClient, email: str, name: str) -> None:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": name,
            "email": email,
            "phone": "+10000000001",
            "password": "Customer1234",
            "confirm_password": "Customer1234",
            "accept_terms": True,
        },
    )
    assert response.status_code == 201, response.text
    token = response.json()["token"]
    verified = await client.post("/api/v1/auth/verify-email", json={"token": token})
    assert verified.status_code == 200, verified.text
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Customer1234", "remember_me": True},
    )
    assert login.status_code == 200, login.text


async def login(client: AsyncClient, email: str, password: str) -> None:
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password, "remember_me": True},
    )
    assert response.status_code == 200, response.text


@pytest.mark.asyncio
async def test_one_user_one_review_and_update(reviews_env: tuple[AsyncClient, dict[str, str]]) -> None:
    client, ids = reviews_env
    await register_verify_login(client, "u1@example.com", "User One")

    created = await client.post(
        f"/api/v1/products/{ids['p1_slug']}/reviews",
        headers=csrf(client),
        json={"rating": 4, "review_text": "Good"},
    )
    assert created.status_code == 200, created.text
    first = created.json()
    assert first["product_slug"] == ids["p1_slug"]
    assert first["rating"] == 4
    assert first["review_text"] == "Good"
    assert first["is_updated"] is False

    updated = await client.post(
        f"/api/v1/products/{ids['p1_slug']}/reviews",
        headers=csrf(client),
        json={"rating": 5, "review_text": "Great"},
    )
    assert updated.status_code == 200, updated.text
    second = updated.json()
    assert second["id"] == first["id"]
    assert second["rating"] == 5
    assert second["review_text"] == "Great"
    assert second["is_updated"] is True

    summary = await client.get(f"/api/v1/products/{ids['p1_slug']}/reviews/summary")
    assert summary.status_code == 200
    data = summary.json()
    assert data["review_count"] == 1
    assert data["average_rating"] == 5.0
    assert data["distribution"] == {"1": 0, "2": 0, "3": 0, "4": 0, "5": 1}


@pytest.mark.asyncio
async def test_second_user_separate_review(reviews_env: tuple[AsyncClient, dict[str, str]]) -> None:
    client, ids = reviews_env
    await register_verify_login(client, "u1@example.com", "User One")
    r1 = await client.post(
        f"/api/v1/products/{ids['p1_slug']}/reviews",
        headers=csrf(client),
        json={"rating": 5, "review_text": "A"},
    )
    assert r1.status_code == 200

    await client.post("/api/v1/auth/logout", headers=csrf(client))
    await register_verify_login(client, "u2@example.com", "User Two")
    r2 = await client.post(
        f"/api/v1/products/{ids['p1_slug']}/reviews",
        headers=csrf(client),
        json={"rating": 3, "review_text": "B"},
    )
    assert r2.status_code == 200
    assert r2.json()["id"] != r1.json()["id"]

    summary = await client.get(f"/api/v1/products/{ids['p1_slug']}/reviews/summary")
    data = summary.json()
    assert data["review_count"] == 2
    assert data["average_rating"] == 4.0
    assert data["distribution"]["5"] == 1
    assert data["distribution"]["3"] == 1


@pytest.mark.asyncio
async def test_invalid_rating_unauthorized_and_me(reviews_env: tuple[AsyncClient, dict[str, str]]) -> None:
    client, ids = reviews_env

    unauthorized = await client.post(
        f"/api/v1/products/{ids['p1_slug']}/reviews",
        json={"rating": 5, "review_text": "x"},
    )
    assert unauthorized.status_code == 401

    me_unauth = await client.get(f"/api/v1/products/{ids['p1_slug']}/reviews/me")
    assert me_unauth.status_code == 401

    await register_verify_login(client, "u1@example.com", "User One")
    bad = await client.post(
        f"/api/v1/products/{ids['p1_slug']}/reviews",
        headers=csrf(client),
        json={"rating": 6, "review_text": "bad"},
    )
    assert bad.status_code == 422

    ok = await client.post(
        f"/api/v1/products/{ids['p1_slug']}/reviews",
        headers=csrf(client),
        json={"rating": 4, "review_text": "ok"},
    )
    assert ok.status_code == 200
    me = await client.get(f"/api/v1/products/{ids['p1_slug']}/reviews/me")
    assert me.status_code == 200
    assert me.json()["id"] == ok.json()["id"]


@pytest.mark.asyncio
async def test_summaries_distribution_and_sorting(reviews_env: tuple[AsyncClient, dict[str, str]]) -> None:
    client, ids = reviews_env
    await register_verify_login(client, "u1@example.com", "User One")
    await client.post(f"/api/v1/products/{ids['p1_slug']}/reviews", headers=csrf(client), json={"rating": 5, "review_text": "A"})
    await client.post("/api/v1/auth/logout", headers=csrf(client))

    await register_verify_login(client, "u2@example.com", "User Two")
    await client.post(f"/api/v1/products/{ids['p1_slug']}/reviews", headers=csrf(client), json={"rating": 2, "review_text": "B"})
    await client.post("/api/v1/auth/logout", headers=csrf(client))

    await register_verify_login(client, "u3@example.com", "User Three")
    await client.post(f"/api/v1/products/{ids['p1_slug']}/reviews", headers=csrf(client), json={"rating": 4, "review_text": "C"})

    summaries = await client.get(f"/api/v1/products/reviews/summaries?slugs={ids['p1_slug']},{ids['p2_slug']},missing")
    assert summaries.status_code == 200
    body = summaries.json()
    assert ids["p1_slug"] in body
    assert ids["p2_slug"] in body
    assert "missing" not in body
    assert body[ids["p1_slug"]]["review_count"] == 3
    assert body[ids["p1_slug"]]["distribution"] == {"1": 0, "2": 1, "3": 0, "4": 1, "5": 1}
    assert body[ids["p1_slug"]]["price"] == 100.0
    assert body[ids["p1_slug"]]["currency"] == "USD"
    assert body[ids["p2_slug"]]["review_count"] == 0
    assert body[ids["p2_slug"]]["average_rating"] is None

    recent = await client.get(f"/api/v1/products/{ids['p1_slug']}/reviews?sort=recent&page=1&page_size=10")
    assert recent.status_code == 200
    assert [i["rating"] for i in recent.json()["items"]] == [4, 2, 5]

    highest = await client.get(f"/api/v1/products/{ids['p1_slug']}/reviews?sort=highest")
    assert [i["rating"] for i in highest.json()["items"]] == [5, 4, 2]

    lowest = await client.get(f"/api/v1/products/{ids['p1_slug']}/reviews?sort=lowest")
    assert [i["rating"] for i in lowest.json()["items"]] == [2, 4, 5]
