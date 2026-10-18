# 2026-10-18 10:30 Paris (08:30 UTC) — Pistes « Chez vous » / « À vérifier » (I108, D6)

**Type** : 🧭 D6 / D5 (comparaisons multiples)  ·  **PR** : #206

## Pourquoi
- Démarrage : main à `0f40321` (#205) ; « Tests », « Build & Release » (v162) et émulateur A56 verts. Aucune PR
  « [Auto] » ouverte (seule #51, `cursor/*`, non touchée). Aucun nouveau journal dans `journal/diagnostics/`.
- 10:30 Paris = run de code. D1 bouclé le 17/10 22:30 ; suite proposée par le run idées de 08:30 : **I108** (petit,
  un run), qui réduit tout de suite les fausses pistes avant I102 + I107.

## Ce qui a été fait
- `analysisEngine.js` : `selectLevers(correlations)` (exportée) + `LEVER_PERSONAL_Q = 0,05`. Jusqu'à 3 pistes
  `stage: 'personal'` (q < 0,05), puis **au plus une** `stage: 'toVerify'` (0,05 ≤ q < 0,2) s'il reste de la place ;
  les pistes nettes passent devant même si la fragile a un |r| plus grand. Avant : les 3 premières à q < 0,2.
- `Recommendations.jsx` : badge de la carte = « Chez vous : lien net » / « À vérifier : peut-être le hasard » (au
  lieu de « Hypothèse solide / à confirmer ») ; carte « à vérifier » en pointillés orange, « ? » au lieu du rang,
  « Lien possible » au lieu de « Lien modéré ». « Comment c'est calculé » : une phrase sur les deux étages.
- L'analyse avancée (`topRecommendations`) reprend les mêmes pistes : au plus une fragile, comme la simple.
- Entrée « Nouveautés » `2026-10-18-1030-pistes-deux-etages.json`.

## Retiré / simplifié (D1)
- Badge « Hypothèse … » des pistes remplacé (pas ajouté) par l'étage : une seule étiquette par carte.

## Vérifications
- `npm run test` : **1 372 tests verts** (104 fichiers ; +6 : 5 sur `selectLevers`, 1 sur la page). Lint : 6
  erreurs (inchangé). Build ✅.
- `npm run visual` (8 pages) ✅ ; `--routes=/recommendations --light` ✅. Capture `recommendations-1` regardée : la
  démo donne « Dormir un peu plus longtemps » (Chez vous, r = +0,63) puis « Marcher davantage » (À vérifier, r =
  +0,30) — l'ancien affichage en montrait 3 au même niveau.

## Suite
1. 🧭 D6 : I102 écrit avec l'a priori spike-and-slab d'I107 (reprendra la décision « Chez vous »), puis I103 / I104.
2. ⚡ D2 : séries quotidiennes du Worker (≈ 8 k lectures), `abiFilters` (I95).
3. 🙂 D4 : I100 ① (moteur LiteRT du visage) avec I106 ; I110.
