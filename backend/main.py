"""
HealthTrack API: health data hub.
- Food: image → ingredients + quantities (predict + log).
- Health entries: unified storage for food, future Samsung Watch, scale.
"""
import os
from datetime import datetime
from typing import Any, List, Optional

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from providers import get_provider, IngredientResult

from db import (
    create_entry,
    get_entry,
    init_db,
    list_entries,
    ENTRY_TYPE_FOOD,
    SOURCE_APP_FOOD,
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
class IngredientItem(BaseModel):
    ingredient: str
    quantity: str


class PredictResponse(BaseModel):
    provider: str
    items: List[IngredientItem]


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


class MealLogResponse(BaseModel):
    entry_id: int
    provider: str
    items: List[IngredientItem]


def _get_provider_name() -> str:
    return os.environ.get("HEALTHTRACK_PROVIDER", "openai").lower()


def _get_app_version() -> str:
    return os.environ.get("APP_VERSION", "1.0.0")


# ----- Health & version -----
@app.get("/health")
def health():
    return {"status": "ok", "provider": _get_provider_name()}


@app.get("/api/version")
def version():
    return {"version": _get_app_version()}


# ----- Predict (existing) -----
@app.post("/api/predict", response_model=PredictResponse)
async def predict(
    file: UploadFile = File(...),
    provider: str | None = None,
):
    provider_name = (provider or _get_provider_name()).lower()
    if provider_name not in ("openai", "gemini", "local"):
        raise HTTPException(400, "provider must be openai, gemini, or local")
    content_type = file.content_type or "image/jpeg"
    if not content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(400, "Empty file")
    try:
        p = get_provider(provider_name)
        results: List[IngredientResult] = p.predict(image_bytes, mime_type=content_type)
    except Exception as e:
        raise HTTPException(502, f"Provider error: {str(e)}")
    return PredictResponse(
        provider=p.name,
        items=[IngredientItem(ingredient=r.ingredient, quantity=r.quantity) for r in results],
    )


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


# ----- Meals: predict + log in one call -----
@app.post("/api/meals", response_model=MealLogResponse)
async def log_meal(
    file: UploadFile = File(...),
    provider: str | None = None,
):
    """Upload a plate image: run ingredient model and save as a food entry. Returns entry id + items."""
    provider_name = (provider or _get_provider_name()).lower()
    if provider_name not in ("openai", "gemini", "local"):
        raise HTTPException(400, "provider must be openai, gemini, or local")
    content_type = file.content_type or "image/jpeg"
    if not content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(400, "Empty file")
    try:
        p = get_provider(provider_name)
        results: List[IngredientResult] = p.predict(image_bytes, mime_type=content_type)
    except Exception as e:
        raise HTTPException(502, f"Provider error: {str(e)}")
    items = [IngredientItem(ingredient=r.ingredient, quantity=r.quantity) for r in results]
    payload = {
        "items": [{"ingredient": i.ingredient, "quantity": i.quantity} for i in items],
        "provider": p.name,
    }
    entry_id = create_entry(
        entry_type=ENTRY_TYPE_FOOD,
        source=SOURCE_APP_FOOD,
        payload=payload,
    )
    return MealLogResponse(entry_id=entry_id, provider=p.name, items=items)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
