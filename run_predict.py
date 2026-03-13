#!/usr/bin/env python3
"""
Script CLI pour prédire les ingrédients et quantités à partir d'une image d'assiette.

Usage:
  python run_predict.py path/to/plate.jpg
  python run_predict.py path/to/plate.jpg --model Salesforce/blip2-opt-2.7b --device cuda
"""

import argparse
import json
import sys
from pathlib import Path

# Ajouter la racine du projet au path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from food_vision import predict_ingredients, IngredientItem


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Reconnaissance d'image alimentaire → ingrédients + quantités"
    )
    parser.add_argument(
        "image",
        type=Path,
        help="Chemin vers l'image de l'assiette / du repas",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="Salesforce/blip2-opt-2.7b",
        help="Modèle Hugging Face (défaut: Salesforce/blip2-opt-2.7b)",
    )
    parser.add_argument(
        "--device",
        type=str,
        default=None,
        choices=["cuda", "cpu"],
        help="Device (cuda/cpu). Auto-détection si non précisé.",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=150,
        help="Nombre max de tokens générés (défaut: 150)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Sortie JSON au lieu du format lisible",
    )
    args = parser.parse_args()

    if not args.image.exists():
        print(f"Erreur: fichier introuvable: {args.image}", file=sys.stderr)
        sys.exit(1)

    print("Chargement du modèle et prédiction...", file=sys.stderr)
    try:
        items = predict_ingredients(
            args.image,
            model_name=args.model,
            device=args.device,
            max_new_tokens=args.max_tokens,
        )
    except Exception as e:
        print(f"Erreur: {e}", file=sys.stderr)
        sys.exit(1)

    if args.json:
        out = [{"ingredient": i.name, "quantity": i.quantity} for i in items]
        print(json.dumps(out, ensure_ascii=False, indent=2))
    else:
        print("Ingrédients détectés:")
        for i in items:
            print(f"  - {i.name}: {i.quantity}")


if __name__ == "__main__":
    main()
