import base64
import os
from typing import List

from openai import OpenAI

from .base import BaseProvider, IngredientResult
from .parse_utils import parse_ingredients_text


PROMPT = (
    "List all food ingredients visible on this plate/meal. "
    "For each ingredient, give an estimated quantity (e.g. small portion, medium portion, about X g, one spoon). "
    "Use this exact format, one per line: - ingredient: quantity"
)


class OpenAIProvider(BaseProvider):
    def __init__(self, api_key: str | None = None, model: str = "gpt-4o"):
        self.client = OpenAI(api_key=api_key or os.environ.get("OPENAI_API_KEY"))
        self.model = model

    @property
    def name(self) -> str:
        return "openai"

    def predict(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> List[IngredientResult]:
        b64 = base64.standard_b64encode(image_bytes).decode("ascii")
        content = [
            {
                "type": "text",
                "text": PROMPT,
            },
            {
                "type": "image_url",
                "image_url": {"url": f"data:{mime_type};base64,{b64}"},
            },
        ]
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": content}],
            max_tokens=500,
        )
        text = (response.choices[0].message.content or "").strip()
        return parse_ingredients_text(text)
