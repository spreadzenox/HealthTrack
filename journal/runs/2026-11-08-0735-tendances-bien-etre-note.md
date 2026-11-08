# Run 08/11 07:35 — Tendances : bien-être et note expliqués (POLISH-SIM-4)

**Type** : 🎨 code. **Branche** : `claude/tendances-bien-etre-note`. Aucune PR « [Auto] » ouverte, CI de main verte (ba37f4a, #825).
Pas de nouvelle correction du propriétaire dans le prompt pour le 08/11.

## Pourquoi
Constat des personas (08/11 03:35) : dans le détail d'un jour, « Bien-être 3,2 » à côté de « votre note 3,4 » sans
explication ; l'échelle du confort digestif n'est dite nulle part.

## Ce qui a été fait
- `services/trendsData.js` : `detailSource(key, …)` (fonction pure) : « votre note » si l'estimation arrondie égale la
  note ; sinon « votre note 3,4 et le visage » (lectures ce jour-là) ou « … et les jours voisins » ; sans note,
  « d'après le visage » ou « estimé » ; confort digestif : « noté « Gêné », 5 = calme » / « estimé, 5 = calme ».
- `TrendsViewer.jsx` l'utilise à la place de l'ancienne ternaire ; la note garde un seul chiffre (test T3 inchangé).
- Tests : 4 cas dans `trendsData.test.js` ; `Trends.test.jsx` accepte la nouvelle phrase.
- Capture lue : `maquettes/agir-tendances/comparaison/jour-note-et-visage.png` (démo, Jour : « 3,3/5 — votre note 3,4
  et le visage »). Texte seulement : thème sombre non touché.

## Vérifications
- `npm run test` : 3 261 verts ; lint sans nouvelle erreur ; build OK ; `npm run visual --routes=/tendances --click=Jour` : ok.

## Restes (polish, BACKLOG)
- POLISH-SIM-2 (petit « + »), 5 (Analyses et Agir vides), 6 (jargon), 7, 9, T4-suite.
