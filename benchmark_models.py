#!/usr/bin/env python3
"""
Benchmark des modèles pour la reconnaissance alimentaire (ingrédients + quantités).

Lance BLIP-2 et InstructBLIP sur la même image, mesure le temps et affiche
les sorties brutes + parsées. Permet de comparer qualité et vitesse.

Usage:
  python benchmark_models.py chemin/vers/assiette.jpg
  python benchmark_models.py photo.jpg --models blip2 instructblip
"""

import argparse
import sys
import time
from pathlib import Path

# Racine du projet
sys.path.insert(0, str(Path(__file__).resolve().parent))

from PIL import Image

# Prompt commun pour comparer les modèles
PROMPT = (
    "Liste tous les aliments et ingrédients visibles sur cette assiette. "
    "Pour chaque ingrédient, indique une estimation de quantité (ex: petite portion, portion moyenne, "
    "environ X g). Format: - ingrédient: quantité"
)


def load_image(path: Path) -> Image.Image:
    return Image.open(path).convert("RGB")


def run_blip2(image: Image.Image, device: str, max_new_tokens: int = 180):
    from transformers import Blip2ForConditionalGeneration, Blip2Processor
    import torch

    model_name = "Salesforce/blip2-opt-2.7b"
    processor = Blip2Processor.from_pretrained(model_name)
    model = Blip2ForConditionalGeneration.from_pretrained(model_name)
    model.to(device)
    model.eval()

    inputs = processor(images=image, text=PROMPT, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}

    start = time.perf_counter()
    with torch.no_grad():
        out = model.generate(**inputs, max_new_tokens=max_new_tokens)
    elapsed = time.perf_counter() - start

    text = processor.decode(out[0], skip_special_tokens=True).strip()
    return text, elapsed


def run_instructblip(image: Image.Image, device: str, max_new_tokens: int = 180):
    from transformers import InstructBlipForConditionalGeneration, InstructBlipProcessor
    import torch

    # Flan-T5 XL : bon compromis qualité / VRAM (~10 Go)
    model_name = "Salesforce/instructblip-flan-t5-xl"
    processor = InstructBlipProcessor.from_pretrained(model_name)
    model = InstructBlipForConditionalGeneration.from_pretrained(model_name)
    model.to(device)
    model.eval()

    inputs = processor(images=image, text=PROMPT, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}

    start = time.perf_counter()
    with torch.no_grad():
        out = model.generate(**inputs, max_new_tokens=max_new_tokens)
    elapsed = time.perf_counter() - start

    text = processor.decode(out[0], skip_special_tokens=True).strip()
    return text, elapsed


def parse_ingredients(text: str):
    """Parse la sortie en liste (ingrédient, quantité) pour affichage."""
    from food_vision.predictor import _parse_ingredients_text

    return _parse_ingredients_text(text)


def main():
    parser = argparse.ArgumentParser(description="Benchmark modèles reconnaissance alimentaire")
    parser.add_argument("image", type=Path, help="Chemin vers l'image d'assiette")
    parser.add_argument(
        "--models",
        nargs="+",
        choices=["blip2", "instructblip"],
        default=["blip2", "instructblip"],
        help="Modèles à lancer (défaut: blip2 instructblip)",
    )
    parser.add_argument("--device", default=None, choices=["cuda", "cpu"])
    parser.add_argument("--max-tokens", type=int, default=180)
    args = parser.parse_args()

    if not args.image.exists():
        print(f"Erreur: image introuvable: {args.image}", file=sys.stderr)
        sys.exit(1)

    import torch
    device = args.device or ("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}\nImage: {args.image}\nPrompt: {PROMPT[:80]}...\n")

    image = load_image(args.image)
    max_tokens = args.max_tokens

    runners = []
    if "blip2" in args.models:
        runners.append(("BLIP-2 (OPT-2.7B)", run_blip2))
    if "instructblip" in args.models:
        runners.append(("InstructBLIP (Flan-T5 XL)", run_instructblip))

    for name, run_fn in runners:
        print("=" * 60)
        print(f"  {name}")
        print("=" * 60)
        try:
            raw, elapsed = run_fn(image, device, max_new_tokens=max_tokens)
            print(f"  Temps: {elapsed:.2f} s")
            print("  Sortie brute:")
            print("  " + raw.replace("\n", "\n  "))
            items = parse_ingredients(raw)
            print("  Parsé (ingrédients + quantités):")
            for i in items:
                print(f"    - {i.name}: {i.quantity}")
        except Exception as e:
            print(f"  Erreur: {e}")
            import traceback
            traceback.print_exc()
        print()

    print("Benchmark terminé. Voir docs/BENCHMARK.md pour l’analyse et la recommandation.")


if __name__ == "__main__":
    main()
