# Run 11/11 07:35 — Ma digestion, une question à la fois (POLISH-SIM-41)

**Type** : code (mode polish).

## Contexte
- Main vert (72f3c7c, #909 ; Build & Release, Play — AAB, émulateur A56 verts). Aucune PR « [Auto] » ouverte (seule la
  #51, hors routine). Alpha 100984 en examen chez Google.

## Fait
- **POLISH-SIM-41** (Endométriose J1) : le soir, la fenêtre « Ma digestion » (et la carte) montrait, après « Noter un
  moment précis », deux rangées Calme / Gêne / Douleur : « dans l'ensemble » et « À l'instant ». Désormais une seule à
  la fois : le bilan de la journée ; « Noter un moment précis » la remplace par « À l'instant » ; le lien « Bilan de la
  journée » ramène. Le reste du constat (lieu, intensité, « ballonné ») est une fonction : il reste dans PROP-SIM-10.
- Nouveautés : `2026-11-11-0735-digestion-une-question.json`.

## Vérifs
- TDD : test `TodayCards.test.jsx` rouge puis vert ; l'ancien test POL-PLAY-12 n'attend plus la question du jour
  après l'ouverture du moment.
- `npm run test` complet, lint, build, `npm run visual` complet (voir PR).
- Captures (`--play --tz=Pacific/Kiritimati` pour être le soir, `--click="Digestion"`) :
  `captures/2026-11-11-0735-digestion-journee-sombre.png`, `…-moment-clair.png`.

## Suite
- POLISH-SIM-40 (à reproduire), 45, 37, 39.
- CYCLE-3 attend P48 (propriétaire).
