# HealthTrack – Hub de suivi santé

**HealthTrack** est un hub pour centraliser vos données santé. Fonctionnalités disponibles :

1. **Alimentation** : photo d'assiette → **Gemini** (clé API sur l'appareil) → ingrédients et quantités, enregistrés dans l'app.
2. **Bien-être** : saisie manuelle d'un score quotidien de bien-être (1–5).
3. **Health Connect** : pas, sommeil, fréquence cardiaque, calories et activité synchronisés depuis une montre ou l'application Health Connect Android (Samsung Fit 3, etc.).
4. **Recommandations** : analyse locale (corrélations de Pearson, régression OLS) des facteurs qui influencent votre bien-être.

L'application est une **app mobile-first** (React + Vite + Capacitor) avec stockage **local** (IndexedDB). Aucun serveur HealthTrack n'est requis.

**Stockage des données** : toutes les données utilisateur sont stockées **uniquement sur l'appareil**. Pour survivre à une **réinstallation** de l'app, l'utilisateur peut **exporter** ses données (fichier JSON) depuis la page « Données », puis **réimporter** ce fichier après réinstallation.

## Application web / mobile

L'**app** (`app/`) analyse les photos **directement** via l'**API Gemini** avec une clé saisie dans **Paramètres** (jamais envoyée ailleurs qu'à Google). Aucun serveur HealthTrack n'est requis.

```bash
cd app
npm install
npm run dev
```

Ouvre l'URL affichée (ex. http://localhost:5173) sur ton téléphone (même réseau Wi‑Fi) ou déploie l'app statique.

### APK Android

L'app peut être packagée en **APK** (Capacitor). Voir **[app/BUILD_APK.md](app/BUILD_APK.md)** pour les étapes : build web → `npx cap sync` → ouvrir le projet Android dans Android Studio → Build APK(s).

À chaque push sur `main`, la CI crée une **GitHub Release** avec l'APK. Les utilisateurs qui ont une **version antérieure** voient une **bannière de mise à jour** dans l'app (vérification via l'API GitHub `releases/latest`). Détails dans [app/BUILD_APK.md#build-et-release-automatiques-ci](app/BUILD_APK.md#build-et-release-automatiques-ci).

### Version et mises à jour

- **Bannière de mise à jour** : l'app compare `VITE_APP_VERSION` (injectée au build) au tag de la dernière release GitHub.
- Définis `VITE_APP_VERSION` en CI ou au build (ex. numéro de run, SHA, semver) pour que la comparaison reflète bien tes releases.

## Tests (TDD)

Le dépôt est piloté par le **test-driven development** : toutes les fonctionnalités clés doivent être testables de bout en bout (sauf le pur visuel).

- **Frontend** : `cd app && npm run test` — navigation, pages Dashboard/Food, chargement des données (Vitest + React Testing Library).
- **Règle** : toute nouvelle feature doit être couverte par des tests sur les flux importants. Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Outil CLI local (expérimental)

Pour expérimenter une **vision-langage locale** (BLIP-2, InstructBLIP, etc.) en ligne de commande — **hors** de l'app mobile :

```bash
cd HealthTrack
python -m venv .venv
source .venv/bin/activate   # Linux / macOS
# .venv\Scripts\activate    # Windows
pip install -r requirements.txt
```

**Requis :** Python 3.10+, PyTorch. Pour le GPU (recommandé) : CUDA et `pip install torch` avec support CUDA.

### Utilisation

```bash
python run_predict.py chemin/vers/assiette.jpg
```

Options utiles :

- `--model Salesforce/blip2-opt-2.7b` — modèle utilisé (défaut : BLIP-2)
- `--device cuda` ou `--device cpu`
- `--max-tokens 200` — longueur max de la réponse
- `--json` — sortie en JSON

Le benchmark recommande **InstructBLIP** pour de meilleure qualité (format liste + quantités) : `--model Salesforce/instructblip-flan-t5-xl` (voir [docs/BENCHMARK.md](docs/BENCHMARK.md)).

Premier lancement : téléchargement du modèle (~5–10 Go selon le modèle). **GPU recommandé** (BLIP-2 ~6–8 Go VRAM, InstructBLIP Flan-T5 XL ~10 Go).

Lancer une comparaison sur ta propre image : `python benchmark_models.py chemin/vers/assiette.jpg`.

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

## Structure du projet

```
HealthTrack/
├── app/                    # App mobile-first (React + Vite + Capacitor, IndexedDB)
│   ├── src/
│   │   ├── pages/          # Dashboard, Food, Data, Connectors, Settings, Recommendations
│   │   ├── components/     # WellbeingCharts, WellbeingPrompt, UpdateBanner
│   │   ├── services/       # geminiStandalone, nutritionKPIs, analysisEngine, …
│   │   ├── connectors/     # HealthConnectConnector, connectorRegistry
│   │   ├── storage/        # localHealthStorage (IndexedDB)
│   │   └── settings/       # geminiApiKey, connectorSettings
│   ├── android/            # Projet Capacitor Android
│   ├── BUILD_APK.md
│   └── README.md
├── food_vision/            # Module Python CLI (BLIP-2 / InstructBLIP local)
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

## Licence

À définir selon ton projet.
