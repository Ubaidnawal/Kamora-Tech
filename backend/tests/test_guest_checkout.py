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
async def guest_checkout_env() -> AsyncGenerator[tuple[AsyncClient, dict[str, str]], None]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        category = ProductCategory(name="Web", slug="web", is_active=True)
        session.add(category)
        await session.flush()
        active = Product(
            category_id=category.id,
            name="Active Product",
            slug="active-product",
            short_description="Active",
            description="Active",
            features=[],
            specifications={},
            price=100.0,
            currency="USD",
            status=ProductStatus.active,
            is_active=True,
        )
        second = Product(
            category_id=category.id,
            name="Second Product",
            slug="second-product",
            short_description="Second",
            description="Second",
            features=[],
            specifications={},
            price=50.0,
            currency="USD",
            status=ProductStatus.active,
            is_active=True,
        )
        unavailable = Product(
            category_id=category.id,
            name="Unavailable Product",
            slug="unavailable-product",
            short_description="Unavailable",
            description="Unavailable",
            features=[],
            specifications={},
            price=30.0,
            currency="USD",
            status=ProductStatus.draft,
            is_active=False,
        )
        no_price = Product(
            category_id=category.id,
            name="No Price",
            slug="no-price",
            short_description="No price",
            description="No price",
            features=[],
            specifications={},
            price=None,
            currency="USD",
            status=ProductStatus.active,
            is_active=True,
        )
        eur = Product(
            category_id=category.id,
            name="Euro Product",
            slug="euro-product",
            short_description="EUR",
            description="EUR",
            features=[],
            specifications={},
            price=20.0,
            currency="EUR",
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
        session.add_all([active, second, unavailable, no_price, eur, admin])
        await session.commit()
        ids = {
            "active": active.id,
            "second": second.id,
            "unavailable": unavailable.id,
            "no_price": no_price.id,
            "eur": eur.id,
        }

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


async def register_and_verify(client: AsyncClient, email: str) -> None:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test Customer",
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


async def login(client: AsyncClient, email: str, password: str) -> dict[str, object]:
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password, "remember_me": True},
    )
    assert response.status_code == 200, response.text
    return response.json()


@pytest.mark.asyncio
async def test_guest_checkout_creates_null_user_order_and_tracks(guest_checkout_env: tuple[AsyncClient, dict[str, str]]) -> None:
    client, ids = guest_checkout_env
    payload = {
        "customer_name": "Guest Buyer",
        "customer_email": "guest@example.com",
        "customer_phone": "+15550001111",
        "business_name": "Guest Co",
        "project_requirements": "Need it fast",
        "additional_instructions": "No calls",
        "items": [
            {"product_id": ids["active"], "quantity": 2},
            {"product_id": ids["second"], "quantity": 1},
        ],
    }
    response = await client.post("/api/v1/orders/guest", json=payload)
    assert response.status_code == 201, response.text
    order = response.json()
    assert order["user_id"] is None
    assert order["amount"] == 250.0
    assert order["currency"] == "USD"
    assert order["payment_status"] == "awaiting_payment"
    assert order["order_status"] == "pending"
    assert order["product_name_snapshot"].endswith("(+1 more)")
    assert len(order["items"]) == 2
    assert order["status_history"][0]["note"] == "Order placed"

    track = await client.get(f"/api/v1/orders/track/{order['tracking_id']}")
    assert track.status_code == 200, track.text
    tracked = track.json()
    assert tracked["tracking_id"] == order["tracking_id"]
    assert tracked["order_number"] == order["order_number"]
    assert "customer_email" not in tracked
    assert "user_id" not in tracked


@pytest.mark.asyncio
async def test_guest_checkout_validation_and_price_rules(guest_checkout_env: tuple[AsyncClient, dict[str, str]]) -> None:
    client, ids = guest_checkout_env
    base = {
        "customer_name": "Guest Buyer",
        "customer_email": "guest@example.com",
        "customer_phone": "+15550001111",
    }

    dup = await client.post(
        "/api/v1/orders/guest",
        json={**base, "items": [{"product_id": ids["active"], "quantity": 1}, {"product_id": ids["active"], "quantity": 2}]},
    )
    assert dup.status_code == 400

    unavailable = await client.post(
        "/api/v1/orders/guest",
        json={**base, "items": [{"product_id": ids["unavailable"], "quantity": 1}]},
    )
    assert unavailable.status_code == 400

    no_price = await client.post(
        "/api/v1/orders/guest",
        json={**base, "items": [{"product_id": ids["no_price"], "quantity": 1}]},
    )
    assert no_price.status_code == 400

    mixed_currency = await client.post(
        "/api/v1/orders/guest",
        json={**base, "items": [{"product_id": ids["active"], "quantity": 1}, {"product_id": ids["eur"], "quantity": 1}]},
    )
    assert mixed_currency.status_code == 400


@pytest.mark.asyncio
async def test_guest_orders_do_not_affect_authenticated_ownership(guest_checkout_env: tuple[AsyncClient, dict[str, str]]) -> None:
    client, ids = guest_checkout_env
    guest = await client.post(
        "/api/v1/orders/guest",
        json={
            "customer_name": "Guest Buyer",
            "customer_email": "guest@example.com",
            "customer_phone": "+15550001111",
            "items": [{"product_id": ids["active"], "quantity": 1}],
        },
    )
    assert guest.status_code == 201, guest.text
    guest_order_id = guest.json()["id"]

    await register_and_verify(client, "customer@example.com")
    await login(client, "customer@example.com", "Customer1234")
    my_orders = await client.get("/api/v1/orders")
    assert my_orders.status_code == 200
    assert all(o["id"] != guest_order_id for o in my_orders.json())

    fetched = await client.get(f"/api/v1/orders/{guest_order_id}")
    assert fetched.status_code == 404

    added = await client.post(
        "/api/v1/cart/items",
        headers=csrf(client),
        json={"product_id": ids["second"], "quantity": 1},
    )
    assert added.status_code == 200, added.text
    checkout = await client.post(
        "/api/v1/orders",
        headers=csrf(client),
        json={
            "customer_name": "Test Customer",
            "customer_email": "customer@example.com",
            "customer_phone": "+10000000001",
        },
    )
    assert checkout.status_code == 201, checkout.text
    assert checkout.json()["user_id"] is not None
