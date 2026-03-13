"""
Local VLM provider (BLIP-2 / InstructBLIP). Requires torch + transformers.
Install backend deps + torch/transformers when using provider=local.
"""
import io
from typing import List

from PIL import Image

from .base import BaseProvider, IngredientResult


class LocalProvider(BaseProvider):
    def __init__(self, model_name: str = "Salesforce/blip2-opt-2.7b", device: str | None = None):
        self.model_name = model_name
        self.device = device
        self._predictor = None

    def _ensure_loaded(self):
        if self._predictor is not None:
            return
        import sys
        from pathlib import Path
        sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
        from food_vision.predictor import FoodImagePredictor
        import torch
        dev = self.device or ("cuda" if torch.cuda.is_available() else "cpu")
        self._predictor = FoodImagePredictor(model_name=self.model_name, device=dev)

    @property
    def name(self) -> str:
        return "local"

    def predict(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> List[IngredientResult]:
        self._ensure_loaded()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        items = self._predictor.predict(image, do_parse=True)
        return [IngredientResult(ingredient=i.name, quantity=i.quantity) for i in items]
