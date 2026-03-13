# HealthTrack API (backend)

API du hub santé : **entrées santé** unifiées (alimentation, puis montre Samsung et balance), **prédiction** ingrédients + quantités, **persistance** SQLite.

## Configuration

- **Provider** : `HEALTHTRACK_PROVIDER=openai` | `gemini` | `local` (défaut: `openai`).
- **Version (mise à jour app)** : `APP_VERSION` (ex. commit SHA ou semver). Doit être identique à `VITE_APP_VERSION` utilisé à la build de l’app pour que les utilisateurs reçoivent la notification de mise à jour.
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
- **GET /api/version** : version app (pour mise à jour auto).
- **POST /api/predict** : body multipart, champ `file` = image → ingrédients + quantités.
- **POST /api/meals** : image → prédiction + enregistrement en une requête (retourne `entry_id` + items).
- **POST /api/health/entries** : créer une entrée (type: `food`|`activity`|`weight`|`sleep`, source, payload).
- **GET /api/health/entries** : liste des entrées (query: `from_at`, `to_at`, `type`, `source`, `limit`) pour le tableau de bord.

Base de données : SQLite, fichier `healthtrack.db` dans `backend/` (ou `HEALTHTRACK_DB`).

## Benchmark des providers

```bash
cd backend
set OPENAI_API_KEY=...
set GEMINI_API_KEY=...
python benchmark_providers.py chemin/vers/assiette.jpg
python benchmark_providers.py chemin/vers/assiette.jpg --providers openai gemini --json
```

Voir [../docs/BENCHMARK_PROVIDERS.md](../docs/BENCHMARK_PROVIDERS.md).
