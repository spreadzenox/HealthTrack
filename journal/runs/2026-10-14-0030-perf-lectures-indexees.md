# 2026-10-14 00:30 Paris (22:30 UTC) — Montre : test v119 consigné · Performance : mesure + lectures par index

**Type** : ⌚ (vérification) + ⚡ D2 (performance, étape 1 « mesurer d'abord » et 1re optimisation)  ·  **PR** : voir fin

## Pourquoi
- Démarrage : main à `6783158`. **PR #146 fusionnée** (`89d1caa`), « Build & Release » vert → **release v120 publiée
  avec `HealthTrack-v120.apk`** (vérifié via l'API). Aucune PR « [Auto] » rouge ou en conflit.
- Note de l'orchestrateur : le propriétaire a retesté avec la **v119** à 20:42 UTC → échec identique (PIN 64 o reçu,
  « bind » ❌, réponse 0x28 de 805 octets `json_unparsable`). Test **antérieur** au correctif (v120) : résultat attendu.
  Consigné dans `diagnostics/2026-10-13-2042-gt6pro-v119.md`.
- D3 est **en attente d'un journal v120** : rien de plus à décoder sans la vraie montre ; (d quater) arrière-plan est
  explicitement à ne traiter qu'après l'appairage réel. Chantier suivant dans l'ordre des directives : **D2 performance**
  (« l'app lag au chargement des courbes »), en commençant par mesurer.

## Ce qui a été fait
- **`npm run perf`** (`app/scripts/perf/perf-check.mjs`) : build de production servi par `vite preview`, 3 ans de démo
  (16 069 entrées ; `--dense` ajoute une FC horaire ≈ montre synchronisée → 42 350), CPU ralenti ×4 (CDP), viewport
  A56, médiane de N passages. Par page : `settledMs` (fin de la dernière tâche longue suivie de 1 s de calme), `tbtMs`
  (temps bloquant total), tâche la plus longue, nombre de lectures IndexedDB et d'enregistrements lus (instrumentation
  de `getAll` / `get` / `count` / curseurs). Rapport `.perf/report.json` (ignoré par git).
- **Cause n°1 mesurée** : `listEntries` faisait `getAll()` sur **toute** la base puis filtrait en JS ; l'Accueil
  l'appelle 6 à 8 fois (Radar, cœur, régularité, courbes…) → **128 552 enregistrements lus** pour 16 069 entrées.
- **Schéma IndexedDB v3** : ajout de l'index composé **`type_at`** `[type, at]` (migration = ajout d'index seul,
  données intactes, testée depuis une base v2).
- **`listEntries`** lit la plus petite plage : `[type, at]`, `[source, at]`, `at`, `type` ou `source` selon les
  filtres ; les filtres JS restent appliqués (résultat strictement identique, prouvé par 9 cas d'équivalence).
- **`getLatestEntryAt`** : curseur `prev` sur `source_at` → **1** enregistrement lu au lieu de toute la base.
- **`listEntriesForAnalysis`** : types listés par les clés uniques de l'index `type` (sans lire les entrées), puis par
  type (en parallèle) : lecture directe si sous le plafond, sinon date de la N-ième plus récente par curseur de clés
  (`advance`) puis lecture de la plage. Mêmes plafonds, même résultat.
- **Garde-fou anti-régression** (Vitest) : un test échoue si `listEntries` filtré, `getLatestEntryAt` ou
  `listEntriesForAnalysis` appellent `getAll()` sur tout le magasin.

## Chiffres (CPU ×4, médiane de 3 passages ; avant = main `6783158`)

3 ans de démo (16 069 entrées) :

| Page | Stabilisée avant → après | Temps bloquant | Enregistrements lus |
|---|---|---|---|
| Accueil `/` | **3 046 → 1 289 ms** | 1 839 → 595 ms | **128 552 → 16 884** |
| Analyses | 1 571 → 1 503 ms | 1 156 → 896 ms | 16 069 → 14 847 |
| Repas | 582 → 266 ms | 190 → 98 ms | 16 069 → 1 646 |
| Connecteurs | 626 → 232 ms | 231 → 70 ms | 16 069 → 289 |
| Nutrition | 518 → 533 ms | 185 → 65 ms | 16 069 → 14 847 |

Avec FC horaire (42 350 entrées) : Accueil **5 616 → 1 655 ms** (temps bloquant 4 008 → 604 ms, lus 338 800 →
20 663) ; Analyses 2 378 → 1 784 ms (1 429 → 986 ms, 42 350 → 15 097).

## Vérifications
- Tests : **1124 ✅** (1111 avant ; +13) · Build ✅ · Lint : **6 erreurs** (baseline inchangée)
- `npm run visual` : toutes les pages OK, aucune erreur JS ; **les 20 captures sont identiques au pixel près** à celles
  de main (comparaison automatique avant / après) ; Accueil relu.

## Apprentissages / décisions
- Le reste du temps de l'Accueil et des Analyses est du **calcul** (tâche la plus longue ≈ 0,6–0,9 s :
  `computeAdvancedAnalysis`, `buildDailyDataset`), plus de la lecture → prochaines étapes : cache d'agrégats
  journaliers, Web Worker, graphiques différés.
- ⚠️ Base v3 : une **ancienne** version de l'app (≤ v120) ne peut plus ouvrir la base une fois la v121 installée
  (IndexedDB refuse de descendre de version). Sans conséquence en usage normal (mises à jour seulement) ; ne pas
  réinstaller un vieil APK par-dessus sans export préalable.

## Suite proposée
1. ⌚ Lire le journal v120 du propriétaire dès qu'il arrive (`bind`, `tokenCheck`, puis `auth` / `check` / `sync`).
2. ⚡ D2 suite : cache d'agrégats journaliers (invalidé par `health-entries-updated`), calcul des Analyses dans un
   Worker, graphiques chargés en différé + découpage du bundle ; budget `npm run perf` en CI si le temps le permet.
