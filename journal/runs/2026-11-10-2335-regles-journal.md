# Run 10/11 23:35 — Corriger ses règles depuis le Journal (CYCLE-2b)

**Type** : code (exception « Ok cycle » au mode polish).

## Contexte
- Main vert (112155b : Build & Release, Tests, Play — AAB, émulateur A56). Aucune PR « [Auto] » ouverte.

## Fait
- **CYCLE-2b** : `CycleLine` (Journal › Jours) reçoit l'entrée « règles » du jour (`periodEntryOn`, ajoutée par
  `readCycle`) ; si elle vient de l'app (`app_cycle`), un « … » (`EntryActionsToggle`) donne « Modifier » et
  « Supprimer » (`DeleteEntryButton`, confirmation). Règles d'une autre source : pas de « … ».
- `PeriodSheet` accepte `dateKey` (jour corrigé, lecture des 62 jours avant lui) et `onDone` : titre « 2e jour des
  règles, flux : » pour un jour passé, « Annuler » discret, se referme après un choix, pas de « Retirer » (Supprimer
  est à côté). Son CSS est importé par le composant (le Journal ne charge pas `AddStrip`).
- Nouveautés : `2026-11-10-2335-regles-journal.json`.

## Vérifs
- TDD : PeriodSheet (jour passé) et Journal (Modifier, Supprimer, pas de « … » pour une autre source) rouges puis verts.
  `npm run test` complet vert (3409), lint 0 erreur, build, `npm run visual` complet.
- Captures relues : `npm run visual -- --routes=/journal --cycle --click="Actions pour ces règles"` (clair) et
  `… > Modifier ces règles` (sombre) : `captures/2026-11-10-2335-regles-journal-*.png`. Premier essai : « Annuler »
  en gros bouton vert, aligné sur l'« Annuler » discret de la note de digestion.

## Suite
- CYCLE-2c : symptômes du cycle dans « Mes règles », puis noter hier.
- Puis POLISH-SIM-38, 40.
