# Run 12/11 11:35 — Analyses : le sens du « + » (POLISH-SIM-53, 54 en partie)

**Type** : code (mode polish).

## Contexte
- Main 3bf17de (#934) vert (Build & Release, Tests, émulateur A56, Play — AAB) ; aucune PR « [Auto] » ouverte (seule la #51, hors routine).
- Suite du run de 10:35 : POLISH-SIM-53 (persona Ventre et données J45 : « +0,2 pt » sans dire si + veut dire mieux).

## Fait
- `Recommendations.jsx`, ligne de l'unité (dite une fois) : « pt : points de votre note de bien-être, sur 5. + : meilleur
  bien-être. » ; en digestion « … de confort digestif, sur 5 (Calme 5, Gêne 3, Douleur 1). + : plus de confort. »
  (barème de `GUT_COMFORT` dans `analysisResults.js`). Couvre POLISH-SIM-54 pour Analyses ; reste Tendances.
- Tests : ligne bien-être mise à jour, nouveau test en digestion (`Recommendations.test.jsx`).
- Nouveautés : `2026-11-12-1135-analyses-sens-plus.json` (correctif).

## Vérifs
- `npm run test` (3468 verts), `npm run lint` (0 erreur), `npm run build`, `npm run visual` (complet, sans erreur).
- `--play --subscription=launch --routes=/recommendations/ventre --gut-links` :
  [digestion, clair](captures/2026-11-12-1135-sens-plus-digestion-clair.png) ; `--dark --routes=/recommendations` :
  [bien-être, sombre](captures/2026-11-12-1135-sens-plus-bien-etre-sombre.png). Ligne lisible, sur deux lignes en digestion.

## Suite
- POLISH-SIM-54 côté Tendances (correspondance Calme / Gêne / Douleur ↔ note sur 5), puis 55 à 59, 61 à 64.
