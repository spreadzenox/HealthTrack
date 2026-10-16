# 2026-10-17 00:30 Paris (22:30 UTC) — Accueil : le cœur lu par sous-type (D2)

**Type** : ⚡ D2  ·  **PR** : « [Auto] Accueil plus rapide : FC repos et VFC lues par sous-type »

## Pourquoi
- Démarrage : main à `023d2c9` (#189, release v148) ; « Tests », « Build & Release » et émulateur A56 verts.
  Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, hors routine, non touchée). Aucun nouveau journal dans
  `journal/diagnostics/`. 00:30 Paris = run normal.
- D1 : le reste (« Voyage » déduit) ne retirerait rien de la saisie (le tag déclaré reste nécessaire pour un voyage
  sans changement de fuseau) → gain faible. Suite D2 notée au backlog depuis le 16/10 00:30 : « lecture `heart_rate`
  par sous-type pour l'Accueil ». Mesure d'abord (`npm run perf -- --routes=/ --dense --spo2=slot --runs=3`, 3 ans,
  CPU ×4) : **Accueil 706 ms, TBT 124 ms, 16 210 enregistrements lus**. `HealthRadar` et `BaselineCards` lisaient
  chacun **toute** la FC des 65 derniers jours (tranches de 10 min de FC et de SpO₂ comprises) pour n'en garder que
  FC repos et VFC (≈ 1 valeur / jour).

## Ce qui a été fait
- `storage/localHealthStorage.js` : **schéma v4**, index `type_subtype_at` = `['type', 'payload.subtype', 'at']`
  (ajout d'index seul ; une entrée sans `payload.subtype` n'y figure simplement pas). `listEntries({ type, subtypes,
  since, until })` : une lecture par sous-type dans la même transaction, filtres toujours réappliqués, tri inchangé.
  Sans `subtypes` : comportement identique.
- `HealthRadar.jsx`, `BaselineCards.jsx` : `subtypes: Object.keys(BASELINE_METRICS)` (FC repos, VFC — les seules lues
  par `computeRadar` / `computeHeartBaselines`).
- Tests écrits avant le code : bloc « lecture par sous-type (D2 performance) » (sous-types et plage respectés, tri,
  **20 enregistrements lus** pour 10 jours là où la FC en compte 2 900, comportement sans sous-type inchangé,
  **migration v3 → v4** données intactes) ; tests des deux cartes : seuls FC repos et VFC demandés (mocks filtrant par
  sous-type).

### Chiffres (même commande, médiane de 3)
| | Avant | Après |
|---|---|---|
| Accueil — temps stabilisé | 706 ms | **403 ms** |
| Accueil — temps bloquant | 124 ms | **58 ms** |
| Accueil — enregistrements lus | 16 210 | **3 988** |
Avec la vraie montre (FC en tranches de 10 min, 6× plus dense que la démo horaire), l'écart attendu est plus grand
(≈ 2 × 9 400 tranches de FC + SpO₂ évitées sur 65 jours).

### Retiré et pourquoi
| Retiré | Pourquoi |
|---|---|
| Relecture de toutes les tranches FC / SpO₂ par le Radar et les cartes cœur | n'utilisent que FC repos et VFC (D2) |

## Vérifications
- `npm run test` : **1312 tests verts** (101 fichiers). Lint : **6 erreurs** (inchangé). Build ✅.
- `npm run visual --routes=/` ✅ (et `--empty`) ; captures `dashboard-1/2` regardées : Radar « Rien d'inhabituel »,
  FC repos 60,5 bpm, VFC 48 ms, identiques à avant.

## Suite
- D2 : « Vos derniers jours » (`loadJournalEntries`) lit encore tout depuis 7 jours, FC / SpO₂ comprises (sans doute l'essentiel des 3 988 restants, à mesurer)
  → agrégat journalier ou lecture par type ; `WellbeingCharts` par agrégats ; budget « enregistrements lus » en CI.
- D5 : repas d'après la note, prédiction du jour cohérente, taille minimale visible (I46). D6 : Radar (I97).
