# Run 08/11 21:35 — Analyses : une seule unité par facteur

**Type** : code (polish) — POLISH-SIM-16, constat de la persona Sportif J45 (08/11 20:35).

## Contexte
- Aucune PR « [Auto] » ouverte ; main = #845, Build & Release vert. Gel Alpha jusqu'au 09/11 22:00 (100918 en examen) :
  aucun envoi lancé, `review-freeze.json` non touché. Pas de nouvelle correction du propriétaire dans le prompt.

## Fait
- `analysisResults.js` :
  - `sameUnitPerFactor` : toutes les lignes d'un facteur prennent la variation du court terme (variation d'un jour à
    l'autre, celle des essais d'Agir), sinon la plus grande ; effet et fourchette mis à l'échelle, p et netteté inchangées.
    Avant : 2 000 / 1 000 / 500 pas selon l'horizon (l'écart-type d'une moyenne sur 21 jours est plus petit).
  - `boundToScale` (`SCALE_SPAN = 4`) : un effet plus grand que l'écart maximal d'une note de 1 à 5 devient
    `outOfScale`, jamais net, trié en fin d'horizon, exclu des contributions du jour (« Ce qui a pu peser »).
- `resultsView.js` : « À regarder, pas à changer » ne retient jamais un effet hors échelle devant un effet mesurable.
- `Recommendations.jsx` : ligne hors échelle = libellé + « pas assez de données », sans barre ni chiffre ; l'échelle des
  autres barres ne s'étire plus pour elle.
- Nouveautés : `2026-11-08-2135-analyses-meme-unite.json`.

## Vérifs
- `npm run test` : 3 301 verts (5 nouveaux tests : unité commune sur un monde simulé, mise à l'échelle, borne, contributions, page).
- `npm run build` ok ; `npm run lint` 0 erreur (inchangé).
- `npm run visual -- --routes=/recommendations` : « 1 500 pas de plus » en moyen et long terme
  (`runs/captures/2026-11-08-2135-analyses-meme-unite.png`). La démo n'a pas d'effet hors échelle : rendu couvert par le test de page.

## Reste
- POLISH-SIM-14 (étiquette « jour 5 » sous la bulle « jour 28 », bande blanche) et 15 (14 contre 28 jours dans la visite).
- Envoi Alpha du 09/11 23:45 : partira avec ce changement.
