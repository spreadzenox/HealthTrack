# food_vision/predictor.py
"""
Modèle de reconnaissance d'image alimentaire.
À partir d'une image d'assiette, retourne une liste d'ingrédients avec quantités estimées.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import List, Union

import torch
from PIL import Image
from transformers import Blip2Processor, Blip2ForConditionalGeneration


@dataclass
class IngredientItem:
    """Un ingrédient avec sa quantité estimée."""

    name: str
    quantity: str  # ex: "petite portion", "environ 150g", "1 cuillère"


# Prompt pour que le modèle liste ingrédients et quantités (français)
PROMPT_INGREDIENTS = (
    "Liste tous les aliments et ingrédients visibles sur cette assiette. "
    "Pour chaque ingrédient, indique une estimation de quantité (ex: petite portion, portion moyenne, "
    "environ X g, une cuillère, etc.). Format: - ingrédient: quantité"
)

# Variante courte si le modèle coupe la réponse
PROMPT_INGREDIENTS_SHORT = (
    "Liste les aliments sur cette assiette avec une estimation de quantité pour chacun. "
    "Format: - aliment: quantité"
)


def _load_image(image_input: Union[str, Path, Image.Image]) -> Image.Image:
    if isinstance(image_input, Image.Image):
        return image_input.convert("RGB")
    path = Path(image_input)
    if not path.exists():
        raise FileNotFoundError(f"Image introuvable: {path}")
    return Image.open(path).convert("RGB")


def _parse_ingredients_text(text: str) -> List[IngredientItem]:
    """Parse la sortie texte du modèle en liste structurée IngredientItem."""
    items: List[IngredientItem] = []
    lines = [s.strip() for s in text.split("\n") if s.strip()]
    for line in lines:
        line = re.sub(r"^[\-\*•]\s*", "", line).strip()
        if not line:
            continue
        name, quantity = "", "portion non précisée"
        # Format "ingrédient (quantité)" ou "ingrédient - quantité"
        if ":" in line:
            parts = line.split(":", 1)
            name = parts[0].strip()
            quantity = parts[1].strip() or quantity
        elif re.search(r"\s+-\s+", line):
            parts = re.split(r"\s+-\s+", line, 1)
            name = parts[0].strip()
            quantity = parts[1].strip() if len(parts) > 1 else quantity
        elif "(" in line and ")" in line:
            m = re.match(r"^(.+?)\s*\(([^)]+)\)\s*$", line)
            if m:
                name, quantity = m.group(1).strip(), m.group(2).strip()
            else:
                name = line
        else:
            name = line
        if name:
            items.append(IngredientItem(name=name, quantity=quantity))
    return items


class FoodImagePredictor:
    """Prédicteur ingrédients + quantités à partir d'une image (BLIP-2)."""

    def __init__(
        self,
        model_name: str = "Salesforce/blip2-opt-2.7b",
        device: str | None = None,
    ):
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = device
        self.model_name = model_name
        self._processor = None
        self._model = None

    def _ensure_loaded(self) -> None:
        if self._model is not None:
            return
        self._processor = Blip2Processor.from_pretrained(self.model_name)
        self._model = Blip2ForConditionalGeneration.from_pretrained(self.model_name)
        self._model.to(self.device)
        self._model.eval()

    def predict(
        self,
        image_input: Union[str, Path, Image.Image],
        prompt: str | None = None,
        max_new_tokens: int = 150,
        do_parse: bool = True,
    ) -> List[IngredientItem]:
        """
        Prédit la liste d'ingrédients et quantités à partir d'une image.

        :param image_input: chemin vers l'image ou PIL Image
        :param prompt: prompt optionnel (défaut: PROMPT_INGREDIENTS)
        :param max_new_tokens: longueur max de la réponse générée
        :param do_parse: si True, parse la réponse en liste IngredientItem
        :return: liste d'IngredientItem (name, quantity)
        """
        self._ensure_loaded()
        image = _load_image(image_input)
        prompt = prompt or PROMPT_INGREDIENTS

        inputs = self._processor(images=image, text=prompt, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            out = self._model.generate(**inputs, max_new_tokens=max_new_tokens)

        answer = self._processor.decode(out[0], skip_special_tokens=True).strip()
        if do_parse:
            return _parse_ingredients_text(answer)
        # Retourner un seul item "brut" si pas de parsing
        return [IngredientItem(name=answer, quantity="")]


def predict_ingredients(
    image_input: Union[str, Path, Image.Image],
    model_name: str = "Salesforce/blip2-opt-2.7b",
    device: str | None = None,
    max_new_tokens: int = 150,
) -> List[IngredientItem]:
    """
    API simple: image -> liste d'ingrédients avec quantités.

    :param image_input: chemin image ou PIL Image
    :param model_name: modèle Hugging Face (BLIP-2 par défaut)
    :param device: "cuda" ou "cpu" (auto si None)
    :param max_new_tokens: longueur max de la réponse
    :return: liste d'IngredientItem
    """
    predictor = FoodImagePredictor(model_name=model_name, device=device)
    return predictor.predict(image_input, max_new_tokens=max_new_tokens)
