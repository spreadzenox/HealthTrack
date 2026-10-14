# 2026-10-14 04:30 Paris (02:30 UTC) — Performance, étape 2 : calculs d'analyse dans un Web Worker + cache invalidé à l'écriture

**Type** : ⚡ D2 (performance)  ·  **PR** : voir fin

## Pourquoi
- Démarrage : main à `ce59d18` (PR #148 fusionnée), « Build & Release » → **release v121 avec `HealthTrack-v121.apk`**
  (vérifié via l'API). Aucune PR « [Auto] » rouge ou en conflit.
- ⌚ D3 : **aucun nouveau journal** de la GT 6 Pro dans `journal/diagnostics/` (dernier : v119, 13/10 20:42) → rien à
  décoder sans la vraie montre ; l'arrière-plan (d quater) reste conditionné à l'appairage réel. Chantier suivant :
  D2 (« l'app lag au chargement des courbes »).

## Mesurer d'abord (profil CPU, build non minifié, CPU ×4, 3 ans + FC horaire)
- **Accueil** : `computeTodayPrediction` (« Prédiction du jour », modèle ridge + sélection de variables) = **885 ms**
  sur le fil principal à **chaque** ouverture (tâche longue de 725 ms).
- **Analyses** (onglet simple) : `computeBasicCorrelations` 539 ms + `computeLaggedEffects` 537 ms +
  `computeTagEffects` 179 ms, dans des `useMemo` au rendu ; `buildDailyDataset` recalculé à chaque fois (397 ms cumulés).
- Reste ≈ 150 ms de tâche longue commune à toutes les pages = évaluation du bundle unique de 2,1 Mo (dont la table
  Ciqual de 1,5 Mo) → étape suivante (découpage).

## Ce qui a été fait
- **`storage/dataRevision.js`** : compteur de révision (localStorage, repli mémoire) incrémenté après **chaque**
  écriture réussie de `localHealthStorage` (`createEntry`, `upsertEntries` si insertion, `updateEntry`, `deleteEntry`,
  `importFromJson`). Seul module qui écrit dans IndexedDB (vérifié).
- **`workers/analysisTasks.js`** : tâches `todayPrediction`, `basicAnalysis` (corrélations + habitudes + effets
  décalés + jours), `advancedAnalysis` ; chacune relit la base elle-même (IndexedDB accessible depuis un Worker).
  **`workers/analysis.worker.js`** les exécute hors du fil principal (chunk séparé de Vite).
- **`services/analysisRunner.js`** : `getAnalysis(task)` / `peekAnalysis(task)` — cache mémoire + localStorage, clé
  = version de l'app + révision des données + jour local ; calculs simultanés partagés ; erreurs non mises en cache ;
  **repli** sur le fil principal si pas de Worker (tests, vieille WebView) ou si le Worker tombe en erreur.
- **Accueil** (`WellbeingCharts`) : les courbes s'affichent sans attendre la prédiction ; la prédiction en cache est
  lue dès le premier rendu. **Analyses** : chaque onglet demande son résultat au runner ; les entrées brutes ne sont
  plus chargées que pour le panneau de diagnostic (mode debug).
- `laggedEffects` renvoyait une **fonction** `format` (impossible à transférer depuis un Worker ou à mettre en cache) →
  champ texte `sdText` déjà formaté. Trouvé par le nouveau test de fidélité.
- `npm run perf` : le remplissage hors app invalide la révision ; cache vidé avant chaque passage par défaut (pire cas :
  ouverture juste après une écriture), `--keep-cache` pour l'ouverture « à chaud ».
- **Garde-fous** (Vitest, +20 tests) : `mainThreadGuard` échoue si une page / un composant importe à nouveau un calcul
  lourd (vérifié : échoue sur l'ancien code) ; `analysisCacheFidelity` : résultat identique après JSON et
  `structuredClone` (120 jours de démo, 3 tâches) ; runner (cache, révision, lendemain, Worker, repli, erreurs) ;
  révision bougée par chaque écriture et pas par une lecture ou un doublon ; Accueil et Analyses servis par le cache.

## Chiffres (CPU ×4, médiane de 3 passages, cache vidé à chaque passage ; avant = main `ce59d18`)

| Page | 3 ans (16 069) avant → après | Temps bloquant | 3 ans + FC horaire (42 354) avant → après |
|---|---|---|---|
| Accueil `/` | **1 289 → 271 ms** | 595 → 96 ms | **1 930 → 274 ms** (tbt 786 → 100) |
| Analyses | **1 503 → 295 ms** | 896 → 97 ms | **2 073 → 290 ms** (tbt 1 202 → 105) |
| Autres pages | inchangées (≈ 250–300 ms, évaluation du bundle) | | |

Temps d'apparition du résultat calculé dans le Worker (dense, à froid) : prédiction ≈ 2,0 s, Analyses ≈ 1,9 s, **sans
geler l'écran** ; à chaud (cache) : 0,6 s et 0,45 s, aucun Worker lancé.

## Vérifications
- Tests : **1145 ✅** (85 fichiers ; 1124 avant) · Build ✅ · Lint : **6 erreurs** (baseline inchangée)
- `npm run visual` : toutes les pages OK, aucune erreur JS ; **les 20 captures identiques au pixel près** à celles de
  main (comparaison md5) ; Accueil (prédiction 1,4/5 affichée) et Analyses relues ; `--empty` relu (Analyses « données
  insuffisantes »).

## Apprentissages / décisions
- Le cache est rangé dans localStorage (petits objets) plutôt qu'un magasin IndexedDB : **aucune migration** de schéma.
- Toute écriture future dans IndexedDB doit passer par `localHealthStorage` (sinon le cache ne serait pas invalidé) ;
  noté dans le commentaire de `dataRevision.js`.
- Le Worker embarque sa propre copie de la table Ciqual (1,3 Mo) : coût de parsing hors fil principal, accepté.

## Suite proposée
1. ⌚ Lire le journal v120+ du propriétaire dès qu'il arrive.
2. ⚡ D2 suite : découpage du bundle (pages en `React.lazy`, table Ciqual chargée à la demande) — il reste ≈ 150 ms de
   tâche longue sur chaque page ; page Nutrition (28 lectures, 15 k entrées) par le runner ; `upsertEntries` relit tout
   le magasin à chaque synchro (index `source_at` suffirait).
