# Run 08/11 14:35 — VFC, FC au repos, SpO₂ en toutes lettres (POLISH-SIM-6)

**Type** : code (polish, constat des personas POLISH-SIM-6).

## Contexte
- Main verte (Build & Release, Play — AAB, Tests, émulateur de #833) ; aucune PR « [Auto] » ouverte.
- Pas de nouvelle correction du propriétaire dans le prompt depuis le run précédent.

## Fait
- Tendances : sous la courbe, une ligne par abréviation affichée, dite une fois : « VFC nuit : variabilité de la
  fréquence cardiaque pendant la nuit, en millisecondes », « FC au repos : fréquence cardiaque au repos, en battements
  par minute » (`gloss` dans `TREND_MEASURES`, rendu dans `TrendsViewer.jsx`). Rien pour Bien-être, Sommeil, Pas…
- Journal (« Vos données du jour ») : inchangé ; chaque ligne ouvre déjà sa courbe dans Tendances, où vit
  l'explication (une information n'a qu'une maison).
- Sources, « qui envoie quoi » : « FC repos », « VFC », « SpO₂ » → « cœur au repos », « variabilité cardiaque »,
  « oxygène du sang » (`devices/healthApps.js` METRICS ; écran de diagnostic de la montre non touché).
- Défaut trouvé sur les captures et corrigé : le mot « attendu » (POLISH-SIM-13) s'affichait au-dessus d'un futur
  vide quand la courbe n'a pas d'attendu (VFC, pas…). Il n'apparaît plus que si une courbe affichée a des points futurs.
- Tests : 2 tests de page (glose, absence pour le bien-être, pas d'« attendu » sur la VFC) ; tests Sources mis à jour.
- Vérifs : `npm run test` 3 272 verts, build OK, lint sans erreur ; captures Tendances VFC claire
  (`maquettes/agir-tendances/comparaison/semaine-vfc-clair.png`) et sombre, Sources sur démo, regardées.
- Nouveautés : `2026-11-08-1435-noms-en-toutes-lettres.json`.

## Suite
- POLISH-SIM-5 (Analyses et Agir vides), POLISH-SIM-12 (PDF depuis Agir).
- Envoi Alpha de ce soir 23:45 (version des testeurs ; peut partir en retard chez GitHub).
