# Run 25/11 11:30 — votre note sur la courbe

**Type** : 🔧 (code) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 292ef7c vert,
release v916 · **TestFlight** : 1313.1313 chez « Testeurs Halcya », en examen bêta depuis le 25/11 04:31 UTC ·
**Parité** : 70 % (33/47), inchangée

## État de départ
- main 292ef7c vert (Tests, émulateur A56 ; Build & Release et Play — AAB de 872e6fe verts). Aucune PR de la routine
  ouverte (#51 est `cursor/*`, pas à la routine).
- Restes « À étudier » : la note « Douleur » lissée (personas du 22/11 et du 24/11), le poids (en attente du
  propriétaire), les courbes de la montre (en attente du propriétaire).

## Fait
**POLISH-NOTE-LOSANGE** : dans Tendances, en Semaine et en Mois, la note du jour telle que donnée (bien-être de 1 à 5 ;
ventre calme 5, gêne 3, douleur 1, l'échelle dite sous la courbe) est tracée en losange, le même signe que « votre
note » dans la vue Jour, quand l'estimation lissée s'en écarte d'au moins 0,25 point (`NOTE_APART`). La ligne, ses
points et sa fourchette restent l'estimation. Une légende « votre note · l'estimation du jour » n'apparaît que si un
losange est tracé.
- `stateSpace.js` : `observationsFromEntries` garde le niveau du ventre (`level`) ; chaque jour de `estimateStates`
  porte `noted` (note moyenne du jour, niveau le plus fort), rien pour les jours à venir. Le modèle ne change pas.
- `trendsData.js` : `note` sur un point d'état passé quand l'écart est visible.
- `TrendsViewer.jsx` : losanges `trends-note` (style existant), légende `trends-legend is-period`.
- Note de Nouveautés `2026-11-25-1130-note-en-losange.json` (code commun, les deux magasins).

**Constat** (pas de changement de modèle, banc d'abord) : `GUT_VALUE` met la douleur à 1 en interne, soit 1,8 à
l'écran, et le calme à 4,6. L'échelle du modèle est plus serrée que celle qu'on affiche ; avec le lissage d'une note
isolée, cela fait le 2,5 vu par la persona. Étape **METHODE-ECHELLE-VENTRE** ajoutée au backlog pour un run « idées ».

## Vérifications
- Tests d'abord : 1 test `stateSpace.test.js`, 2 tests `trendsData.test.js`, 2 tests `Trends.test.jsx`, rouges avant,
  verts après.
- `npm run test` : 4 672 tests verts ; `npm run build` vert ; `npm run lint` : aucune erreur.
- `npm run visual -- --play --onboarding=gut --routes=/tendances?mesure=digestion` (clair et `--dark`) et
  `--routes=/tendances` : captures relues. Confort digestif : losanges à 5, 3 et 1 (le 24/11, douleur, estimation
  2,6), légende lisible, rien ne déborde. Bien-être : un seul losange (22/11), le reste sans changement. Aucune erreur JS.
- iPhone : code partagé, aucun correctif touché ; build iPhone de la PR une fois passée en « prête » (capture Tendances).

## Suite proposée
1. Run suivant : merge de la PR si le build iPhone et l'émulateur sont verts, capture Tendances iPhone relue.
2. Run « idées » : banc METHODE-ECHELLE-VENTRE.
3. Build iPhone et TestFlight du soir, puis soumission bêta au premier run qui voit la build traitée.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51. Réponses attendues : « go courbes », « go
phases » ou « non » (maquette du 19/11) ; PROP-SIM-19 (poids).
