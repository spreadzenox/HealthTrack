# Run 24/11 22:30 — #1246 mergée ; troisième unité dans « + » et totaux de l'essai (POLISH-SIM-158, 159)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 1cf5526 (#1245) vert
(Tests, émulateur A56) au départ · **TestFlight** : 1290.1290 chez « Testeurs Halcya » (build du soir pas relevée ;
cron en retard) · **Parité** : 70 % (33/47), inchangée (code commun, part sur les deux)

## État de départ
#1246 (run de 21:30) ouverte, prête, 15 checks verts dont « Build iOS (simulateur) et captures », branche à jour sur
origin/main. #51 (`cursor/*`) pas touchée.

## Fait
- **#1246 mergée** (squash, sans lignes d'attribution) après relecture des captures : iPhone (`captures/pr-1246` :
  Tendances › Jour d'un jour passé, Objectifs › Sommeil) et Android (`npm run visual -- --routes=/tendances
  --onboarding=gut --click="Ajouter une mesure > Confort digestif > lundi 23 novembre"`) : deux courbes, détail du jour
  lisible, rien de cassé.
- **POLISH-SIM-158** : `TrendsViewer.jsx`, `blocked` = mesures disponibles d'une troisième unité ; dans « + » (Semaine
  et Mois), elles restent en puces grisées (`is-pending`, `aria-disabled`) après celles qu'on peut ajouter, sous la
  phrase « Deux unités au plus : retirez une courbe pour en ajouter une autre. ». Le « + » reste visible s'il n'y a
  plus qu'elles. Test `Trends.test.jsx` d'abord (rouge : le « + » disparaissait).
- **POLISH-SIM-159** : `Trial.jsx`, « Consigne tenue 1 jour sur 5 prévus » remplace « 1 jour réussi sur 5 » (qui se
  lisait comme un second décompte des jours). Tests de `Trial.test.jsx` mis à jour d'abord. Reste à vérifier : la ligne
  « Sans » vide au jour 4 (BACKLOG).
- Note de Nouveautés commune : `2026-11-24-2230-troisieme-unite-et-essai.json`.

## Vérifications
- `npm run test` : 4 648 verts ; `npm run lint` sans erreur ; `npm run build` OK.
- `npm run visual -- --routes=/tendances?vue=semaine --click="Ajouter une mesure > Sommeil > Ajouter une mesure"` :
  Bien-être et Sommeil affichés ; Confort digestif et Écran ajoutables ; Pas, Poids, Variabilité cardiaque, Cœur au
  repos grisés sous la phrase. Capture lue.
- Build iPhone sur simulateur : sur la PR (un seul).

## Suite proposée
1. Merger la PR au run suivant, après le build iPhone et la relecture des captures (Tendances, essai).
2. Soumission bêta de la build du soir au premier run qui la voit traitée par Apple.
3. Run « idées » de 08:30 : maquette « cœur et oxygène de la montre dans Tendances », ligne « Sans » de l'essai.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.
