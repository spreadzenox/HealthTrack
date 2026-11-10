# Run 11/11 00:35 — Symptômes du cycle en un geste (CYCLE-2c)

**Type** : code (exception « Ok cycle » au mode polish).

## Contexte
- Main vert (3557d18 : Tests, Build & Release, Play — AAB, émulateur A56). Aucune PR « [Auto] » ouverte.
- Envoi Alpha du soir (cron 23:45 Paris) pas encore parti à 00:33 : le cron de GitHub part souvent avec 2 à 3 h de
  retard (04:21 UTC le 10/11, 01:59 UTC le 09/11). À vérifier au prochain run.

## Fait
- **CYCLE-2c** : « Mes règles » (Aujourd'hui › Règles) a une section « Symptômes » : une puce par symptôme
  (`SYMPTOMS`), touchée = notée pour aujourd'hui (`symptomEntry`), retouchée = retirée ; symptômes d'une autre source
  cochés et grisés. Nouveau `symptomEntriesOn(entries, dateKey)` dans `services/cycle.js`. Le mode « Modifier » du
  Journal reste sur le flux seul. Puces de 44 px (le contrôle des cibles de `npm run visual` signalait 40 px).
- Nouveautés : `2026-11-11-0035-symptomes-cycle.json`.

## Vérifs
- TDD : `cycle.test.js` (symptomEntriesOn) et `PeriodSheet.test.jsx` (cocher, décocher, autre source, pas en mode
  Journal) rouges puis verts. `npm run test` complet vert (3412), lint 0 erreur, build, `npm run visual` complet.
- Captures relues : `npm run visual -- --routes=/ --cycle --dark --click="Règles > Moyen > Crampes > Fatigue"` et
  `--light --click="Règles > Crampes"` : `captures/2026-11-11-0035-symptomes-cycle-*.png`.

## Suite
- CYCLE-2d : noter hier (flux et symptômes) depuis « Mes règles ».
- Puis POLISH-SIM-38, 40.
