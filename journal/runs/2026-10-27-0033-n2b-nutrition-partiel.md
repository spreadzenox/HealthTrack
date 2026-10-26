# Run du 27/10/2026 00:33 (Paris, CET) — N2b : une teneur inconnue n'est plus un zéro caché

**Type** : 🏗️ code (priorité du propriétaire du 26/10 14:45 : table nutritionnelle fiable ; P28 attend le propriétaire)

## Constat au démarrage
- Main à `1db9751` (#407), vert (v302). Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`).

## Ce qui a été fait
- `services/nutritionKPIs.js` : `computeTotalsFromItems` ne compte que les teneurs mesurées (inchangé en valeur) et
  renvoie `unknown_share` : pour chaque champ, la part (0–1) du poids mangé dont Ciqual n'a pas mesuré la teneur.
  Un aliment absent de la table n'entre pas dans le poids. Les autres appelants (`analysisEngine`, `gutWindows`) lisent
  des champs précis : rien ne change pour eux.
- `services/nutritionIntakeCompare.js` : chaque ligne porte `unknownShare` et `partial` (≥ 10 % du poids sans teneur),
  plus `partialCount`.
- `pages/Nutrition.jsx` + CSS : valeur précédée de « ≥ », étiquette mono « partiel » à côté du nom, « au moins » dans
  le libellé accessible ; la note de source explique « partiel » (seulement s'il y en a un), sinon garde la phrase
  courte d'avant.
- Nouveautés : « Nutrition : plus de faux zéro ». Aucune donnée, aucun appel réseau nouveau (Sécurité des données
  inchangée).

## Tests
- `nutritionKPIs.test.js` (nouveau, 3) : part inconnue au poids (abat 100 g + agneau collier 300 g → sodium 396 mg,
  3/4 inconnu), aucune part quand tout est mesuré, aliment hors table ignoré.
- `nutritionIntakeCompare.test.js` +1, `Nutrition.test.jsx` +1 (« ≥ », étiquette, libellé accessible, note).

## Vérifications
- `npm run test` : **2 471** verts (+ 33 sautés) ; `npm run build` OK ; lint 6 erreurs (inchangé) ; `npm run visual`
  (voir plus bas).
- Captures `/nutrition` claire et sombre relues : sur les données de démo, « Oméga-3 partiel ≥ 1,1 g/j » et
  « Folates (B9) partiel ≥ 25 µg/j » ; le reste sans étiquette ; note de source sur trois lignes, « « partiel » »
  insécable.

## Suite
- N3b-2 (GOS des légumineuses cuites depuis le sec, `water_g`), N5 (pistes ventre par sous-groupe, banc des nulles et
  de puissance). Valeur Ciqual suspecte toujours notée : fer de l'oignon cru 0,00019 mg (publiée telle quelle).
