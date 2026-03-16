"""
HealthTrack API: health data hub.
- Health entries: unified storage (food, future Samsung Watch, scale).
- Analyse nutritionnelle: calcul à partir d'ingrédients + grammages.
L'analyse photo (ingrédients) est faite en standalone dans l'app (Gemini direct).
"""
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from nutrition import compute_nutrition
from db import (
    create_entry,
    get_entry,
    init_db,
    list_entries,
)

app = FastAPI(
    title="HealthTrack API",
    description="Health data hub: food tracking (ingredients + quantities), future Samsung Watch & scale.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----- Init DB on startup -----
@app.on_event("startup")
def startup():
    init_db()


# ----- Schemas -----
class NutritionItemRequest(BaseModel):
    ingredient: str
    quantity_g: float


class NutritionRequest(BaseModel):
    items: List[NutritionItemRequest]


class NutritionResponse(BaseModel):
    total: Dict[str, float]
    per_ingredient: List[Dict[str, Any]]


class HealthEntryCreate(BaseModel):
    type: str
    source: str
    payload: dict
    at: Optional[str] = None


class HealthEntryOut(BaseModel):
    id: int
    type: str
    source: str
    at: str
    payload: dict
    created_at: str


def _get_app_version() -> str:
    return os.environ.get("APP_VERSION", "1.0.0")


# ----- Health & version -----
@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/version")
def version():
    return {"version": _get_app_version()}


# ----- Health entries (hub) -----
@app.post("/api/health/entries", response_model=HealthEntryOut)
def create_health_entry(body: HealthEntryCreate):
    """Create a health entry (food, or future: activity, weight, sleep)."""
    at = None
    if body.at:
        try:
            at = datetime.fromisoformat(body.at.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(400, "Invalid 'at' datetime")
    eid = create_entry(
        entry_type=body.type,
        source=body.source,
        payload=body.payload,
        at=at,
    )
    entry = get_entry(eid)
    if not entry:
        raise HTTPException(500, "Entry created but not found")
    return HealthEntryOut(
        id=entry["id"],
        type=entry["type"],
        source=entry["source"],
        at=entry["at"],
        payload=entry["payload"],
        created_at=entry["created_at"],
    )


@app.get("/api/health/entries", response_model=List[HealthEntryOut])
def get_health_entries(
    from_at: Optional[str] = Query(None),
    to_at: Optional[str] = Query(None),
    type: Optional[str] = Query(None, alias="type"),
    source: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
):
    """List health entries for dashboard. Filter by date range, type (food, activity, weight), source."""
    from_dt = None
    to_dt = None
    if from_at:
        try:
            from_dt = datetime.fromisoformat(from_at.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(400, "Invalid from_at")
    if to_at:
        try:
            to_dt = datetime.fromisoformat(to_at.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(400, "Invalid to_at")
    entries = list_entries(from_at=from_dt, to_at=to_dt, entry_type=type, source=source, limit=limit)
    return [
        HealthEntryOut(
            id=e["id"],
            type=e["type"],
            source=e["source"],
            at=e["at"],
            payload=e["payload"],
            created_at=e["created_at"],
        )
        for e in entries
    ]


# ----- Analyse nutritionnelle -----
@app.post("/api/nutrition", response_model=NutritionResponse)
def analyze_nutrition(body: NutritionRequest):
    """
    Calcule les apports nutritionnels à partir d'une liste d'ingrédients avec grammages.
    Les noms doivent correspondre à la base (noms canoniques). Retourne totaux + détail par ingrédient.
    """
    items = [{"ingredient": i.ingredient, "quantity_g": i.quantity_g} for i in body.items]
    return compute_nutrition(items)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
