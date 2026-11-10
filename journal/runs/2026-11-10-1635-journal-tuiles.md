# Run 10/11 16:35 — Journal : les tuiles du jour ouvrent leur courbe (POLISH-SIM-36)

**Type** : code (mode polish).

## Contexte
- Main vert (6575ddc : Tests, Build & Release, Play — AAB, émulateur A56).
- PR #894 (POLISH-SIM-33, TabBar) ouverte par une autre exécution il y a moins de 90 min : étape indépendante choisie,
  aucun fichier commun hors journal.

## Fait
- POLISH-SIM-36 (1re moitié) : dans Journal › Jours, les tuiles du résumé ne s'ouvraient pas. Chaque tuile qui a une
  courbe dans Tendances (Sommeil, Pas, VFC nuit, FC au repos, Écran, Bien-être) porte un lien étiré sur toute la tuile
  vers `/tendances?mesure=…`, comme les lignes d'Aujourd'hui (`TodayBySource`). Les autres tuiles (Dépense, Météo…)
  restent de simples blocs. Hauteur minimale 44 px (contrôle de cible du visuel). Apparence inchangée.
- Test rouge puis vert dans `Journal.test.jsx`.
- Captures : [clair](captures/2026-11-10-1635-journal-tuiles-clair.png) · [sombre](captures/2026-11-10-1635-journal-tuiles-sombre.png) ;
  `--click="Pas : 10"` ouvre bien Tendances.

## Vérifs
- `npm run test` vert (3 375 tests) ; `npm run lint` 0 erreur ; `npm run build` OK ; `npm run visual` OK.

## Reste
- POLISH-SIM-36b : « Modifier » une note de digestion depuis le « … » ; ouvrir Tendances sur le jour touché.
- POLISH-SIM-31, 32, 34, 35, 37 au BACKLOG.
