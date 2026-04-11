# HealthTrack – Hub de suivi santé

**HealthTrack** est un hub pour centraliser vos données santé. Trois sources sont prévues :

1. **Alimentation** (en place) : photo d’assiette → **Gemini** (clé API sur l’appareil) → ingrédients et quantités, enregistrés dans l’app.
2. **Montre Samsung** (à venir) : activité, fréquence cardiaque, sommeil.
3. **Balance connectée** (à venir) : poids.

L’application est une **app web mobile-first** (React + Vite) avec stockage **local** (IndexedDB). Pour l’instant, le focus est sur le **suivi alimentaire** (reconnaissance d’image + enregistrement des repas).

**Stockage des données** : toutes les données utilisateur (repas, et à venir montre / balance) sont stockées **uniquement sur l’appareil**. Pour survivre à une **réinstallation** de l’app, l’utilisateur peut **exporter** ses données (fichier JSON) depuis la page « Données », puis **réimporter** ce fichier après réinstallation.

## Entrée / Sortie

- **Input :** image (JPG, PNG, etc.) d’une assiette / d’un repas  
- **Output :** liste d’éléments `{ ingrédient, quantité }`  
  - ex. : `riz: 120 g`, `poulet: 150 g`, `salade: 40 g`

## Installation (modèle local optionnel)

Pour expérimenter une **vision-langage locale** (BLIP-2, etc.) en ligne de commande — **hors** de l’app mobile :

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

- **Frontend** : `cd app && npm run test` — navigation, pages Dashboard/Food, chargement des données (Vitest + React Testing Library).
- **Règle** : toute nouvelle feature doit être couverte par des tests sur les flux importants. Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Utilisation

### Ligne de commande (modèle local Hugging Face)

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

## Modèle utilisé (CLI local)

- Par défaut : **BLIP-2** (`Salesforce/blip2-opt-2.7b`). Pour **meilleure qualité** (surtout format liste + quantités), le benchmark recommande **InstructBLIP** : `--model Salesforce/instructblip-flan-t5-xl` (voir [docs/BENCHMARK.md](docs/BENCHMARK.md)).
- Premier lancement : téléchargement du modèle (~5–10 Go selon le modèle).  
- **GPU recommandé** (BLIP-2 ~6–8 Go VRAM, InstructBLIP Flan-T5 XL ~10 Go).
- Lancer une comparaison sur ta propre image : `python benchmark_models.py chemin/vers/assiette.jpg`.

## Application web / mobile

L’**app** (`app/`) analyse les photos **directement** via l’**API Gemini** avec une clé saisie dans **Paramètres** (jamais envoyée ailleurs qu’à Google). Aucun serveur HealthTrack n’est requis.

```bash
cd app
npm install
npm run dev
```

Ouvre l’URL affichée (ex. http://localhost:5173) sur ton téléphone (même réseau Wi‑Fi) ou déploie l’app statique.

### APK Android

L’app peut être packagée en **APK** (Capacitor). Voir **[app/BUILD_APK.md](app/BUILD_APK.md)** pour les étapes : build web → `npx cap sync` → ouvrir le projet Android dans Android Studio → Build APK(s).

À chaque push sur `main`, la CI crée une **GitHub Release** avec l’APK. Les utilisateurs qui ont une **version antérieure** voient une **bannière de mise à jour** dans l’app (vérification via l’API GitHub `releases/latest`). Détails dans [app/BUILD_APK.md#build-et-release-automatiques-ci](app/BUILD_APK.md#build-et-release-automatiques-ci).

### Version et mises à jour

- **Bannière de mise à jour** : l’app compare `VITE_APP_VERSION` (injectée au build) au tag de la dernière release GitHub.
- Définis `VITE_APP_VERSION` en CI ou au build (ex. numéro de run, SHA, semver) pour que la comparaison reflète bien tes releases.

## Structure du projet

```
HealthTrack/
├── app/                    # App web mobile-first (React + Vite, IndexedDB)
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
