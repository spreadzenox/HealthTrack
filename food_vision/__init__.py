"""
HealthTrack - Reconnaissance d'images alimentaires.
Input: image d'assiette / repas
Output: liste d'ingrédients avec quantités estimées.
"""

from .predictor import predict_ingredients, IngredientItem

__all__ = ["predict_ingredients", "IngredientItem"]
