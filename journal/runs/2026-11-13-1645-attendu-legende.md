# Run 13/11 16:45 — Tendances : le pointillé expliqué, plus de jours futurs vides (POLISH-SIM-61)

**Type** : code (mode polish).

## Contexte
- Premier run depuis le 12/11 17:56 (#941) : les instructions de la routine sont désormais dans `orchestration/routine/`
  (#942, empreinte vérifiée avant de les suivre). Aucune PR « [Auto] » ouverte ; sur main 7275bc4, Tests, Build &
  Release, Play — AAB et émulateur A56 verts. « Play — Alpha » du soir du 12/11 parti le 13/11 à 03:56 (Paris), vert
  (cron de GitHub encore en retard d'environ 4 h).

## Fait
- `TrendsViewer.jsx` : sous la courbe, une ligne avec un trait pointillé, « attendu d'après vos habitudes », seulement
  quand un attendu est tracé (bien-être, confort digestif estimé). Le mot « attendu » au-dessus du futur reste
  (POLISH-SIM-13) : la ligne dit d'où il vient (la persona Sportif demandait « d'où vient cette baisse prévue ? »).
- Sans attendu parmi les courbes choisies (sommeil, pas, poids, VFC…), la période s'arrête à aujourd'hui : plus de
  3 jours vides à droite en Semaine (7 en Mois). Ajouter le bien-être les ramène. Un jour futur resté ouvert se
  referme quand la courbe qui portait son attendu est retirée.
- Nouveautés : `2026-11-13-1645-attendu-legende.json`.

## Vérifs
- TDD : 2 tests ajoutés à `Trends.test.jsx` (rouges, puis verts). `npm run test` (3477 verts), `npm run lint`
  (0 erreur), `npm run build`, `npm run visual` complet sans erreur.
- Captures lues : [bien-être, clair](captures/2026-11-13-1645-attendu-legende-clair.png) ·
  [sommeil seul, sombre](captures/2026-11-13-1645-sommeil-sans-futur-sombre.png).

## Suite
- POLISH-SIM-58 (séances introuvables), 62 (retour après la note), 63 à 65 (outil des personas), JOURNAL-CAPTURES-1.
- Deux simulations de personas à faire au run « idées » de 20 h.
