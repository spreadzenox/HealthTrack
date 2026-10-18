# 2026-10-18 02:30 Paris (00:30 UTC) — Repas : 100 lus + budget de lectures en CI (D2)

**Type** : ⚡ D2  ·  **PR** : « [Auto] Repas plus rapide + budget de lectures »

## Pourquoi
- Démarrage : main à `6b3865c` (#201) ; « Build & Release » v159 publiée avec son APK, « Tests » et émulateur A56
  verts. Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, non touchée). Aucun nouveau journal dans
  `journal/diagnostics/`.
- 02:30 Paris = run de code. Backlog D2, premier reste : « budget en CI ». Mesure d'abord (`npm run perf -- --runs=1
  --cpu=1`, 3 ans de démo, 17 164 entrées) : **`/food` lisait 1 647 enregistrements pour en afficher 100**.
- Cause : `listEntries({ type, limit })` faisait un `getAll` de tout le type, triait, puis coupait à `limit`.

## Ce qui a été fait
- `storage/localHealthStorage.js` : `newestRead` — quand un index couvre tous les filtres (type ± plage → [type, at],
  source ± plage → [source, at], aucun / plage → at) et que la limite (100 par défaut) est ≤ 1 000, curseur à rebours
  arrêté au N-ième. Au-delà de 1 000 (ou type + source, ou sous-types), lecture `getAll` inchangée (un curseur coûte
  un événement par enregistrement). Profite aussi à Accueil (repli `limit: 30` qui lisait toute la base), saisie
  bien-être (`limit: 1`, 50, 200), poids / taille (`watchAutoSync`, limite par défaut).
- `scripts/perf/perf-check.mjs` : option `--budget` (démo de `budget.json.days` jours, échec si une page dépasse) ;
  comptage des curseurs corrigé (un enregistrement par événement `success`, plus de double compte via `continue`).
- `scripts/perf/budget.mjs` + `budget.json` (max par page ≈ mesure + marge) ; job CI « Budget de lectures (perf) »
  dans `tests.yml` (Playwright 1.56.1 + Chromium, `--runs=1 --cpu=1`).
- Tests écrits avant le code (vus rouges, 3) : N plus récents par type, par type + plage, par source et sans filtre,
  avec ≤ N + 1 enregistrements lus ; type + source et limites infinies inchangés ; `checkBudget` (4 tests, dont
  « toute page mesurée par défaut a un budget »).

### Données
- Aucune : lecture seule, aucun changement de schéma.

## Mesures (`npm run perf -- --runs=1 --cpu=1`, 3 ans de démo, idbRecords)
| Page | Avant | Après | Budget |
|---|---|---|---|
| `/` | 642 | 642 | 900 |
| `/food` | 1 647 | 101 | 150 |
| `/nutrition` | 757 | 757 | 1 000 |
| `/connectors` | 290 | 290 | 400 |
| autres | 1 | 1 | 50 |

Limite connue : les lectures du Web Worker des analyses (Recommandations) ne sont pas comptées (instrumentation
injectée dans la page seulement).

## Vérifications
- `npm run test` : **1 355 tests verts** (103 fichiers). Lint : **6 erreurs** (inchangé). Build ✅.
- `npm run perf -- --budget` ✅. `npm run visual` (8 pages) ✅ ; captures regardées : `food-2` (jours et repas,
  « Voir les jours précédents »), `dashboard-1`.

## Suite
- D2 : instrumenter le Worker (lectures des analyses), `abiFilters` (I95). Puis D6 I102 (`personalDirection.js`),
  D4 I100 ① (moteur LiteRT).

## Merge
- Voir la PR ; complété après les checks.
