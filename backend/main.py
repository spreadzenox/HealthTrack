"""
HealthTrack API: image → ingredients + quantities.
Run remotely; supports OpenAI, Gemini, or local VLM.
"""
import os
from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from providers import get_provider, IngredientResult

app = FastAPI(
    title="HealthTrack Ingredient API",
    description="Upload a meal/plate image, get back ingredients and estimated quantities.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class IngredientItem(BaseModel):
    ingredient: str
    quantity: str


class PredictResponse(BaseModel):
    provider: str
    items: List[IngredientItem]


def _get_provider_name() -> str:
    return os.environ.get("HEALTHTRACK_PROVIDER", "openai").lower()


@app.get("/health")
def health():
    return {"status": "ok", "provider": _get_provider_name()}


@app.post("/api/predict", response_model=PredictResponse)
async def predict(
    file: UploadFile = File(...),
    provider: str | None = None,
):
    """
    Upload a plate/meal image; returns list of ingredients with estimated quantities.
    Optional query param: provider=openai|gemini|local (default from HEALTHTRACK_PROVIDER env).
    """
    provider_name = (provider or _get_provider_name()).lower()
    if provider_name not in ("openai", "gemini", "local"):
        raise HTTPException(400, "provider must be openai, gemini, or local")

    content_type = file.content_type or "image/jpeg"
    if not content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image (e.g. image/jpeg, image/png)")

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
