# 2026-10-10 06:30 UTC — Analyses : contrôle du week-end

**Type** : 🏗️  ·  **PR** : #NN (voir plus bas)

## Pourquoi
1er item des « Prochaines étapes » (C3, R#25) et recommandation de la veille du 10/10 §C : le bien-être varie
avec le jour de la semaine (étude BMJ Mental Health 2025), et beaucoup de comportements aussi (sommeil plus long,
pas en plus ou en moins le samedi). Sans contrôle, un levier peut récupérer l'effet du week-end (« marcher
davantage » alors que c'est juste samedi). Derniers runs : 🐛, 🏗️, 🔭, 🎨, 🐛 → un 🏗️ est bienvenu.

## Ce qui a été fait
- `statistics.js` : `isWeekendKey(dateKey)` et `residualizeByGroup(values, groups)` (centrage par groupe → corrélation
  partielle contrôlant une covariable binaire).
- `analysisEngine.js`
  - `weekendControl(rows)` : drapeaux week-end, nb de jours de chaque, bien-être moyen week-end / semaine ; appliqué si
    ≥ `MIN_WEEKEND_DAYS` = 3 jours de chaque.
  - Recommandations basiques : `r` = corrélation partielle (bien-être et variable centrés par groupe), `rRaw` conservé,
    n effectif calculé sur les séries centrées, p-valeur avec 1 ddl de moins. Résultat : `weekendControl`.
  - Modèle avancé : pré-sélection des variables sur corrélations partielles ; variable `isWeekend` ajoutée en
    **contrôle forcé, non pénalisée par Ridge** (comme l'intercept : `olsNormalEquations`, `ridgeLooPredictions`,
    `tuneRidge` prennent un nombre de colonnes non pénalisées). Exclue de l'importance et des pistes ;
    `modelInfo.weekendEffect` = écart de bien-être week-end − semaine à habitudes égales. Hold-out et prédiction du
    jour utilisent le même drapeau.
- `Recommendations.jsx` : note « 📅 Liens calculés en tenant compte du week-end (bien-être moyen : X le week-end,
  Y en semaine) » ou « pas encore assez de jours de week-end » ; sur une piste, « r = … sans tenir compte du
  week-end » si l'écart ≥ 0,1 ; onglet avancé : « +0,4 point le week-end » (ou « pas différent ») + paragraphe
  dans « Comment fonctionne ce modèle ? ».
- Démo : +0,4 point de bien-être le week-end (effet modeste, comme dans la littérature).

## Vérifications
- Tests : 603 ✅ (588 avant ; +3 statistiques, +8 moteur, +4 page) · Lint : 7 erreurs, 1 warning (inchangé) · Build ✅
- Tests clés : sur des données où bien-être ET pas montent le week-end sans lien à l'intérieur des groupes, r brut
  des pas > 0,8 mais r partiel < 0,4 et « Marcher davantage » n'est plus proposé (basique et avancé) ; un vrai effet
  des pas à l'intérieur de la semaine reste détecté.
- Démo (3 graines) : pistes inchangées, r du sommeil/pas légèrement renforcés (le week-end de la démo a moins de
  pas mais plus de bien-être, ce qui masquait un peu l'effet) ; R² LOO −0,01 (coût d'un paramètre) ; effet
  week-end estimé +0,4 = exactement l'effet simulé.
- Visuel : `/recommendations` (onglets basique et avancé, démo) et `--empty` (/, /recommendations) sans erreur JS,
  notes lisibles, pas de débordement. Toutes les pages (démo) ok.

## Apprentissages / décisions
- Un contrôle ne doit pas être pénalisé par Ridge : pénalisé, l'effet week-end (1,5 point simulé) était estimé à
  0,59 et le reste partait sur les pas (variable corrélée).
- Corrélation partielle par centrage de groupe plutôt qu'une régression par variable : identique pour une covariable
  binaire, plus simple et testable.
- « Vos habitudes » (tags) n'est pas encore contrôlé : l'alcool, plus fréquent le week-end, est le premier
  candidat à un effet confondu → étape 2.

## Suite proposée
- 🏗️ Week-end dans « Vos habitudes » (comparaison avec/sans stratifiée par type de jour).
- 🏗️ Effets décalés (lags 0–3 j) sur sommeil / activité.
- 🐛 Formulaires (heure `datetime-local` sur l'A56, modifier une note de bien-être).
