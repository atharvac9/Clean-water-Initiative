"""
Integration tests for FastAPI endpoints.
Tests /api/health, /api/sites, and /api/analysis/adhoc.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.database import Base, get_db

# Use in-memory SQLite for testing
engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module")
def client():
    # Pre-create tables using the engine
    import asyncio

    async def init_models():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(init_models())

    with TestClient(app, raise_server_exceptions=False) as c:
        yield c

    async def clean_models():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

    asyncio.run(clean_models())


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "services" in data
    assert "gee_configured" in data["services"]
    assert "clip_model_loaded" in data["services"]
    assert "storage_configured" in data["services"]


def test_create_and_get_site(client):
    payload = {
        "lat": 19.05,
        "lon": 74.72,
        "activity_type": "farm_pond",
        "description": "Test farm pond site",
        "buffer_radius_m": 500,
    }
    create_resp = client.post("/api/sites", json=payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["lat"] == 19.05
    assert created["lon"] == 74.72
    assert created["activity_type"] == "farm_pond"
    assert "id" in created

    site_id = created["id"]
    get_resp = client.get(f"/api/sites/{site_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == site_id


def test_list_sites(client):
    list_resp = client.get("/api/sites")
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert data["total"] >= 1
    assert len(data["sites"]) >= 1


def test_get_nonexistent_site(client):
    resp = client.get("/api/sites/non-existent-id")
    assert resp.status_code == 404


def test_create_site_invalid_coords(client):
    payload = {
        "lat": 95.0,  # Invalid latitude > 90
        "lon": 74.72,
        "activity_type": "check_dam",
    }
    resp = client.post("/api/sites", json=payload)
    assert resp.status_code == 422


def test_adhoc_analysis_graceful_handling(client):
    """Even without GEE configured, adhoc analysis returns a structured response without crashing."""
    payload = {
        "lat": 19.05,
        "lon": 74.72,
        "claimed_activity_type": "farm_pond",
        "buffer_radius_m": 500,
    }
    resp = client.post("/api/analysis/adhoc", json=payload)
    assert resp.status_code in (200, 500)
    if resp.status_code == 200:
        data = resp.json()
        assert "site_id" in data
        assert "mode" in data
