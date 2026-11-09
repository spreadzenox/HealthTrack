# Run 09/11 06:35 — Tendances : état vierge sans boutons inutiles

**Type** : code (mode polish).
**Étape** : TEND-VIDE (vu à la revue de ce run, `--play --empty`, 360×780, police ×1,3).

## Contexte
- PR #855 (run 05:35, GRANDE-POLICE-1) restée ouverte, tous les checks verts, merge refusé alors par le filtre de
  permissions : **mergée** en début de run (squash, `bfd0aa3`).
- Gel Alpha jusqu'au 09/11 22:00 : `review-freeze.json` non touché, aucun envoi lancé.

## Constat
Revue `--play --empty` (18 pages ok, aucun débordement). Journal › Tendances sur historique vierge : « Jour / Semaine /
Mois » affichés (Semaine allumé) au-dessus de « Vos courbes apparaîtront après 3 jours de mesures. » ; les trois
boutons ne montrent rien. Agir vierge relu : gardé tel quel (le lien « rapport médecin » répond à POLISH-SIM-12).

## Fait
- `TrendsViewer.jsx` : aucune courbe disponible et aucune lecture ni note (`initialDay` nul) → la carte ne montre que
  le message. Dès qu'une lecture existe (vue Jour) ou qu'une mesure a 3 jours, rien ne change.
- Test de page `Trends.test.jsx` (rouge avant, vert après).
- Nouveautés : `2026-11-09-0635-tendances-vide.json`.

## Vérifs
- `npm run test` (3326 verts), `npm run lint` (0 erreur), `npm run build`, `npm run visual` (démo, 18 pages ok ;
  l'avertissement « cible < 44 px » des colonnes de jours de Tendances existait déjà).
- Captures relues : vierge clair et sombre (`runs/captures/2026-11-09-0635-tendances-vide-{clair,sombre}.png`),
  `--history-days=2` (vue Jour, contrôles présents, inchangée).

## Suite
- Polish : POLISH-SIM-7 / 9 (outil personas, runs « idées »), INTEG-1 (proposition Garmin / Samsung), T4-suite
  (attend la réponse du propriétaire).
