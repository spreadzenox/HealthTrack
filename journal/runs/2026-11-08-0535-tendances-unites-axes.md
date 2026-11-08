# Run 08/11 05:35 — Tendances : unité et couleur des axes (POLISH-SIM-3)

**Type** : 🎨 code. **Branche** : `claude/tendances-axes-unites`. Aucune PR « [Auto] » ouverte, CI de main verte
(c2898f5, #823). Pas de nouvelle correction du propriétaire dans le prompt pour le 08/11.

## Pourquoi
Constat du premier passage des personas (08/11 03:35) : sur Tendances, les axes n'ont pas d'unité ; avec deux
courbes, on ne sait pas quel axe lit quelle courbe.

## Ce qui a été fait
- `TrendsViewer.jsx` : l'unité de la mesure (« /5 », « h », « pas », « ms », « bpm ») en tête de chaque axe ; avec
  deux axes, l'unité et les graduations prennent la couleur (`data-tone`) de la courbe qui les porte (neutre si deux
  courbes de couleurs différentes partagent l'axe, ex. bien-être et confort digestif sur /5).
- Test de page (`Trends.test.jsx`) : unité seule et neutre avec une courbe ; « /5 » vert et « h » bleu nuit avec
  Bien-être + Sommeil.
- Captures : `maquettes/agir-tendances/comparaison/semaine-deux-axes-clair.png` (Bien-être + Sommeil) et
  `…-sombre.png` (Bien-être + Pas).

## Vérifications
- `npm run test` : 3 253 verts ; lint 0 erreur ; build OK.
- `npm run visual --routes=/tendances --click="Ajouter une mesure > Sommeil"` (clair) et `… > Pas` (sombre) : aucune
  erreur JS, captures lues.

## Restes (polish, BACKLOG)
- Graduations brutes (« 4 651 », « 11 759 » pas ; heures arrondies à l'entier) : arrondir à des valeurs rondes.
