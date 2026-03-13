"""
Base nutritionnelle : chargement des ingrédients et calcul des apports.
Utilisée pour contraindre la sortie du modèle (noms autorisés) et pour l'analyse nutritionnelle.
"""
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

# Chemin vers la base (JSON) — peut être étendu avec Ciqual / autre source
DATA_DIR = Path(__file__).resolve().parent / "data"
INGREDIENTS_FILE = DATA_DIR / "ingredients_nutrition.json"

_ingredients_cache: Optional[List[Dict[str, Any]]] = None


def _load_ingredients() -> List[Dict[str, Any]]:
    global _ingredients_cache
    if _ingredients_cache is None:
        with open(INGREDIENTS_FILE, encoding="utf-8") as f:
            _ingredients_cache = json.load(f)
    return _ingredients_cache


def get_allowed_ingredient_names() -> List[str]:
    """Liste des noms canoniques d'ingrédients (pour contraindre le prompt Gemini)."""
    return [item["name"] for item in _load_ingredients()]


def find_ingredient(name: str) -> Optional[Dict[str, Any]]:
    """Retourne l'entrée ingrédient par nom (insensible à la casse, espaces)."""
    name_clean = (name or "").strip().lower()
    if not name_clean:
        return None
    for item in _load_ingredients():
        if item["name"].strip().lower() == name_clean:
            return item
    return None


def compute_nutrition(
    items: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Calcule les totaux nutritionnels à partir d'une liste { "ingredient": str, "quantity_g": float }.
    Retourne total + détail par ingrédient (énergie, protéines, glucides, lipides, fibres).
    """
    total: Dict[str, float] = {
        "energy_kcal": 0.0,
        "protein_g": 0.0,
        "carbohydrates_g": 0.0,
        "fat_g": 0.0,
        "fiber_g": 0.0,
    }
    per_ingredient: List[Dict[str, Any]] = []

    for it in items:
        name = (it.get("ingredient") or "").strip()
        qty_g = it.get("quantity_g")
        if qty_g is None:
            try:
                qty_g = float(it.get("quantity", 0) or 0)
            except (TypeError, ValueError):
                qty_g = 0.0
        else:
            try:
                qty_g = float(qty_g)
            except (TypeError, ValueError):
                qty_g = 0.0

        ing = find_ingredient(name)
        if not ing or qty_g <= 0:
            per_ingredient.append(
                {
                    "ingredient": name,
                    "quantity_g": qty_g,
                    "matched": ing is not None,
                    "energy_kcal": None,
                    "protein_g": None,
                    "carbohydrates_g": None,
                    "fat_g": None,
                    "fiber_g": None,
                }
            )
            continue

        p100 = ing.get("per_100g") or {}
        factor = qty_g / 100.0
        row = {
            "ingredient": ing["name"],
            "quantity_g": qty_g,
            "matched": True,
            "energy_kcal": round((p100.get("energy_kcal") or 0) * factor, 1),
            "protein_g": round((p100.get("protein_g") or 0) * factor, 1),
            "carbohydrates_g": round((p100.get("carbohydrates_g") or 0) * factor, 1),
            "fat_g": round((p100.get("fat_g") or 0) * factor, 1),
            "fiber_g": round((p100.get("fiber_g") or 0) * factor, 1),
        }
        per_ingredient.append(row)
        total["energy_kcal"] += row["energy_kcal"]
        total["protein_g"] += row["protein_g"]
        total["carbohydrates_g"] += row["carbohydrates_g"]
        total["fat_g"] += row["fat_g"]
        total["fiber_g"] += row["fiber_g"]

    return {
        "total": {k: round(v, 1) for k, v in total.items()},
        "per_ingredient": per_ingredient,
    }
