# HealthTrack API (backend)

API remote pour **image → ingrédients + quantités**. Utilisable par l’app mobile / web.

## Configuration

- **Provider** : `HEALTHTRACK_PROVIDER=openai` | `gemini` | `local` (défaut: `openai`).
- **Clés API** (selon le provider) :
  - OpenAI : `OPENAI_API_KEY=sk-...`
  - Gemini : `GEMINI_API_KEY=...` ou `GOOGLE_API_KEY=...`
  - Local : pas de clé (nécessite `torch` + `transformers` + modèle local).

## Lancer le serveur

```bash
cd backend
pip install -r requirements.txt
# Définir OPENAI_API_KEY ou GEMINI_API_KEY si besoin
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- **GET /health** : état et provider utilisé.
- **POST /api/predict** : body multipart, champ `file` = image. Optionnel : `?provider=openai|gemini|local`.

## Benchmark des providers

```bash
cd backend
set OPENAI_API_KEY=...
set GEMINI_API_KEY=...
python benchmark_providers.py chemin/vers/assiette.jpg
python benchmark_providers.py chemin/vers/assiette.jpg --providers openai gemini --json
```

Voir [../docs/BENCHMARK_PROVIDERS.md](../docs/BENCHMARK_PROVIDERS.md).
