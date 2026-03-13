"""
Health data persistence for the hub.
Single table for all sources: food (app), Samsung Watch, scale.
"""
import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, List, Optional

def _get_db_path() -> str:
    """Resolved at call time so tests can set HEALTHTRACK_DB per test."""
    return os.environ.get("HEALTHTRACK_DB") or str(Path(__file__).resolve().parent / "healthtrack.db")

# Default user until we add auth
DEFAULT_USER_ID = int(os.environ.get("HEALTHTRACK_USER_ID", "1"))

# Types and sources for the hub (extensible)
ENTRY_TYPE_FOOD = "food"
ENTRY_TYPE_ACTIVITY = "activity"   # future: Samsung Watch
ENTRY_TYPE_WEIGHT = "weight"       # future: scale
ENTRY_TYPE_SLEEP = "sleep"         # future: Samsung Watch
SOURCE_APP_FOOD = "app_food"
SOURCE_SAMSUNG_WATCH = "samsung_watch"
SOURCE_SCALE = "scale"


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(_get_db_path())
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create health_entries table if missing."""
    with _conn() as c:
        c.execute("""
            CREATE TABLE IF NOT EXISTS health_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                source TEXT NOT NULL,
                at TEXT NOT NULL,
                payload TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        c.execute(
            "CREATE INDEX IF NOT EXISTS idx_health_entries_user_at ON health_entries(user_id, at)"
        )
        c.execute(
            "CREATE INDEX IF NOT EXISTS idx_health_entries_type ON health_entries(type)"
        )


def create_entry(
    entry_type: str,
    source: str,
    payload: dict,
    at: Optional[datetime] = None,
    user_id: Optional[int] = None,
) -> int:
    """Insert one health entry; returns id."""
    user_id = user_id or DEFAULT_USER_ID
    now = datetime.now(timezone.utc).isoformat()
    at_iso = (at or datetime.now(timezone.utc)).isoformat()
    payload_json = json.dumps(payload)
    with _conn() as c:
        cur = c.execute(
            """
            INSERT INTO health_entries (user_id, type, source, at, payload, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user_id, entry_type, source, at_iso, payload_json, now),
        )
        return cur.lastrowid


def get_entry(entry_id: int, user_id: Optional[int] = None) -> Optional[dict]:
    """Get one health entry by id."""
    user_id = user_id or DEFAULT_USER_ID
    with _conn() as c:
        row = c.execute(
            "SELECT id, user_id, type, source, at, payload, created_at FROM health_entries WHERE id = ? AND user_id = ?",
            (entry_id, user_id),
        ).fetchone()
    if not row:
        return None
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "type": row["type"],
        "source": row["source"],
        "at": row["at"],
        "payload": json.loads(row["payload"]),
        "created_at": row["created_at"],
    }


def list_entries(
    user_id: Optional[int] = None,
    from_at: Optional[datetime] = None,
    to_at: Optional[datetime] = None,
    entry_type: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 100,
) -> List[dict]:
    """List health entries as dicts with id, type, source, at, payload."""
    user_id = user_id or DEFAULT_USER_ID
    sql = "SELECT id, user_id, type, source, at, payload, created_at FROM health_entries WHERE user_id = ?"
    params: List[Any] = [user_id]
    if from_at:
        sql += " AND at >= ?"
        params.append(from_at.isoformat())
    if to_at:
        sql += " AND at <= ?"
        params.append(to_at.isoformat())
    if entry_type:
        sql += " AND type = ?"
        params.append(entry_type)
    if source:
        sql += " AND source = ?"
        params.append(source)
    sql += " ORDER BY at DESC LIMIT ?"
    params.append(limit)
    with _conn() as c:
        rows = c.execute(sql, params).fetchall()
    out = []
    for r in rows:
        out.append({
            "id": r["id"],
            "user_id": r["user_id"],
            "type": r["type"],
            "source": r["source"],
            "at": r["at"],
            "payload": json.loads(r["payload"]),
            "created_at": r["created_at"],
        })
    return out
