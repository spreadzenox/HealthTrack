# Run 10/11 12:35 — Fiche du Store et abonnements au passage du soir (CD-ALPHA-7b)

**Type** : code (mode polish ; livraison continue).

## Contexte
- Main vert (Tests, Build & Release, Play — AAB, émulateur A56 sur bef84e2). Aucune PR « [Auto] » ouverte.
- Relu au BACKLOG : CD-ALPHA-7 d'origine (07/11) restait ouvert : « la porte de 24 h de la fiche et des abonnements
  compte l'envoi Alpha de la veille ; avec un envoi Alpha chaque soir, leurs changements ne partiraient plus ».

## Constat (journaux des workflows)
- Dernier envoi réussi de la fiche : 03/11 (e140e2f). Depuis : envois de push « skipped », passages quotidiens
  retenus par le gel (09/11 : « envois gelés jusqu'au 2026-11-09 21:00 UTC »), puis la porte de 24 h comptait la date
  de la version Alpha (100962, 10/11 ~09:4x) : le passage de 07:23 UTC tombe toujours < 24 h après l'alpha du soir.
- En attente : titre et textes « digestion » (#785, 07/11) ; avantages des abonnements (#816, #785).

## Fait
- `reviewGate.mjs` : `decideEvening({ event, now, freezeUntil })` : gel → reporté ; `push` → reporté au passage du
  soir ; `schedule` ou `workflow_dispatch` → envoi. `EVENING_UTC = '22:23'`.
- `review-gate-cli.mjs` : ne lit plus la piste alpha ni l'espacement ; garde « rien de neuf → pas d'envoi ».
- `play-listing.yml` / `play-subscriptions.yml` : crons `23 22` et `33 22` UTC (avant l'alpha `45 22`), en-têtes à
  jour, plus de jeton Play passé à la porte.
- Tests `reviewGate.test.mjs` (5, rouges puis verts), dont un qui vérifie que les crons restent dans la demi-heure
  avant l'alpha (à recaler ensemble au changement d'heure du 28/03/2027).

## Vérifs
- `npm run test` : 3 372 verts ; `npm run lint` : aucune erreur ; `npm run build` OK ; `npm run visual -- --play
  --routes=/` OK (aucun changement d'écran).

## Reste
- Demain : lire le bilan des deux workflows du 10/11 au soir (attendu : « envoi de la fiche du Store », « envoi des
  abonnements »). Si Google refuse : erreur exacte en tête du résumé.
- LISTING-CAPTURES : captures de la fiche du 03/11, antérieures au nouvel écran Aujourd'hui ; à refaire.
