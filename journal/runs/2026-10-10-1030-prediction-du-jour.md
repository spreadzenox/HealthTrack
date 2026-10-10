# 2026-10-10 10:30 UTC — La prédiction du jour ne tombe plus à 0 le matin

**Type** : 🐛  ·  **PR** : #88

## Pourquoi
Derniers runs : 🔭, 🏗️, 🐛, 🏗️, 🏗️ → chasse aux bugs avec vérification visuelle. Sur la première capture du
tableau de bord (démo, 10/10 au matin), le badge « Prédiction ML aujourd'hui » affichait **0,0 / 5** et la courbe
plongeait à 0, alors que les 14 derniers jours tournaient autour de 2–3.

## Cause
`_predictToday` construit la ligne d'aujourd'hui comme une journée terminée : `todayRow[k] ?? 0`. Le matin, pas = 0,
dépense = 0, FC au repos / VFC pas encore mesurées = 0, aucun repas → apport lissé tiré vers le bas. Avec des
z-scores de −3 à −10, la prédiction sort de [0, 5] et est écrêtée à 0. Le bug touchait tout utilisateur avant le soir.

## Ce qui a été fait
- `analysisEngine.js`
  - `CUMULATIVE_TODAY_KEYS` (pas, dépense, calories HC, cigarettes, nb repas, FODMAP) : valeur = max(déjà fait,
    moyenne d'entraînement) — un total du jour ne peut que monter d'ici minuit.
  - `MEASURED_TODAY_KEYS` (sommeil, FC repos, FC moyenne, VFC, SpO₂) : pas encore mesuré → moyenne (z = 0).
  - `buildTodayRow` : l'apport brut du jour, pour le lissage nutritionnel, vaut au moins la moyenne pondérée des jours
    précédents (sinon un petit-déjeuner pas encore saisi = jeûne).
  - Le résultat expose `assumedTypical` (variables complétées).
- `WellbeingCharts.jsx` : mention sous le badge quand des valeurs sont complétées (« compte comme une journée
  habituelle. Une estimation, pas une mesure. »).

## Vérifications
- Tests : 616 ✅ (609 avant ; +4 prédiction journée incomplète, +1 apport lissé sans repas du jour, +2 composant) —
  les 5 tests moteur échouent sans le correctif (0 au lieu de ~2,5). Lint : 7 erreurs, 1 warning (inchangé). Build ✅
- Visuel : tableau de bord démo : 0,0 → **2,3 / 5**, point orange dans la continuité de la courbe, mention lisible sur
  2 lignes, pas de débordement. `--empty` : toutes pages ok. `--light` : pas encore de thème clair (connu, backlog C1).
  Autres pages (Repas, Nutrition, Analyses) relues : rien d'anormal (Nutrition alerte à juste titre sur les repas
  manquants de la démo).

## Apprentissages / décisions
- Imputer par la moyenne (z = 0) plutôt que proratiser selon l'heure : proratiser suppose un rythme de journée qu'on
  ne connaît pas ; « journée habituelle » est neutre et honnête, et max(déjà fait, moyenne) garde l'information quand
  la journée est déjà au-dessus de l'habitude.
- Même famille de bug à l'entraînement : un jour sans mesure de FC repos vaut 0 dans `buildDailyDataset`. Non corrigé
  ici (change les analyses, mérite son propre run) → backlog, priorité 2.

## Suite proposée
- 🐛 Valeurs manquantes à l'entraînement (montre non portée = 0).
- 🏗️ Effets décalés (lags 0–3 j) sur sommeil / activité (C3).
- 🐛 Formulaires : heure `datetime-local` sur l'A56, modifier une note de bien-être.
