# 06/11 04:35 — Onglet Ventre : le rapport PDF en une phrase (POL-PLAY-VENTRE-BIENTOT)

Type : 🔧 run de code (04:35 Paris). Priorités 02/11 et 04/11 traitées ou en attente (Alpha 100811 en examen, porte
de 24 h jusqu'à ~16:30) ; suite de la revue C1 (installation neuve, variante play).

## Constat au démarrage
- main `a785bf5` : Tests, Build & Release, émulateur A56, Play — AAB, Play — Alpha verts. Aucune PR « [Auto] » ouverte.

## Fait
- `GutView` (Recommendations.jsx) : sans note du ventre, une phrase `.reco-report-later` (Figtree, gris, filet) au
  lieu du bloc `SoonList` « Bientôt » dont la seule ligne était le rapport PDF, avec une phrase en mono.
- `soonLines` perd ses lignes `gut` et `report` (seul `GutView` les demandait et filtrait déjà `gut`) et le paramètre
  `showGut`.
- Nouveautés `2026-11-06-0435-ventre-rapport-ligne.json`.

## Vérifications
- 2 tests adaptés (vus en échec avant le correctif) ; `npm run test` 3 181 verts ; `npm run build` OK ; lint 0 erreur ;
  `npm run visual` complet ; captures `--play --empty` de /recommendations/ventre relues en clair et en sombre.

## Suite
- VISUAL-FLAKY-1 ; CD-ALPHA-6 vers 16:30 ; `until` à redécaler si l'invitation part après le 06/11 ; GOLD-a3-2 dès P37 ;
  TEST-ALPHA-1 (07–08/11) ; chantier montre (relevés du propriétaire).
