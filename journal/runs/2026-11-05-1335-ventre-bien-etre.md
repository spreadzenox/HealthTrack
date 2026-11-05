# 05/11 13:35 — Le ventre ajuste le bien-être (VENTRE-BE-2, I220 OUI)

Type : 🧠 run de code (13:35 Paris). Priorité : retours du 04/11, point (3), I220 accepté par le propriétaire le 05/11.

## Constat au démarrage
- main vert (`48ec0bd`) ; « Play — Alpha (livraison continue) » vert sur `816d3f7` et `48ec0bd` (v510 envoyée sur
  Alpha, en examen chez Google). Aucune PR « [Auto] » ouverte, aucun autre run actif.
- Sonde : le ventre (`gut`, `stool`) n'était déjà ni une colonne de `buildDailyDataset`, ni un facteur de
  `VARIABLE_META`, ni un tag. Il manquait la moitié « le ressenti du ventre ajuste le bien-être » et le verrou de test.

## Fait (branche `claude/auto-ventre-be-2`)
- `services/mood/gutSelfReport.js` : `gutLevelsByDay` (note la plus forte du jour, gêne < douleur) et `gutAdjust` :
  la note du jour fait un pas de 20 % vers 2 / 5 (gêne) ou 1 / 5 (douleur), vers le bas seulement ; « calme » ne
  compte pas. Exemple : visage 3,5 et douleur → 3,0.
- Branché partout où la note du jour existe : `faceMoodEstimate` (`day.gut`, `signals: ['visage', 'ventre']`, phrase
  de confiance), `faceMoodDays` (série Y des Analyses), `wellbeingHistory` (points jour, `detail.gut`).
  `loadFaceMoodEntries` lit aussi les notes du ventre depuis la première lecture du visage.
- `estimatorInputs.js` : entrée `gutSelfReport` (colonne `gut`, préfixe `gut_`).
- UI : puce pêche « douleur au ventre comptée » dans les détails de la carte Bien-être ; ligne pêche « Douleur au
  ventre notée ce jour-là : la note baisse de 0,5. » dans le détail d'un jour de l'historique et de Tendances.
- Les lectures une à une (vue « Jour ») restent brutes : le ventre ne joue que sur la note du jour.

## Vérifications
- TDD : `gutSelfReport.test.js` (6 tests, 3 rouges avant le branchement) ; règle 5 étendue dans
  `antiCircularity.test.js` (aucune colonne, aucun lien, tag ni effet décalé du bien-être, notes ou visage, ne parle
  du ventre ou des selles) ; `faceMoodData.test.js`, `MoodEstimateCard.test.jsx`, `WellbeingHistory.test.jsx`.
- `npm run test` : 3 099 verts ; lint 0 erreur ; build OK ; `npm run visual` sans erreur, captures Accueil et
  historique relues (inchangées à l'œil sur la démo : la puce n'apparaît que dans les détails un jour noté gêne ou
  douleur).

## Après le merge
- Voir la fin de ce fichier (complété avant le merge si le temps manque : PR ouverte sinon).

## Suite
- Retours du 04/11 restants : (7) selles en photo (SELLES-PHOTO, étude I221 prête), (5) suite de la calibration,
  ANALYSES-ONGLETS-5.
