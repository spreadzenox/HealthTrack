"""
API (integration) tests for HealthTrack FastAPI app.
"""
import pytest
from fastapi.testclient import TestClient


def test_health_returns_ok(client: TestClient):
    """GET /health returns status ok."""
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"


def test_version_returns_version(client: TestClient):
    """GET /api/version returns version string."""
    r = client.get("/api/version")
    assert r.status_code == 200
    data = r.json()
    assert "version" in data
    assert isinstance(data["version"], str)


def test_create_health_entry(client: TestClient):
    """POST /api/health/entries creates an entry and returns it."""
    r = client.post(
        "/api/health/entries",
        json={
            "type": "food",
            "source": "app_food",
            "payload": {"items": [{"ingredient": "bread", "quantity": "2 slices"}]},
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["id"] >= 1
    assert data["type"] == "food"
    assert data["source"] == "app_food"
    assert data["payload"]["items"] == [{"ingredient": "bread", "quantity": "2 slices"}]
    assert "at" in data
    assert "created_at" in data


def test_create_health_entry_invalid_at(client: TestClient):
    """POST /api/health/entries with invalid at returns 400."""
    r = client.post(
        "/api/health/entries",
        json={"type": "food", "source": "app_food", "payload": {}, "at": "not-a-date"},
    )
    assert r.status_code == 400


def test_list_health_entries_empty(client: TestClient):
    """GET /api/health/entries returns list (empty if no data)."""
    r = client.get("/api/health/entries")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_list_health_entries_after_create(client: TestClient):
    """GET /api/health/entries returns created entries."""
    client.post(
        "/api/health/entries",
        json={"type": "food", "source": "app_food", "payload": {"x": 1}},
    )
    r = client.get("/api/health/entries")
    assert r.status_code == 200
    entries = r.json()
    assert len(entries) >= 1
    assert entries[0]["type"] == "food"
    assert entries[0]["payload"] == {"x": 1}


def test_list_health_entries_filter_by_type(client: TestClient):
    """GET /api/health/entries?type=food returns only food entries."""
    client.post(
        "/api/health/entries",
        json={"type": "food", "source": "app_food", "payload": {}},
    )
    client.post(
        "/api/health/entries",
        json={"type": "weight", "source": "scale", "payload": {"kg": 70}},
    )
    r = client.get("/api/health/entries", params={"type": "food"})
    assert r.status_code == 200
    entries = r.json()
    assert all(e["type"] == "food" for e in entries)


def test_nutrition_returns_totals_and_per_ingredient(client: TestClient):
    """POST /api/nutrition returns total and per_ingredient from nutrition DB."""
    r = client.post(
        "/api/nutrition",
        json={
            "items": [
                {"ingredient": "Riz blanc cuit", "quantity_g": 200},
                {"ingredient": "Poulet grillé", "quantity_g": 150},
            ],
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert "total" in data
    assert "per_ingredient" in data
    assert data["total"]["energy_kcal"] > 0
    assert data["total"]["protein_g"] > 0
    assert len(data["per_ingredient"]) == 2
