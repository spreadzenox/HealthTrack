import io
import os
from typing import List

import google.generativeai as genai
from PIL import Image

from .base import BaseProvider, IngredientResult
from .parse_utils import parse_ingredients_text


PROMPT = (
    "List all food ingredients visible on this plate/meal. "
    "For each ingredient, give an estimated quantity (e.g. small portion, medium portion, about X g). "
    "Use this exact format, one per line: - ingredient: quantity"
)


class GeminiProvider(BaseProvider):
    def __init__(self, api_key: str | None = None, model: str = "gemini-1.5-flash"):
        api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        genai.configure(api_key=api_key)
        self.model_name = model
        self._model = genai.GenerativeModel(model)

    @property
    def name(self) -> str:
        return "gemini"

    def predict(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> List[IngredientResult]:
        # SDK accepts PIL Image or dict; PIL from bytes is reliable
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        response = self._model.generate_content([PROMPT, image])
        text = (response.text or "").strip()
        return parse_ingredients_text(text)
