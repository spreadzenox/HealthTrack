# Run 08/11 13:35 — Tendances : « attendu » au-dessus du pointillé

**Type** : code (polish, constat des personas POLISH-SIM-13).

## Contexte
- Main verte (Build & Release, Play — AAB 100907, Tests, émulateur) ; aucune PR « [Auto] » ouverte.
- Pas de nouvelle correction du propriétaire dans le prompt depuis le run précédent ; passage des personas déjà fait (03:35).

## Fait
- `TrendsViewer.jsx` : le mot « attendu » (italique, gris) au-dessus de la partie future de la courbe, centré sur le
  futur ; absent s'il n'y a pas de futur (vue Mois finie, jour passé). Un seul mot, pas de légende ajoutée.
- Test de page (Trends.test.jsx) : le libellé existe et se place après la ligne « auj. ».
- Vérifs : `npm run test` 3 268 verts, build OK, lint sans erreur ; captures Semaine sur démo en clair et sombre
  (`maquettes/agir-tendances/comparaison/semaine-attendu-*.png`) et historique de 2 jours (Jour, inchangé).
- Nouveautés : `2026-11-08-1335-tendances-attendu.json`.

## Suite
- POLISH-SIM-6 (jargon VFC, FC au repos, SpO₂), POLISH-SIM-5 (Analyses et Agir vides), POLISH-SIM-12 (PDF depuis Agir).
- Envoi Alpha de ce soir 23:45 (version des testeurs).
