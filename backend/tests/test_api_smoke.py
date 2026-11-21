import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_app_starts_and_health_returns_ok(client: AsyncClient) -> None:
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_health_with_test_database(db_client: AsyncClient) -> None:
    response = await db_client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
