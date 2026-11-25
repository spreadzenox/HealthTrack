# Run 25/11 09:30 — un essai compte tous ses jours

**Type** : 🔧 (code) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main be9ea5f vert,
release v915 · **TestFlight** : 1313.1313 chez « Testeurs Halcya », en examen bêta depuis le 25/11 04:31 UTC ·
**Parité** : 70 % (33/47), inchangée

## État de départ
- main be9ea5f vert (Tests, émulateur A56). Aucune PR de la routine ouverte (#51 est `cursor/*`, pas à la routine).
- Suite proposée par le run « idées » de 08:30 : POLISH-ESSAI-SANS.

## Fait
**POLISH-ESSAI-SANS** (`app/src/services/trials.js`, `trialStatus`) : `pick` garde le lendemain de chaque jour passé du
calendrier tiré au sort, tenu ou non (intention de traiter). Avant, seuls les jours tenus comptaient : un jour « sans »
où la nuit dépassait 7 h 30 disparaissait alors que l'écran disait « comme d'habitude », la moitié des essais
finissaient en « Trop peu de jours » et, avec un facteur caché, le bilan penchait vers « Plutôt oui » (banc
`methode/ESSAI-SANS.md`). La tenue reste pour les lanternes et « Consigne tenue N jours sur 5 ». Aucun schéma touché :
les essais en cours se recalculent seuls. Textes de `Trial.jsx` inchangés (« le lendemain d'un jour avec ou sans »
reste juste). Note de Nouveautés `2026-11-25-0930-essai-par-calendrier.json`.

## Vérifications
- Tests d'abord : deux tests dans `trials.test.js` (jours « sans » au-dessus du seuil et jour « avec » manqué comptés,
  lanternes inchangées ; tout tenu : bilan inchangé), rouges avant le correctif, verts après.
- `npm run test` : 4 667 tests verts ; `npm run build` vert ; `npm run lint` : aucune erreur.
- `npm run visual -- --play --routes=/agir --trial=8 --click="Dormir au moins"` : capture relue (jour 8, « Consigne
  tenue 2 jours sur 5 », jours 1 et 4 « pas tenus » désormais comptés, « Après 6 lendemains : +0,5 point, entre −0,5
  et +1,6 »), aucune erreur JS.
- iPhone : code partagé, aucun correctif touché ; build iPhone de la PR une fois passée en « prête ».

## Suite proposée
1. Run suivant : merge de la PR si le build iPhone et l'émulateur sont verts.
2. Restes « À étudier » : note « Douleur » lissée (banc avant tout changement) ; poids (PROP-SIM-19, en attente).
3. Build iPhone et TestFlight du soir, puis soumission bêta au premier run qui voit la build traitée.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51. Réponse attendue : « go courbes », « go
phases » ou « non » (maquette du 19/11).
