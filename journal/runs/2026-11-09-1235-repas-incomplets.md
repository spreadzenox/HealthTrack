# Run 09/11 12:35 — Journal : « repas incomplets ? »

**Type** : code (mode polish) — POLISH-SIM-24.

## Contexte
- Aucune PR « [Auto] » ouverte ; dernier « Build & Release » de main vert (#862). Gel Alpha jusqu'à 22:00 : pas touché.

## Fait
- Une seule règle pour les deux écrans : `isLikelyIncompleteEnergy(mangé, référence)` dans
  `nutritionIntakeCompare.js` (sous la moitié de la référence), utilisée par Nutrition (besoins) et par le Journal
  (dépense du jour).
- `journalChips.js` : la tuile Repas porte une note « repas incomplets ? » quand les kcal notées sont sous la moitié
  de la dépense mesurée ; sans dépense, rien n'est comparé donc rien n'est ajouté. `DailyJournal.jsx` l'affiche à la
  place de la ligne « d'habitude » (même style).
- Tests `journalChips.test.js` rouges puis verts. Nouveautés : `2026-11-09-1235-repas-incomplets.json`.
- Captures : `runs/captures/2026-11-09-1235-repas-incomplets-{clair,sombre}.png`.

## Vérifs
- `npm run test` (3 333 verts), `npm run build`, `npm run lint` (0 erreur), `npm run visual` (toutes les pages ok).

## Suite
- POLISH-SIM-25 (« Décrire un repas » ouvre directement le champ), 26, 27, 28.
