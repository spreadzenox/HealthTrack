# Run 10/11 03:35 — Tendances : la nuit même, au singulier

**Type** : code (mode polish) — T4-suite (reste des corrections Tendances du propriétaire, écart à la maquette).

## Contexte
- PR #878 (run de 02:35, barres vides) ouverte : son dernier commit (journal seul) avait « Build APK » rouge sur une
  coupure réseau (téléchargement des outils du SDK Android, `Error: aborted`), le commit précédent était tout vert.
  Jobs échoués relancés (run 42739595693). Gel Alpha jusqu'au 10/11 22:00 : pas touché.

## Fait
- `analysisResults.js` : `dayContributions` expose `dayValue` (valeur du seul jour) quand l'horizon qui pèse est le
  court terme (jour même et veille).
- `trendsDay.js` : `contributionText` dit « Nuit plus courte/longue que d'habitude (6 h 21) » avec la nuit même si
  elle va dans le même sens que la fenêtre ; sinon le pluriel et la moyenne, comme avant.
- Tests rouges puis verts (`trendsDay.test.js`, `analysisResults.test.js`).
- Nouveautés : `2026-11-10-0335-nuit-singulier.json`.

## Captures
`runs/captures/2026-11-10-0335-nuit-singulier-clair.png`, `…-sombre.png` (démo, Tendances › Jour : « Nuit plus
longue que d'habitude (7 h 41) »).

## Vérifs
`npm run test` (3 348 verts), `npm run build`, `npm run lint` (0 erreur), `npm run visual --routes=/tendances?vue=jour`
clair et `--dark`, captures lues.

## Suite
- #878 mergée à 03:5x (Build APK relancé vert, tous les checks verts) ; #879 rebasée sur main.
- PROP-OBJECTIF au run « idées » de 08:35 ; INTEG-1a.
