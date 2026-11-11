# Run 11/11 12:35 — Un aliment non compté se voit (POLISH-SIM-48)

**Type** : code (mode polish).

## Contexte
- Main vert (b6a56ea, #913), aucune PR « [Auto] » ouverte. Étape suivante du BACKLOG : POLISH-SIM-48 (Maigrir J1).

## Constat
- `MealEditor` affichait « Total estimé : ≈ 0 kcal (hors aliments absents de la base) » quand aucun aliment n'était
  reconnu, et les listes (Journal › Repas, Aujourd'hui) un total partiel sans le dire (`unknown` n'est pas enregistré).
- Le relais demande un nom de la liste mais son schéma n'a pas d'enum : un nom hors table reste possible en vrai.

## Fait
- `mealUncounted(items)` (mealEditing) : aliments que `mealKcal` ne compte pas (hors base ou sans grammes), recalculé
  depuis la table, donc valable pour les repas enregistrés.
- `MealEditor` : « Total estimé : inconnu, aucun aliment compté » si rien n'est compté ; sinon « ≈ N kcal, sans X ».
- `TodayMeals`, `Food` (carte et total du jour) : « ≥ N kcal » quand un aliment n'est pas compté (aria « au moins »).
- Tests rouges puis verts (helper, éditeur, Aujourd'hui) ; attente d'un test Food mise à jour (son repas contient
  « Fromage lunaire », hors base : « ≥ 393 kcal » est le comportement voulu).
- Nouveautés : « Un aliment non compté se voit dans le total ».

## Vérifs
- `npm run test` : 3427 verts ; `npm run build` ; `npm run lint` sans erreur ; `npm run visual -- --routes=/food
  --food-analysis` (clair et `--dark`) sans erreur JS, captures lues
  ([clair](captures/2026-11-11-1235-kcal-incomplet-clair.png) · [sombre](captures/2026-11-11-1235-kcal-incomplet-sombre.png)).

## Suite
- POLISH-SIM-47 (poids dans Tendances), 49 (nom du plat modifiable), 50, 51, 45 ; CYCLE-3 attend P48.
