# HealthTrack – Hub de suivi santé

**HealthTrack** est un hub pour centraliser vos données santé. Trois sources sont prévues :

1. **Alimentation** (en place) : photo d’assiette → modèle (OpenAI / Gemini ou local) → ingrédients et quantités, enregistrés dans l’app.
2. **Montre Samsung** (à venir) : activité, fréquence cardiaque, sommeil.
3. **Balance connectée** (à venir) : poids.

L’architecture (backend + frontend) est pensée pour un **tableau de bord** unique agrégant toutes ces sources. Pour l’instant, le focus est sur le **suivi alimentaire** (reconnaissance d’image + enregistrement des repas).

## Entrée / Sortie

- **Input :** image (JPG, PNG, etc.) d’une assiette / d’un repas  
- **Output :** liste d’éléments `{ ingrédient, quantité }`  
  - ex. : `riz: portion moyenne`, `poulet: environ 150 g`, `salade: petite portion`

## Installation

```bash
cd HealthTrack
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Linux / macOS
pip install -r requirements.txt
```

**Requis :** Python 3.10+, PyTorch. Pour le GPU (recommandé) : CUDA et `pip install torch` avec support CUDA.

## Tests (TDD)

Le dépôt est piloté par le **test-driven development** : toutes les fonctionnalités clés doivent être testables de bout en bout (sauf le pur visuel).

- **Backend** : `cd backend && pytest tests/ -v` — persistance (db), parsing, API (health, version, predict, meals, health/entries). Aucune clé API requise (provider mocké).
- **Frontend** : `cd app && npm run test` — navigation, pages Dashboard/Food, chargement des données (Vitest + React Testing Library).
- **Règle** : toute nouvelle feature doit être couverte par des tests ; le front doit rester testable sur les flux importants. Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Utilisation

### Ligne de commande

```bash
python run_predict.py chemin/vers/assiette.jpg
```

Options utiles :

- `--model Salesforce/blip2-opt-2.7b` — modèle utilisé (défaut : BLIP-2)
- `--device cuda` ou `--device cpu`
- `--max-tokens 200` — longueur max de la réponse
- `--json` — sortie en JSON

Exemple sortie JSON :

```bash
python run_predict.py photo.jpg --json
```

### Dans ton code Python

```python
from food_vision import predict_ingredients, IngredientItem

items: list[IngredientItem] = predict_ingredients(
    "chemin/vers/assiette.jpg",
    device="cuda",  # ou "cpu"
    max_new_tokens=200,
)
for i in items:
    print(f"{i.name}: {i.quantity}")
```

### Exemple complet

```bash
python examples/usage_example.py chemin/vers/image.jpg
```

## Modèle utilisé

- Par défaut : **BLIP-2** (`Salesforce/blip2-opt-2.7b`). Pour **meilleure qualité** (surtout format liste + quantités), le benchmark recommande **InstructBLIP** : `--model Salesforce/instructblip-flan-t5-xl` (voir [docs/BENCHMARK.md](docs/BENCHMARK.md)).
- Premier lancement : téléchargement du modèle (~5–10 Go selon le modèle).  
- **GPU recommandé** (BLIP-2 ~6–8 Go VRAM, InstructBLIP Flan-T5 XL ~10 Go).
- Lancer une comparaison sur ta propre image : `python benchmark_models.py chemin/vers/assiette.jpg`.

## Application mobile (téléphone) + API distante

Pour utiliser le modèle **sur ton téléphone** avec exécution **à distance** (OpenAI, Gemini ou serveur local) :

1. **Backend** (API) : dans `backend/`, configure un provider (OpenAI, Gemini ou local) et lance le serveur. Voir [backend/README.md](backend/README.md).
2. **Benchmark des providers** : comparaison latence / qualité pour le workflow image → ingrédients + quantités. Voir [docs/BENCHMARK_PROVIDERS.md](docs/BENCHMARK_PROVIDERS.md) et `backend/benchmark_providers.py`.
3. **App mobile** (web responsive, utilisable sur téléphone) : dans `app/`, une interface pour prendre ou choisir une photo, l’envoyer à l’API et afficher la liste d’ingrédients et quantités.

```bash
# Terminal 1 : API (depuis backend/)
cd backend
pip install -r requirements.txt
set OPENAI_API_KEY=sk-...
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 : App (proxy vers l’API en dev)
cd app
npm install
npm run dev
```

Ouvre l’URL affichée (ex. http://localhost:5173) sur ton téléphone (même réseau Wi‑Fi) ou déploie l’app et l’API en production.

### Mise à jour automatique après un push

Quand tu déploies une nouvelle version (après un `git push`), les utilisateurs connectés sont notifiés et l’app se recharge pour récupérer les changements :

- Le **backend** expose `GET /api/version` (retourne la variable d’environnement `APP_VERSION`).
- L’**app** compare cette version à la sienne (injectée à la build via `VITE_APP_VERSION`) toutes les 2 minutes et à chaque retour sur l’onglet. Si la version serveur est différente : bandeau « Une nouvelle version est disponible » puis **rechargement automatique** après 5 s (ou bouton « Recharger maintenant »).

Pour que la notification fonctionne après un déploiement, utilise **la même valeur** pour la version à la build et au déploiement du backend, par exemple le commit Git :

```bash
# Build de l’app (ex. dans ta CI)
VITE_APP_VERSION=abc123 npm run build

# Démarrage du backend (ou config de ton hébergeur)
APP_VERSION=abc123 uvicorn main:app ...
```

Avec GitHub Actions, tu peux utiliser `${{ github.sha }}` pour les deux.

## Structure du projet

```
HealthTrack/
├── app/                    # App web mobile-first (React + Vite)
├── backend/                # API FastAPI (OpenAI, Gemini, local)
│   ├── providers/
│   ├── main.py
│   └── benchmark_providers.py
├── food_vision/
│   ├── __init__.py
│   └── predictor.py
├── docs/
│   ├── BENCHMARK.md
│   └── BENCHMARK_PROVIDERS.md
├── examples/
├── run_predict.py
├── benchmark_models.py
├── requirements.txt
└── README.md
```

## Améliorations possibles

- **Fine-tuning** sur un dataset alimentaire (ex. Food-101, Recipe1M, MM-Food-100K) pour de meilleurs ingrédients et quantités.
- **Segmentation** des aliments sur l’assiette puis classification par zone pour affiner les quantités (petite / moyenne / grande portion par zone).
- **Référence d’échelle** (objet connu dans l’image, ex. fourchette) pour améliorer l’estimation des portions.
- **Modèles dédiés** (ex. [food-recognition-model](https://huggingface.co/BinhQuocNguyen/food-recognition-model)) pour combiner classification de plats + détection d’objets + estimation de calories.

## Licence

À définir selon ton projet.
