# 2026-10-14 06:30 Paris (04:30 UTC) — Performance, étape 3 : découpage du fichier principal

**Type** : ⚡ D2 (performance)  ·  **PR** : voir « Après le merge »

## Pourquoi
- Démarrage : main à `d91e7fa` (journal de la PR #149, release v122 vérifiée au run précédent), workflows de main
  verts. Aucune PR « [Auto] » ouverte, aucune issue.
- ⌚ D3 : **toujours aucun nouveau journal** de la GT 6 Pro dans `journal/diagnostics/` (dernier : v119, 13/10 20:42)
  → rien à décoder ; l'arrière-plan (d quater) reste conditionné à l'appairage réel. Chantier suivant : D2.
- Mesure du run 04:30 : ≈ 100–150 ms de tâche longue sur **chaque** page = évaluation du fichier unique de 2,1 Mo.
  Carte de sources : ≈ 1,27 Mo pour la table Ciqual (`ingredientsNutrition.json`, littéral objet), 152 ko pour
  `ingredientNames.js` (exactement les clés de la table, même ordre — vérifié), 176 ko React DOM.

## Ce qui a été fait
- **`data/nutritionTable.js`** : `loadNutritionTable()` (un seul `import()` partagé, nouvel essai si échec),
  `getNutritionTable()` (synchrone, null avant chargement), `useNutritionTable()` (`useSyncExternalStore`, démarre le
  chargement). `ingredientNames.js` **supprimé** : `ingredientNames()` = clés de la table.
- `mealEditing` : index de noms construits à la première utilisation ; kcal = null / 0 tant que la table n'est pas là
  (rendu de l'Accueil) ; rapprochement / recherche et `computeTotalsFromItems` **lèvent une erreur** sans table (plutôt
  que des totaux à zéro qui finiraient dans le cache des analyses).
- Qui attend la table : tâches d'analyse (Worker et repli), Gemini (photo, texte), pages Repas / Nutrition / Analyses
  (le `lazy()` de la route attend page + table), éditeurs de repas de l'Accueil (`NutritionTableGate`). L'Accueil
  affiche ses kcal dès que la table arrive (journal recalculé).
- **`App.jsx`** : toutes les pages sauf l'Accueil en `React.lazy`, `Suspense` dans `Layout` (le menu reste affiché).
- **CSS** : la première version a changé l'Accueil (titre plus grand…) : des styles partagés (`.page-title`, champs)
  vivent dans le CSS d'autres pages. `pageStyles.js` importe d'emblée tout le CSS des pages différées **dans l'ordre
  d'origine** (ordre recalculé par parcours des imports, identique à main). Le CSS (53 ko) n'est pas différé.
- `vite.config.js` : `json.stringify` (JSON émis en `JSON.parse`, plus rapide à évaluer), Worker en module ES (il
  charge la table à la demande ; il était déjà créé avec `type: 'module'`).
- **Garde-fous** (`workers/bundleGuard.test.js`) : la table n'est importée statiquement nulle part ; `App.jsx` ne
  charge statiquement que l'Accueil ; tout fichier CSS de `src/` est atteint d'emblée (vérifié : le test échoue sans
  `pageStyles.js`). `nutritionTable.test.jsx` : avant / après chargement, chargement unique, ordre des noms, hook,
  éditeur de repas qui attend la table. `test/setup.js` précharge la table pour les tests existants.

## Chiffres (`npm run perf`, CPU ×4, 3 ans = 16 069 entrées, médiane de 3 ; avant = main `d91e7fa`)

| Page | settled avant → après | Temps bloquant avant → après | Plus longue tâche |
|---|---|---|---|
| Accueil `/` | 315 → 314 ms | **123 → 13 ms** | 156 → 63 ms |
| Repas | 292 → 98 ms | **107 → 0** | 157 → 0 |
| Nutrition | 748 → 1 008 ms (5 passages : 779 → 842) | **123 → 17 ms** | 171 → 59 ms |
| Données / Connecteurs / Analyses / Paramètres / Plus | 288–348 → 95–115 ms | **97–147 → 0** | ≈ 150 → 0 |

Fichier principal : **2 125 → 514 ko** (gzip 374 → ≈ 150 ko). Nutrition reste dominée par ses 28 lectures (étape
suivante). La table (1,48 Mo) existe en deux exemplaires dans l'APK (app + Worker), comme avant (le Worker avait déjà
la sienne).

## Vérifications
- Tests : **1152 ✅** (88 fichiers ; 1145 avant) · Build ✅ · Lint : **6 erreurs** (baseline inchangée)
- `npm run visual` : toutes les pages OK, aucune erreur JS ; **20 captures identiques au pixel près à main** (la
  seule différence, Paramètres, était le curseur clignotant : 2 passages de la même version diffèrent, le 3e est
  identique à main). `--empty` et `--light` OK ; `--food-analysis` et `--meal-text` relus : ingrédients rapprochés de
  la base et kcal affichées.

## Apprentissages / décisions
- Ne jamais différer le CSS d'une page sans vérifier la cascade : des classes partagées sont définies dans le CSS
  d'autres pages (dette notée : les déplacer dans `index.css` / `Food.css` un jour, test à l'appui).
- Mieux vaut une erreur franche qu'un calcul nutritionnel silencieusement faux mis en cache.

## Suite proposée
1. ⌚ Lire le journal v120+ du propriétaire dès qu'il arrive.
2. ⚡ D2 suite : Nutrition par le runner (28 lectures), `upsertEntries` par index, `WellbeingCharts` par agrégats,
   budget CI sur les enregistrements lus.
