# Run du 30/10/2026 13:36 (Paris, CET) — Sport : une source par séance (POL-PLAY-63)

**Type** : 🐛 Chiffres fiables (polissage de la version Play, critère C2)

## Constat au démarrage
- Main à `fbe8990` (#526), tous les workflows verts (Tests, Build & Release, Play — AAB, émulateur, fiche du Store) ;
  aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, non touchée).
- Tous les points POL-PLAY sont soldés sauf ceux qui attendent le propriétaire ou un délai (POL-PLAY-11, TF-1/TF-2,
  VEILLE-1). La ligne « Paywall avant la version candidate » du BACKLOG est périmée (rappel d'essai livré : `trialReminder.js`).
- `npm run perf -- --play` (3 ans de démo, CPU ×4) : toutes les pages se posent en 0,14 à 0,68 s ; rien à corriger.

## Fait
- Recherche des autres « doubles comptes » de la famille des pas (27/10) et des nuits (POL-PLAY-59) : les séances
  (`type: 'activity'`) de la montre Huawei et de Health Connect étaient toutes gardées. Effets : `activityCalories`
  (analyses, levier « Bouger davantage ») additionnait les calories des deux sources ; le Journal listait la séance
  deux fois ; le « aha » du premier import comptait 2 séances si deux apps écrivent la même dans Health Connect.
- `app/src/services/workoutSources.js` : `oneSourcePerWorkout(entries)` — même séance = deux sources différentes
  (`source` + `sourceName`) qui se chevauchent sur au moins la moitié de la plus courte ; on garde celle qui a la FC,
  puis la montre, puis la plus longue ; une même source n'est jamais dédoublonnée ; choix à la lecture.
- Branché dans `buildDailyJournal`, `buildDailyDataset` et `buildTodayRow` (`analysisEngine.js`) et `summarizeImport`.
- Le reste vérifié : pas et calories par heure (`activityTotals`), nuits (`sleepSources`), FC / VFC / SpO₂ / stress
  (moyennes), pesées (`mergeWeighIns`) : rien d'autre n'additionne deux sources.

## Tests
- `workoutSources.test.js` (6) : même séance → 1 ; FC puis montre ; deux séances distinctes ou qui se suivent → 2 ;
  deux apps Health Connect → 1, même source → 2 ; autres types intacts ; Journal et `activityCalories` (échouait avant
  le branchement : 610 kcal au lieu de 300). `firstImport.test.js` : deux apps → « 1 séance ».

## Vérifications
- `npm run test` (2731 ✔), `npm run build`, `npm run lint` (6 erreurs, comme avant), `npm run visual -- --play`
  (Journal et Analyses relus : inchangés sur la démo, qui n'a qu'une source par séance).

## Données
- Aucune donnée modifiée ni effacée (choix à la lecture) ; export / import intacts.

## Demandes iOS
- Note « Nouveautés » marquée `"variants": ["play", "sideload"]` (montre Huawei + Health Connect : Android).

## Suite
- BACKLOG par impact ; POL-PLAY-11 (alpha + `shrinkResources`) quand Android vitals aura une journée sans plantage.
