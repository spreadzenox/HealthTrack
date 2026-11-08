# Run 08/11 23:35 — Visite guidée : des pistes dès le jour 14

**Type** : code (priorité du prompt : « données fictives plus marquées », accord du propriétaire du 08/11 vers 22:55).
**Étape** : ACC-8b.

## Contexte
- Aucune PR « [Auto] » de la routine ouverte (seule la #51, ancienne, hors routine) ; main = #848, Build & Release,
  Tests, Play — AAB, émulateur A56 verts.
- Gel Alpha jusqu'au 09/11 22:00 : `review-freeze.json` non touché, aucun envoi lancé.

## Constat
Avec 14 jours de démo, le moteur ne trouvait aucun lien net : la visite chargeait 75 jours derrière l'étiquette
« jour 14 » (`RESULTS_DATA_DAYS`). Sur 14 ou 28 vrais jours d'exemple : aucune piste, ni bien-être ni digestion.

## Fait
- `services/tourData.js` : données marquées, toujours en mémoire.
  - Levier du bien-être : la nuit (430 ± 70 min) chez qui reçoit son sommeil, sinon deux verres de vin certains soirs
    (rien d'autre n'a d'alcool dans l'exemple : piste nette avec les seuls repas notés). La note suit le levier du jour
    et de la veille (la fenêtre « court terme »). Une nuit chaque jour (la montre de la démo était parfois oubliée).
  - Digestion (jour 28) : oignon cru au dîner (fructanes), douleur le soir même, gêne le lendemain, calme sinon ; la
    note d'aujourd'hui suit la même règle (la démo y mettait une douleur sans oignon).
  - Motifs fixes de 13 et 11 jours (`PATTERNS`), cherchés sur 14 dates et heures × 4 configurations × 3 fuseaux
    (Paris, UTC, Montréal) ; le premier hachage essayé laissait 10 jours sans oignon.
  - Bug trouvé : les entrées ajoutées se plaçaient à « maintenant − i × 24 h » ; tard le soir, 28 jours en arrière
    traversent le passage à l'heure d'hiver du 25/10 et tout se décalait d'un jour (piste perdue). `daysBefore` passe par
    le calendrier.
- `services/tour.js`, `GuidedTour.jsx` : plus de `RESULTS_DATA_DAYS` ; « jour 14 » = 14 jours, « jour 28 » = 28.
- `services/trials.js` : « Un peu moins d'alcool / d'activité que d'habitude » (élision ; avant « de alcool »).
- Nouveautés : `2026-11-08-2335-visite-donnees-marquees.json`.

## Vérifs
- `tourResults.test.js` (nouveau) : vrai moteur (`runAnalysisTask`), à l'heure de Paris, 5 dates et heures (dont
  23:00 et 23:30) × 4 configurations (montre et Health Connect ; tout avec visage, météo, écran ; pas seulement ;
  aucune source) : jour 14, piste nette, « Ce qui va avec » et essai proposé ; jour 28, piste Fructanes et piste
  bien-être ; sans source, la piste est l'alcool ; avec le sommeil, le sommeil. En réintroduisant l'ancien calcul de
  date, le test échoue (vérifié, même lancé en UTC).
- `npm run test` : 3 314 verts ; `npm run lint` : 0 erreur ; `npm run build` ok.
- `npm run visual -- --routes=/ --onboarding=tour --viewport --click=…` (démo et `--empty`) : jour 14 « Sommeil »
  (`runs/captures/2026-11-08-2335-visite-j14.png`), jour 28 « Fructanes » (`…-j28.png`), sans source « Alcool » puis
  « Tester : alcool » dans Agir (`…-vide-j14.png`, `…-vide-agir.png`, planche `…-planche.png`).

## Points d'attention
- L'effet affiché sans source reste petit (« −0,2 point sur 5 pour 5 g d'alcool de plus ») : la variation habituelle
  vient du moteur. Lisible, mais à regarder au prochain passage des personas.
- « Fructanes −3,6 pt pour 1 repas riche » : fort, sous l'échelle (4 pt). C'est un exemple.

## Suite
- POLISH-SIM-17, 18, 19 ; visite à revoir sur l'émulateur A56 au prochain passage des personas.
- Envoi Alpha du 09/11 23:45 : partira avec ce changement.
