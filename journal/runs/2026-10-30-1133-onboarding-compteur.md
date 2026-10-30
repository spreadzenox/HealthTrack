# Run du 30/10/2026 11:33 (Paris, CET) — Onboarding : un compteur qui ne grimpe plus (POL-PLAY-61)

**Type** : 🎨 Code (polissage de la version play)

## Constat au démarrage
- Main à `aca43a5` (#524), workflows verts ; aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, non touchée).
- Les points ouverts du BACKLOG attendent le propriétaire (TF-1/TF-2, VEILLE-1, P28 en examen) ou un délai
  (POL-PLAY-11 : alpha après une journée sans plantage). Pris : le « petit point laissé » de POL-PLAY-58.

## Fait
- `Onboarding.jsx` : `displayedStepCount(state)` = écrans comptés comme si la montre (pas encore choisie) était
  Health Connect et l'accès (pas encore décidé) accordé. Compteur « NN/NN », `aria-valuemax` et largeur de la barre
  l'utilisent ; la navigation garde `stepsFor` (vrais écrans), le diagnostic local aussi.
- Résultat sur play : « 01/07 » au départ, « 03/05 » dès « Pas de montre », « /06 » si l'accès Health Connect est
  refusé. Le compteur ne fait que baisser.

## Tests
- `Onboarding.test.jsx` : nouveau test (03/06 → 03/04 avec « Pas de montre », `aria-valuemax` 4) ; « 01/04 » et
  « 02/04 » deviennent « 01/06 » et « 02/06 » (environnement de test sans visage ni facturation).

## Vérifications
- `npm run test` (2723 ✔), `npm run build`, `npm run lint` (6 erreurs, comme avant), `npm run visual -- --play`.
- Captures relues : onboarding play vierge à 360 px, clair (« 01/07 ») et sombre après « Pas de montre » (« 03/05 »).

## Données
- Aucune : affichage seulement.

## Demandes iOS
- Commun aux deux plateformes : note de Nouveautés sans `variants`.

## Suite
- BACKLOG par impact ; POL-PLAY-11 (alpha + `shrinkResources`) quand Android vitals aura une journée sans plantage.
