# 2026-10-10 16:30 UTC — Analyses : jour sans repas saisi ≠ jeûne

**Type** : 🐛 (moteur d'analyse)  ·  **PR** : #PR (voir ci-dessous)

## Pourquoi
Item n° 2 des « Prochaines étapes », suite logique du run 12:30 (mesure absente ≠ 0). Dans `buildLaggedDataset`, un
jour avec bien-être mais **sans repas saisi** valait 0 pour tous les nutriments et entrait dans le lissage 10,5 j des
jours suivants avec son poids plein. Or les repas s'oublient surtout les mauvais jours (fatigue, stress) : le moteur
fabriquait des liens alimentation ↔ bien-être. Même biais pour `fodmap_score` (0 ce jour-là) et `mealCount`.

## Ce qui a été fait
- `analysisEngine.js` :
  - lissage nutritionnel : seuls les jours avec ≥ 1 repas entrent dans la moyenne pondérée ; aucun repas dans la
    fenêtre → nutriments `null` (inconnus) ; `fodmap_score` et `mealCount` `null` le jour même sans repas ;
  - `fillMissing` (modèle avancé) remplit aussi les nutriments inconnus par la moyenne d'entraînement ; la règle de
    couverture ≥ 50 % s'applique donc aussi à l'alimentation ;
  - prédiction du jour : la moyenne des jours précédents ignore les jours sans repas ; rien ni avant ni aujourd'hui →
    inconnu (→ « journée habituelle ») au lieu de 0 ;
  - `isConstant()` remplace `every(v === 0)` : une série constante au bruit flottant près (même repas tous les jours,
    lissé) ne produit plus une « corrélation » de bruit (r ≈ −0,1 observé dans le test) ;
  - `nutritionDays` dans le résultat basique.
- `Recommendations.jsx` : quand des jours n'ont pas d'alimentation connue, « Alimentation connue sur N jours sur M :
  un jour sans repas saisi ne compte pas comme 0 kcal… ».
- Démo : repas non saisis ~1 jour sur 9 (35 % après une nuit < 6 h 30, RNG séparé, jamais les 4 derniers jours).
- 9 tests (7 moteur, 2 page) — les 6 tests du moteur qui portent sur le comportement échouent sur `origin/main`.

## Mesure sur la démo (même jeu de données, ancien vs nouveau moteur)
| | Avant | Après |
|---|---|---|
| Nutriments non « incertains » (basique) | 1 (FODMAP r = +0,27 « à confirmer », artefact) | 0 |
| Modèle avancé R² LOO | 0,37 | 0,44 |
| Pistes avancées | sommeil, pas | sommeil, pas, **cigarettes** (effet simulé réel) |
| Coefficient sommeil | 0,23 | 0,42 |

## Vérifications
- Tests : 634 ✅ (624 avant) · Lint : 7 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : `npm run visual` (toutes pages, démo) sans erreur JS ; Analyses basiques et avancées, Nutrition (« 5 jours
  saisis » sur 7, alerte de saisie incomplète cohérente), tableau de bord (prédiction 2,4 / 5) relus. La mention de
  couverture n'apparaît pas sur la démo (les oublis isolés restent couverts par la fenêtre de 10 j) : testée en unitaire.

## Apprentissages / décisions
- « Absent ≠ 0 » vaut aussi pour les **saisies manuelles** : un compteur de saisie (repas) ne dit rien les jours où
  rien n'est saisi. Les cigarettes restent un compteur (0 est plausible et c'est l'objectif) — à surveiller si
  l'utilisateur ne les saisit pas tous les jours.
- Le jeu de données d'analyse ne contient que les jours avec bien-être : les repas d'un jour sans note de bien-être
  n'entrent pas dans le lissage des jours suivants. À corriger plus tard (construire la fenêtre sur tous les jours).
- Modèle avancé sur la démo : « FC repos » sort avec un coefficient positif (colinéaire avec le sommeil, pas encore
  doublon à |r| > 0,9) — préexistant, à garder en tête pour l'IC bootstrap (stabilité du signe).

## Suite proposée
- 🏗️ Effets décalés (lags 0–3 j) sur sommeil / activité / tags (C3).
- 🏗️ Lissage nutritionnel sur tous les jours avec repas (pas seulement ceux avec bien-être).
- 🎨 Introduction du tableau de bord trop longue quand des données existent ; « Prédiction ML » → « Prédiction du jour ».
