"""
Benchmark: compare providers (OpenAI, Gemini, local) for image → ingredients + quantities.
Measures latency and optionally cost; outputs raw responses for quality comparison.

Usage:
  cd backend
  set OPENAI_API_KEY=... & set GEMINI_API_KEY=...
  python benchmark_providers.py path/to/plate.jpg
  python benchmark_providers.py path/to/plate.jpg --providers openai gemini
"""
import argparse
import os
import sys
import time
from pathlib import Path

# Run from backend/
sys.path.insert(0, str(Path(__file__).resolve().parent))

from providers import get_provider, IngredientResult


PROMPT_REF = (
    "List all food ingredients visible on this plate/meal. "
    "For each ingredient, give an estimated quantity. Format: - ingredient: quantity"
)


def run_provider(provider_name: str, image_bytes: bytes, mime: str = "image/jpeg"):
    p = get_provider(provider_name)
    start = time.perf_counter()
    try:
        results = p.predict(image_bytes, mime_type=mime)
        elapsed = time.perf_counter() - start
        return results, elapsed, None
    except Exception as e:
        elapsed = time.perf_counter() - start
        return [], elapsed, str(e)


def main():
    parser = argparse.ArgumentParser(description="Benchmark ingredient API providers")
    parser.add_argument("image", type=Path, help="Path to plate/meal image")
    parser.add_argument(
        "--providers",
        nargs="+",
        default=["openai", "gemini"],
        help="Providers to run (openai, gemini, local). Default: openai gemini",
    )
    parser.add_argument("--json", action="store_true", help="Print machine-readable summary")
    args = parser.parse_args()

    if not args.image.exists():
        print(f"Error: file not found: {args.image}", file=sys.stderr)
        sys.exit(1)

    image_bytes = args.image.read_bytes()
    if args.image.suffix.lower() in (".png",):
        mime = "image/png"
    else:
        mime = "image/jpeg"

    results_by_provider = {}
    for name in args.providers:
        items, elapsed, err = run_provider(name, image_bytes, mime)
        results_by_provider[name] = {
            "items": items,
            "time_seconds": round(elapsed, 2),
            "error": err,
        }

    # Report
    if args.json:
        import json
        out = {
            name: {
                "time_seconds": data["time_seconds"],
                "error": data["error"],
                "count": len(data["items"]),
                "items": [{"ingredient": r.ingredient, "quantity": r.quantity} for r in data["items"]],
            }
            for name, data in results_by_provider.items()
        }
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return

    print("Provider benchmark")
    print("Image:", args.image)
    print("Prompt (reference):", PROMPT_REF[:80], "...")
    print()
    for name, data in results_by_provider.items():
        print("=" * 60)
        print(f"  {name.upper()}")
        print("=" * 60)
        print(f"  Time: {data['time_seconds']} s")
        if data["error"]:
            print(f"  Error: {data['error']}")
        else:
            for r in data["items"]:
                print(f"    - {r.ingredient}: {r.quantity}")
        print()

    print("Done. See docs/BENCHMARK_PROVIDERS.md for analysis and pricing.")


if __name__ == "__main__":
    main()
