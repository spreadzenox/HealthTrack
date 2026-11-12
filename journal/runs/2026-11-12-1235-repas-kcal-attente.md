# Run 12/11 12:35 — Journal : la tuile Repas en attendant les kcal (POLISH-SIM-59)

**Type** : code (mode polish).

## Contexte
- Main 7ce6a43 (#935) vert (Build & Release, Tests, émulateur A56, Play — AAB) ; aucune PR « [Auto] » ouverte (seule la #51, hors routine).
- POLISH-SIM-59 (Sportif J14) : tuile « Repas 1 » sans kcal dans Journal › Jours, ≈ 479 kcal dans Repas pour le même repas.

## Cause
- Les deux écrans comptent avec la même fonction (`mealKcal`). La table Ciqual est chargée à la demande
  (`loadNutritionTable`) ; Repas l'attend avant de s'afficher, le Journal non (il se recalcule à son arrivée). La
  capture de la persona a été prise pendant ce chargement (plusieurs secondes sur le serveur de dev), d'où
  `mealKcal = 0` et la valeur de secours « 1 ». Sur `npm run visual` comme sur l'outil, une fois la table chargée, la
  tuile dit bien « ≈ 479 kcal ».

## Fait
- `dailyJournal.js` : `summary.mealKcalPending` quand un repas a des aliments et que la table n'est pas encore chargée.
- `journalChips.js` : dans ce cas, la tuile dit « ≈ … kcal » (titre « Repas » ou « N repas ») au lieu du nombre.
- `persona-browse.mjs` : chaque capture attend la table (`loadNutritionTable`), comme la verrait la personne sur l'APK.
- Tests : `journalChips.test.js` (valeur en attente), `dailyJournal.test.js` (drapeau sans table, rien une fois chargée).
- Nouveautés : `2026-11-12-1235-repas-kcal-attente.json` (correctif).

## Vérifs
- `npm run test` (3471 verts), `npm run lint` (0 erreur), `npm run build`, `npm run visual` (complet, sans erreur).
- Outil des personas, Sportif J14 (`--day=14 --equipment=watch`), Journal :
  [capture](captures/2026-11-12-1235-repas-kcal-sportif.png) : « Repas ≈ 479 kcal · repas incomplets ? », comme Repas.

## Suite
- POLISH-SIM-54 côté Tendances, puis 55 à 58, 61 à 64.
