"""
API (integration) tests for HealthTrack FastAPI app.
Predict and meals endpoints use a mocked provider so no API keys are required.
"""
from unittest.mock import patch, MagicMock

import pytest
from fastapi.testclient import TestClient

from providers.base import IngredientResult
from providers.errors import NotFoodError


@pytest.fixture
def mock_provider():
    """Provider that returns a fixed list of ingredients (no OpenAI/Gemini call)."""
    provider = MagicMock()
    provider.name = "test"
    provider.predict.return_value = [
        IngredientResult(ingredient="rice", quantity="1 cup"),
        IngredientResult(ingredient="chicken", quantity="150g"),
    ]
    return provider


def test_health_returns_ok(client: TestClient):
    """GET /health returns status ok and provider name."""
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "provider" in data


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


@patch("main.get_provider")
def test_predict_returns_ingredients(mock_get_provider, client: TestClient, sample_image_bytes, mock_provider):
    """POST /api/predict returns ingredient list from mocked provider."""
    mock_get_provider.return_value = mock_provider
    r = client.post(
        "/api/predict",
        files={"file": ("plate.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["provider"] == "test"
    assert len(data["items"]) == 2
    assert data["items"][0]["ingredient"] == "rice"
    assert data["items"][0]["quantity"] == "1 cup"


def test_predict_rejects_non_image(client: TestClient):
    """POST /api/predict with non-image returns 400."""
    r = client.post(
        "/api/predict",
        files={"file": ("x.txt", b"not an image", "text/plain")},
    )
    assert r.status_code == 400


@patch("main.get_provider")
def test_meals_predicts_and_saves(mock_get_provider, client: TestClient, sample_image_bytes, mock_provider):
    """POST /api/meals runs prediction and saves food entry; returns entry_id and items."""
    mock_get_provider.return_value = mock_provider
    r = client.post(
        "/api/meals",
        files={"file": ("plate.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["entry_id"] >= 1
    assert data["provider"] == "test"
    assert len(data["items"]) == 2

    # Entry should appear in list
    list_r = client.get("/api/health/entries", params={"type": "food"})
    assert list_r.status_code == 200
    entries = list_r.json()
    assert any(e["id"] == data["entry_id"] for e in entries)
    entry = next(e for e in entries if e["id"] == data["entry_id"])
    assert entry["payload"]["items"] == [
        {"ingredient": "rice", "quantity": "1 cup", "quantity_g": None},
        {"ingredient": "chicken", "quantity": "150g", "quantity_g": None},
    ]


@patch("main.get_provider")
def test_predict_returns_422_when_not_food(mock_get_provider, client: TestClient, sample_image_bytes):
    """POST /api/predict returns 422 with not_food when provider raises NotFoodError."""
    provider = MagicMock()
    provider.name = "gemini"
    provider.predict.side_effect = NotFoodError("Ce n'est pas un plat.")
    mock_get_provider.return_value = provider
    r = client.post(
        "/api/predict",
        files={"file": ("photo.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert r.status_code == 422
    data = r.json()
    assert data.get("detail", {}).get("code") == "not_food"
    assert "pas un plat" in data.get("detail", {}).get("message", "")


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
