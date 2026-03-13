import io
import json
import os
import re
from typing import List

import google.generativeai as genai
from PIL import Image

from .base import BaseProvider, IngredientResult
from .errors import NotFoodError


def _build_prompt(allowed_names: List[str]) -> str:
    names_list = ", ".join(f'"{n}"' for n in allowed_names)
    return f"""Tu analyses une photo de plat / repas pour une application de suivi nutritionnel.

RÈGLES:
1) Si l'image ne montre PAS de nourriture (pas un plat, pas des aliments comestibles), réponds UNIQUEMENT par du JSON valide avec ce format exact:
{{"not_food": true, "reason": "explication courte en français"}}

2) Si l'image montre un plat ou des aliments, liste les ingrédients PRIMAIRES (aliments de base, pas des plats préparés complexes) avec une estimation du poids en grammes.
   Tu DOIS utiliser UNIQUEMENT des noms pris dans cette liste (choisis le plus proche si besoin):
   {names_list}
   Réponds UNIQUEMENT par du JSON valide avec ce format exact:
   {{"not_food": false, "ingredients": [{{"ingredient": "Nom exact de la liste", "quantity_g": nombre}}]}}
   - "ingredient" doit être exactement un des noms de la liste ci-dessus.
   - "quantity_g" doit être un nombre (grammes), pas de texte.

Réponds uniquement avec le JSON, sans texte avant ou après."""


class GeminiProvider(BaseProvider):
    def __init__(self, api_key: str | None = None, model: str = "gemini-2.5-flash"):
        api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        genai.configure(api_key=api_key)
        self.model_name = model
        self._model = genai.GenerativeModel(model)

    @property
    def name(self) -> str:
        return "gemini"

    def predict(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> List[IngredientResult]:
        from nutrition import get_allowed_ingredient_names

        allowed = get_allowed_ingredient_names()
        prompt = _build_prompt(allowed)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        response = self._model.generate_content([prompt, image])
        text = (response.text or "").strip()

        # Extraire du JSON si entouré de markdown
        json_str = text
        if "```" in text:
            m = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
            if m:
                json_str = m.group(1).strip()
        json_str = json_str.strip()

        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValueError(f"Réponse modèle invalide (JSON attendu): {e}") from e

        if data.get("not_food") is True:
            reason = (data.get("reason") or "").strip() or "Cette image ne semble pas représenter un plat ou des aliments."
            raise NotFoodError(reason=reason)

        ingredients = data.get("ingredients") or []
        results: List[IngredientResult] = []
        for it in ingredients:
            name = (it.get("ingredient") or "").strip()
            qty_g = it.get("quantity_g")
            if name:
                if qty_g is not None:
                    try:
                        qty_g = float(qty_g)
                    except (TypeError, ValueError):
                        qty_g = None
                quantity = f"{int(qty_g)} g" if qty_g is not None else "portion non précisée"
                results.append(
                    IngredientResult(ingredient=name, quantity=quantity, quantity_g=qty_g)
                )
        return results
