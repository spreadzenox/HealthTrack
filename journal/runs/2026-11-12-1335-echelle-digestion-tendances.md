# Run 12/11 13:35 — Tendances : l'échelle de la digestion (POLISH-SIM-54)

**Type** : code (mode polish).

## Contexte
- Main 7f23a50 (#936) vert (Build & Release, Tests, émulateur A56, Play — AAB) ; aucune PR « [Auto] » ouverte (seule la #51, hors routine).
- POLISH-SIM-54 (Ventre et données J45) : « je note Calme / Gêne / Douleur, mais la courbe parle de confort digestif
  sur 5 ». Analyses fait au run de 11:35 ; restait Tendances.

## Fait
- `trendsData.js` : la mesure « Confort digestif » a une ligne d'explication (`gloss`, même mécanisme que VFC et FC au
  repos, POLISH-SIM-6) : « Confort digestif : Calme 5, Gêne 3, Douleur 1 » sous la courbe (mêmes notes que
  `GUT_COMFORT`).
- `detailSource` : le détail d'un jour ne dit plus « , 5 = calme » (une information, une maison).
- Tests : `Trends.test.jsx` (ligne sous la courbe), `trendsData.test.js` (détail sans l'échelle).
- Nouveautés : `2026-11-12-1335-echelle-digestion-tendances.json`.

## Vérifs
- `npm run test` (3472 verts), `npm run lint` (0 erreur), `npm run build`, `npm run visual` (complet, sans erreur).
- `npm run visual -- --routes=/tendances?mesure=digestion` en clair (Mois) et sombre (Semaine) :
  [sombre](captures/2026-11-12-1335-echelle-digestion-sombre.png).

## Suite
- POLISH-SIM-55 à 58, 61 à 64.
