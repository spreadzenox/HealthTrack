# 2026-10-10 18:30 UTC — Tableau de bord plus direct

**Type** : 🎨 (UI / ergonomie)  ·  **PR** : #92 (fusionnée → v86)

## Pourquoi
Les 5 runs précédents étaient tous dans le moteur d'analyse (🐛 / 🏗️) : un run 🎨 était dû. Idées en vrac du backlog :
l'introduction du tableau de bord (« HealthTrack centralise… montre Samsung Fit 3 ») occupait le haut de l'écran même
avec des mois de données, et « Prédiction ML » est du jargon. La capture « avant » montrait aussi un grand cadre vide
« Par heure (aujourd'hui) — Aucune note » tant que le bien-être du jour n'est pas noté (le cas de la plupart des
ouvertures), et des repas sans kcal dans « Vos derniers jours » (item 4 des « Prochaines étapes »).

## Ce qui a été fait
- `Dashboard.jsx` : introduction affichée seulement une fois le chargement fini **et** sans aucune donnée (pas de
  saut de mise en page pendant le chargement) ; lignes de repas avec `≈ N kcal` (même `mealKcal` que la page Repas)
  et nom du plat (`payload.dish`) quand il existe.
- `WellbeingCharts.jsx` : « Prédiction du jour » (badge et légende du graphique) ; bloc « Par heure » masqué tant
  qu'aucune note du jour n'existe ; sous-titre de section adapté.
- 5 tests (3 tableau de bord, 2 graphiques) qui échouaient avant ; 1 test adapté (l'intro attend la fin du chargement).

## Vérifications
- Tests : 639 ✅ (634 avant) · Lint : 7 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : `npm run visual` (8 pages, démo) sans erreur JS ; tableau de bord avant/après relu — 4 écrans → 3, le
  Radar commence ~225 px plus haut (le contenu utile apparaît dès le premier écran) ; repas « Repas ≈ 479 kcal » ;
  `--empty` : l'introduction et le lien Connecteurs sont toujours là au premier lancement.

## Apprentissages / décisions
- Conditionner l'intro sur `!loading` évite qu'elle clignote puis disparaisse chez l'utilisateur qui a des données.
- Le nom du plat n'existe que pour les repas analysés par Gemini (photo / texte) ; la démo n'en a pas, d'où un test
  unitaire seulement.

## Suite proposée
- 🎨 Journal, étape 2 (reste) : poids + composition Withings fusionnés en une ligne, « Modifier » un repas depuis le
  journal, noms d'aliments Ciqual très longs (« Poulet, cuisse, viande bouillie/cuite à l'eau ») → nom court.
- 🎨 Rapprocher Radar et cartes cœur (deux blocs + deux paragraphes d'explication qui se répètent).
- 🏗️ Effets décalés (lags 0–3 j) dans les analyses (C3).
