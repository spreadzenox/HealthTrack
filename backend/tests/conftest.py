"""
Pytest configuration and fixtures for HealthTrack backend.
Each test gets a unique DB file so runs are isolated.
"""
import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="function")
def test_db_path(tmp_path):
    """Unique DB path per test; set in env so db module uses it."""
    path = str(tmp_path / "healthtrack.db")
    os.environ["HEALTHTRACK_DB"] = path
    yield path


@pytest.fixture(scope="function")
def clean_db(test_db_path):
    """Remove test DB file so each test starts from a clean schema."""
    if os.path.exists(test_db_path):
        try:
            os.remove(test_db_path)
        except OSError:
            pass
    yield


@pytest.fixture
def client(clean_db):
    """FastAPI TestClient. Ensures init_db() runs so table exists."""
    from main import app
    from db import init_db
    init_db()
    return TestClient(app)


@pytest.fixture
def sample_image_bytes():
    """Minimal valid JPEG (1x1 pixel) for upload tests."""
    from io import BytesIO
    from PIL import Image
    buf = BytesIO()
    Image.new("RGB", (1, 1), color="red").save(buf, format="JPEG")
    buf.seek(0)
    return buf.getvalue()
