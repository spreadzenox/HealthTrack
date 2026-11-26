# Run 26/11 15:30 — familles « Pas assez de données » avec leur action (POLISH-SIM-170)

**Type** : 🔧 (polish, code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
96fce7e (#1289) vert (Tests, émulateur A56, Build & Release v932, Play — AAB) · **TestFlight** : 1335.1335 chez
« Testeurs Halcya », validée (inchangé ; build du soir à 21:20) · **Parité** : 70 % (33/47), inchangée (code partagé)

## État de départ
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée). Pas de nouvelle réponse du propriétaire.
- Run de 15:30 : run de code. Refonte : étapes ouvertes sans code possible (courbes, rituel : réponses attendues).

## Choix de l'étape
Constat « À étudier » du passage du 25/11 20:30 (« Stressé et pressé », J45, notes rares) : « Sommeil : pas assez de
données. OK, mais je fais quoi ? […] Les lignes ne sont pas cliquables et ne disent pas quoi faire. » Seul constat de
ce passage encore ouvert qui soit un correctif (les autres : faits par 165 à 167, ou propositions).

## Fait
- `services/influenceFamilies.js` : `NODATA_ACTIONS` ; une famille toujours montrée sans aucun facteur comparé
  rend `action` : Sommeil « Il faut vos nuits au moins un jour sur deux. » → Sources (`/connectors`), Alimentation
  « Notez vos repas au moins un jour sur deux. » → `/food`, Activité « Il faut vos pas au moins un jour sur deux. » →
  Sources. « Un jour sur deux » = `FACTOR_MIN_COVERAGE` (0,5) de `analysisResults.js`, vérifié dans le code.
- `pages/Recommendations.jsx` : la carte d'une telle famille devient un lien (chevron) vers son action ; la phrase
  sous « Pas assez de données » (`.reco-family-action`). Les familles avec facteurs comparés ouvrent toujours leur détail.
- Tests d'abord, rouges puis verts : `influenceFamilies.test.js` (action par famille, aucune action sinon),
  `Recommendations.test.jsx` (lien `/food`, phrase, pas d'action sur une famille comparée).
- Nouveautés : `2026-11-26-1530-familles-quoi-faire.json` (les deux magasins).

## Vérifications
- `npm run test` : 4 711 verts ; `npm run lint` : 0 erreur (comme avant) ; `npm run build` vert.
- `npm run visual -- --routes=/recommendations/bien-etre` (démo complète) : inchangé, les trois familles ont des
  facteurs comparés.
- Outil des personas rejoué (`--day=45 --equipment=phone --notes=few --goals=stress`, clair et `--dark`) :
  [`clair`](captures/2026-11-26-1530-familles-action-clair.png), [`sombre`](captures/2026-11-26-1530-familles-action-sombre.png) ;
  Sommeil et Alimentation disent quoi faire, Activité (comparée) inchangée ; toucher Sommeil ouvre `/connectors`.
- PR en brouillon puis prête : un build iPhone (code embarqué changé), captures de l'iPhone à regarder avant merge.

## Suite proposée
1. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; soumission bêta au premier run qui voit la build.
2. Autres « À étudier » du 25/11 : carte Confort digestif sous l'île (à vérifier en code), détail FODMAP d'un repas.
3. FUSION-4 : mission d'archivage de l'ancien dépôt quand ses builds TestFlight sont expirées.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, envoyer le message E.
