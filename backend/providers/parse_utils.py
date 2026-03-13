"""Shared parsing of model text output into ingredient + quantity list."""
import re
from typing import List
from .base import IngredientResult


def parse_ingredients_text(text: str) -> List[IngredientResult]:
    """Parse raw model output into list of IngredientResult."""
    items: List[IngredientResult] = []
    lines = [s.strip() for s in text.split("\n") if s.strip()]
    for line in lines:
        line = re.sub(r"^[\-\*•]\s*", "", line).strip()
        if not line:
            continue
        name, quantity = "", "portion non précisée"
        if ":" in line:
            parts = line.split(":", 1)
            name = parts[0].strip()
            quantity = (parts[1].strip() or quantity)
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
            items.append(IngredientResult(ingredient=name, quantity=quantity))
    return items
