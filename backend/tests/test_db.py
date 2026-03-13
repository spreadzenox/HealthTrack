"""
Unit tests for health data persistence (db module).
"""
from datetime import datetime, timezone

import pytest

# Import after conftest has set HEALTHTRACK_DB
from db import (
    create_entry,
    get_entry,
    init_db,
    list_entries,
    ENTRY_TYPE_FOOD,
    ENTRY_TYPE_WEIGHT,
    SOURCE_APP_FOOD,
    SOURCE_SCALE,
)


@pytest.fixture
def initialized_db(clean_db):
    """Ensure DB exists and is empty for the test. Depends on conftest.clean_db."""
    init_db()
    yield


def test_init_db_creates_table(initialized_db):
    """init_db creates health_entries table and indexes."""
    init_db()  # idempotent
    entries = list_entries(limit=1)
    assert entries == []


def test_create_entry_returns_id(initialized_db):
    """create_entry inserts a row and returns the new id."""
    eid = create_entry(
        entry_type=ENTRY_TYPE_FOOD,
        source=SOURCE_APP_FOOD,
        payload={"items": [{"ingredient": "rice", "quantity": "1 cup"}]},
    )
    assert isinstance(eid, int)
    assert eid >= 1


def test_get_entry_returns_created_entry(initialized_db):
    """get_entry returns the entry with parsed payload."""
    payload = {"items": [{"ingredient": "bread", "quantity": "2 slices"}]}
    eid = create_entry(entry_type=ENTRY_TYPE_FOOD, source=SOURCE_APP_FOOD, payload=payload)
    entry = get_entry(eid)
    assert entry is not None
    assert entry["id"] == eid
    assert entry["type"] == ENTRY_TYPE_FOOD
    assert entry["source"] == SOURCE_APP_FOOD
    assert entry["payload"] == payload
    assert "at" in entry
    assert "created_at" in entry


def test_get_entry_returns_none_for_unknown_id(initialized_db):
    """get_entry returns None for non-existent id."""
    assert get_entry(99999) is None


def test_list_entries_ordered_by_at_desc(initialized_db):
    """list_entries returns entries newest first."""
    create_entry(entry_type=ENTRY_TYPE_FOOD, source=SOURCE_APP_FOOD, payload={"a": 1})
    create_entry(entry_type=ENTRY_TYPE_FOOD, source=SOURCE_APP_FOOD, payload={"b": 2})
    entries = list_entries(limit=10)
    assert len(entries) == 2
    assert entries[0]["payload"] == {"b": 2}
    assert entries[1]["payload"] == {"a": 1}


def test_list_entries_filter_by_type(initialized_db):
    """list_entries filters by entry_type."""
    create_entry(entry_type=ENTRY_TYPE_FOOD, source=SOURCE_APP_FOOD, payload={})
    create_entry(entry_type=ENTRY_TYPE_WEIGHT, source=SOURCE_SCALE, payload={"kg": 70})
    food_only = list_entries(entry_type=ENTRY_TYPE_FOOD)
    assert len(food_only) == 1
    assert food_only[0]["type"] == ENTRY_TYPE_FOOD


def test_list_entries_filter_by_source(initialized_db):
    """list_entries filters by source."""
    create_entry(entry_type=ENTRY_TYPE_FOOD, source=SOURCE_APP_FOOD, payload={})
    create_entry(entry_type=ENTRY_TYPE_WEIGHT, source=SOURCE_SCALE, payload={})
    scale_only = list_entries(source=SOURCE_SCALE)
    assert len(scale_only) == 1
    assert scale_only[0]["source"] == SOURCE_SCALE


def test_list_entries_respects_limit(initialized_db):
    """list_entries respects limit parameter."""
    for _ in range(5):
        create_entry(entry_type=ENTRY_TYPE_FOOD, source=SOURCE_APP_FOOD, payload={})
    entries = list_entries(limit=2)
    assert len(entries) == 2


def test_create_entry_with_explicit_at(initialized_db):
    """create_entry accepts optional at datetime."""
    at = datetime(2025, 3, 1, 12, 0, 0, tzinfo=timezone.utc)
    eid = create_entry(
        entry_type=ENTRY_TYPE_FOOD,
        source=SOURCE_APP_FOOD,
        payload={},
        at=at,
    )
    entry = get_entry(eid)
    assert entry is not None
    assert "2025-03-01" in entry["at"]
