"""
Exemple d'utilisation du module food_vision.

À exécuter depuis la racine du projet:
  python examples/usage_example.py [chemin/vers/image.jpg]

Sans argument, utilise une image de test si disponible (examples/sample_plate.jpg).
"""

import sys
from pathlib import Path

# Racine du projet
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from food_vision import predict_ingredients, IngredientItem


def main() -> None:
    image_path = sys.argv[1] if len(sys.argv) > 1 else ROOT / "examples" / "sample_plate.jpg"
    if not Path(image_path).exists():
        print(f"Usage: python {__file__} <image.jpg>")
        print(f"Image non trouvée: {image_path}")
        print("Téléchargez une photo d'assiette ou indiquez un chemin valide.")
        return

    print("Prédiction en cours (chargement du modèle au premier run)...")
    items: list[IngredientItem] = predict_ingredients(
        image_path,
        device="cuda",  # mettre "cpu" si pas de GPU
        max_new_tokens=200,
    )

    print("\nRésultat:")
    for i in items:
        print(f"  • {i.name} — {i.quantity}")


if __name__ == "__main__":
    main()
