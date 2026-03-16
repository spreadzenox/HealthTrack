# Enrichissement de la base d'ingrédients

La base `ingredients_nutrition.json` est utilisée pour le calcul des apports nutritionnels et (via une liste dérivée) pour contraindre les noms d'ingrédients dans l’app (prompt Gemini).

## Sources ouvertes recommandées

### Ciqual (ANSES, France)

- **Table officielle** de composition nutritionnelle des aliments (~3 500 aliments).
- Téléchargement : [recherche.data.gouv.fr – Ciqual](https://entrepot.recherche.data.gouv.fr/dataset.xhtml?persistentId=doi:10.57745/RDMHWY)  
  ou [data.gouv.fr – Ciqual 2020](https://www.data.gouv.fr/fr/datasets/5369a15fa3a729239d2065b7/).
- Choisir le fichier **CSV** ou exporter en CSV (UTF-8) depuis Excel si besoin.
- Colonnes attendues (noms variables selon l’export) : nom de l’aliment, Energie (kcal), Protéines (g), Glucides (g), Lipides (g), Fibres alimentaires (g).

### USDA FoodData Central (USA)

- Données publiques (domaine public).  
- [Téléchargements](https://fdc.nal.usda.gov/download-datasets.html) : JSON ou CSV (Foundation Foods, SR Legacy, etc.).
- Adapter les champs au format HealthTrack (`id`, `name`, `per_100g`: `energy_kcal`, `protein_g`, `carbohydrates_g`, `fat_g`, `fiber_g`) puis utiliser la commande `merge` (voir ci‑dessous).

### Open Food Facts

- API : `https://world.openfoodfacts.net/api/v2/...` (sans clé pour la lecture).
- Utile pour des aliments transformés / marques ; pour une base d’ingrédients “génériques”, Ciqual ou USDA sont plus adaptés.

## Commandes d’enrichissement

Depuis la racine du **backend** :

```bash
cd backend

# Import Ciqual : fusionne le CSV avec la base existante
python -m scripts.enrich_ingredients ciqual chemin/vers/Table_Ciqual.csv

# Option : régénérer la liste des noms pour l’app (prompt Gemini), par ex. 500 premiers
python -m scripts.enrich_ingredients ciqual chemin/vers/Table_Ciqual.csv --export-names 500

# Fusionner un JSON déjà au format HealthTrack (ex. export USDA converti)
python -m scripts.enrich_ingredients merge chemin/vers/ingredients_export.json
```

Après un import Ciqual, **synchroniser la liste côté app** si besoin :

- Soit avec `--export-names N` pour regénérer `app/src/data/ingredientNames.js`,
- Soit en important la liste des noms depuis `ingredients_nutrition.json` (les noms sont dans l’ordre du fichier).

## Format d’un ingrédient (JSON)

```json
{
  "id": "riz_blanc_cuit",
  "name": "Riz blanc cuit",
  "per_100g": {
    "energy_kcal": 130,
    "protein_g": 2.7,
    "carbohydrates_g": 28.2,
    "fat_g": 0.3,
    "fiber_g": 0.4
  }
}
```

Les doublons sont évités par **nom normalisé** (minuscules, espaces unifiés) : un nouvel aliment avec le même nom qu’un existant ne crée pas une seconde entrée.
