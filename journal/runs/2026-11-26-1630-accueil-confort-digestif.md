# Run 26/11 16:30 — Accueil : la carte Confort digestif sous l'île (POLISH-SIM-171)

**Type** : 🔧 (polish, code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
df92426 (#1290) vert (Tests, Build & Release, Play — AAB ; émulateur A56 en cours au départ) · **TestFlight** :
1335.1335 chez « Testeurs Halcya », validée (inchangé ; build du soir à 21:20) · **Parité** : 70 % (33/47), inchangée
(code partagé)

## État de départ
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée). Pas de nouvelle réponse du propriétaire.
- Run de 16:30 : run de code.

## Choix de l'étape
« À étudier » du passage du 25/11 20:30 (« Ventre, sans technique ») : l'Accueil ne montre que le bien-être sous l'île ;
le brief § 4 veut « les cartes des objectifs (score sur 7 jours, tendance) ». Vérifié en code : la carte Confort
digestif n'existait que dans Objectifs ; sur l'Accueil, rien pour la digestion (`DigestBlock` est dans Ma journée).

## Fait
- `pages/Objectives.jsx` : `ObjectiveCard` exportée (inchangée).
- `components/HomeGutObjective.jsx` : rend la carte digestion (`objectiveCard('digestion', …)`) : score des 7
  derniers jours et tendance, ou « Premier score dans N jours notés ». Elle ne calcule rien : elle lit le dernier
  `dayStates` gardé (`peekAnalysis`, sinon `lastAnalysis`), comme `useFirstWeekInputs`. Premier push : elle lançait
  l'analyse, et le contrôle « Budget de lectures (perf) » de la PR a échoué (`/` : 16 803 enregistrements lus, max
  1 500). Corrigé : `npm run perf -- --budget` local, `/` à 1 003 lectures, 0 dans le Worker. Conséquence : la carte
  apparaît dès qu'Objectifs, Données ou l'îlot ont calculé l'analyse une fois (sinon rien, jamais un chiffre faux).
- `pages/Dashboard.jsx` : la carte sous `DayStatusCard`, sur l'Accueil seulement, avec `gutCardMode() === 'show'`
  (objectif digestion choisi) ; Ma journée garde son bloc digestif.
- Tests d'abord, rouges puis verts : `HomeGutObjective.test.jsx` (score, attente, sans données),
  `Dashboard.test.jsx` (Accueil avec et sans l'objectif, absente de Ma journée).
- Nouveautés : `2026-11-26-1630-accueil-confort-digestif.json` (les deux magasins).

## Vérifications
- `npm run perf -- --budget --runs=1 --cpu=1` : budget respecté (10 pages).
- `npm run test` : 4 715 verts au premier push, + 2 tests (aucun calcul, rien sans cache) ; `npm run lint` : 0 erreur ; `npm run build` vert.
- `npm run visual -- --routes=/ --onboarding=gut --now=14:00`, clair et `--dark` : île, bien-être du jour, carte
  Confort digestif (« Premier score dans 5 jours notés », jauge 9 sur 14), données du jour, Agir ; ordre du brief.
  Captures : [`sombre`](captures/2026-11-26-1630-accueil-confort-digestif-sombre.png) (premier push),
  [`clair`](captures/2026-11-26-1630-accueil-confort-digestif-clair.png) (`--routes=/recommendations,/`, cache seul).
- PR en brouillon puis prête : un build iPhone (code embarqué changé), captures de l'iPhone à regarder avant merge.

## Suite proposée
1. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; soumission bêta au premier run qui voit la build.
2. Reste des « À étudier » du 25/11 : détail FODMAP d'un repas, ordre de grandeur des exemples du 28e jour.
3. FUSION-4 : mission d'archivage de l'ancien dépôt quand ses builds TestFlight sont expirées.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, envoyer le message E.
