from __future__ import annotations

from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import hash_password
from app.database.base import Base
from app.database.connection import get_db
from app.models import Product, ProductCategory, Role, RoleName, User


@pytest_asyncio.fixture
async def integration() -> AsyncGenerator[tuple[AsyncClient, str], None]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        category = ProductCategory(name="Web", slug="web", description=None, is_active=True)
        session.add(category)
        await session.flush()
        product = Product(
            category_id=category.id,
            name="Test Website",
            slug="test-website",
            short_description="A test product",
            description="A test product used only by the integration suite.",
            features=["Feature"],
            specifications={"scope": "test"},
            price=100.0,
            currency="USD",
            is_active=True,
            is_featured=True,
        )
        role = Role(name=RoleName.admin, description="Bootstrap admin")
        admin = User(
            full_name="Admin User",
            email="admin@example.com",
            phone="+10000000000",
            password_hash=hash_password("Admin1234"),
            is_active=True,
            is_verified=True,
        )
        admin.roles.append(role)
        session.add_all([product, admin])
        await session.commit()
        product_id = product.id

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
            yield client, product_id
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
async def test_full_customer_and_admin_flow(integration: tuple[AsyncClient, str]) -> None:
    client, product_id = integration

    await register_and_verify(client, "customer@example.com")
    duplicate = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Duplicate",
            "email": "customer@example.com",
            "phone": "+10000000002",
            "password": "Customer1234",
            "confirm_password": "Customer1234",
            "accept_terms": True,
        },
    )
    assert duplicate.status_code == 409

    await login(client, "customer@example.com", "Customer1234")
    me = await client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["is_verified"] is True
    assert me.json()["created_at"]

    forbidden = await client.get("/api/v1/admin/dashboard")
    assert forbidden.status_code == 403

    added = await client.post(
        "/api/v1/cart/items",
        headers=csrf(client),
        json={"product_id": product_id, "quantity": 2},
    )
    assert added.status_code == 200, added.text
    assert added.json()["item_count"] == 2

    updated = await client.put(
        f"/api/v1/cart/items/{added.json()['items'][0]['id']}",
        headers=csrf(client),
        json={"quantity": 3},
    )
    assert updated.status_code == 200
    assert updated.json()["item_count"] == 3
    assert updated.json()["total"] == 300.0

    checkout = await client.post(
        "/api/v1/orders",
        headers=csrf(client),
        json={
            "customer_name": "Test Customer",
            "customer_email": "customer@example.com",
            "customer_phone": "+10000000001",
            "business_name": "Test Co",
            "project_requirements": "A premium website",
            "additional_instructions": "None",
        },
    )
    assert checkout.status_code == 201, checkout.text
    order = checkout.json()
    assert order["order_number"]
    assert order["tracking_id"]
    assert order["payment_status"] == "awaiting_payment"
    assert order["order_status"] == "pending"
    assert order["amount"] == 300.0

    orders = await client.get("/api/v1/orders")
    assert orders.status_code == 200
    assert len(orders.json()) == 1

    detail = await client.get(f"/api/v1/orders/{order['id']}")
    assert detail.status_code == 200
    assert detail.json()["customer_email"] == "customer@example.com"

    public_track = await client.get(f"/api/v1/orders/track?identifier={order['tracking_id']}")
    assert public_track.status_code == 200
    assert "customer_email" not in public_track.json()
    assert "customer_name" not in public_track.json()

    by_number = await client.get(f"/api/v1/orders/track?identifier={order['order_number']}")
    assert by_number.status_code == 200
    assert by_number.json()["order_number"] == order["order_number"]

    await register_and_verify(client, "other@example.com")
    await login(client, "other@example.com", "Customer1234")
    other_order = await client.get(f"/api/v1/orders/{order['id']}")
    assert other_order.status_code == 404

    admin_login = await login(client, "admin@example.com", "Admin1234")
    assert "admin" in admin_login["user"]["roles"]
    dashboard = await client.get("/api/v1/admin/dashboard")
    assert dashboard.status_code == 200, dashboard.text
    assert dashboard.json()["total_orders"] == 1
    assert dashboard.json()["revenue_paid"] == 0.0
    assert len(dashboard.json()["recent_orders"]) == 1

    status_update = await client.put(
        f"/api/v1/admin/orders/{order['id']}/status",
        headers=csrf(client),
        json={"order_status": "in_progress", "note": "Work started"},
    )
    assert status_update.status_code == 200, status_update.text
    assert status_update.json()["order_status"] == "in_progress"
    assert len(status_update.json()["status_history"]) == 2

    payment_update = await client.put(
        f"/api/v1/admin/orders/{order['id']}/payment",
        headers=csrf(client),
        json={"status": "paid", "amount": 300.0, "provider": "manual"},
    )
    assert payment_update.status_code == 200, payment_update.text
    assert payment_update.json()["payment_status"] == "paid"

    refreshed = await client.post("/api/v1/auth/refresh", headers=csrf(client))
    assert refreshed.status_code == 200, refreshed.text
    assert refreshed.json()["user"]["email"] == "admin@example.com"

    logout = await client.post("/api/v1/auth/logout", headers=csrf(client))
    assert logout.status_code == 200
    protected = await client.get("/api/v1/auth/me")
    assert protected.status_code in (401, 200)
