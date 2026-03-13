"""
Unit tests for provider parse_utils (ingredient list parsing).
"""
import pytest

from providers.parse_utils import parse_ingredients_text
from providers.base import IngredientResult


def test_parse_colon_format():
    """Lines with 'ingredient: quantity' are parsed."""
    text = "- rice: 1 cup\n- chicken: 150g"
    out = parse_ingredients_text(text)
    assert len(out) == 2
    assert out[0].ingredient == "rice"
    assert out[0].quantity == "1 cup"
    assert out[1].ingredient == "chicken"
    assert out[1].quantity == "150g"


def test_parse_parentheses_format():
    """Lines with 'ingredient (quantity)' are parsed."""
    text = "bread (2 slices)"
    out = parse_ingredients_text(text)
    assert len(out) == 1
    assert out[0].ingredient == "bread"
    assert out[0].quantity == "2 slices"


def test_parse_dash_prefix_stripped():
    """Leading - or * are stripped."""
    text = "* salad: small portion"
    out = parse_ingredients_text(text)
    assert len(out) == 1
    assert out[0].ingredient == "salad"
    assert out[0].quantity == "small portion"


def test_parse_empty_line_skipped():
    """Empty lines are skipped."""
    text = "- a: 1\n\n- b: 2"
    out = parse_ingredients_text(text)
    assert len(out) == 2


def test_parse_no_colon_uses_default_quantity():
    """Line without colon has quantity 'portion non précisée'."""
    text = "unknown item"
    out = parse_ingredients_text(text)
    assert len(out) == 1
    assert out[0].ingredient == "unknown item"
    assert out[0].quantity == "portion non précisée"


def test_parse_empty_string_returns_empty_list():
    """Empty or whitespace-only text returns []."""
    assert parse_ingredients_text("") == []
    assert parse_ingredients_text("   \n  ") == []
