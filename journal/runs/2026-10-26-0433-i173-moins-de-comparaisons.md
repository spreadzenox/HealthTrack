# Run du 26/10/2026 04:33 (Paris, CET) — I173 : plus de puissance avec moins de comparaisons

**Type** : 🏗️ jalon 5 (rien de visible à l'écran : pas d'entrée « Nouveautés »)

## Constat au démarrage
- Main à `4c2b7c1` (#386) ; Build & Release, Play — AAB, Tests, émulateur verts. Aucune PR « [Auto] » ouverte
  (#51 `cursor/*` non touchée). Suite prévue : la puissance des pistes repas → ventre (« moins de comparaisons »).

## Mesure d'abord
- Simulateur : option `extraFoods` (longue traîne d'aliments rares, de 1 repas sur 6 à 1 sur 60), tirée après les
  dix aliments de base : les journaux existants ne changent pas.
- Référence (bilans du soir, 13 semaines, effet ×4 le jour même, 200 jeux) : +20 aliments 42/200, +40 : 50/200
  (~38 et 56 comparaisons). Plafonds essayés : 5 et 8 aliments écartent trop souvent l'aliment en cause (pas de
  gain) ; **12** : 51 et 64/200 (l'aliment en cause reste testé 196 et 175 fois sur 200), nulles 5 et 0/200.

## Ce qui a été fait
- `gutWindows.js` : `MAX_TESTED_FOODS = 12`, `selectTestedFactors` (FODMAP toujours, puis les aliments les mieux
  répartis : min(jours avec, jours sans) ; ne regarde jamais le ventre, donc ne peut pas fabriquer de piste),
  `correctUnique` / `settleTwins` : deux aliments à l'exposition identique (toujours mangés ensemble) ne comptent
  qu'une comparaison dans Benjamini-Hochberg et partagent q, u et statut. Utilisés par `analyzeGutWindows` et
  `analyzeGutDays`. `gutLinks` les regroupait déjà à l'affichage : inchangé.

## Tests
- `gutDays.test.js` (+3) : sélection, plafond avec 30 aliments rares, jumeaux = une comparaison et même verdict.
  `gutWindows.test.js` (+1) : jumeaux par fenêtre. Banc `gutDays.calibration` : ligne I173 mesurée.

## Vérifications
- `npm run test` : 186 fichiers, 2 280 verts (+ 33 sautés) ; bancs `GUT_CALIBRATION=1` (100 jeux) : tous passent,
  au plus 5/100 jeux nuls avec une piste ; `npm run build` OK ; lint 6 erreurs (inchangé) ; `npm run visual
  -- --gut-links` : 0 erreur JS ; `/recommendations` montre la même piste regroupée, « 12 comparaisons » au lieu de
  davantage (les trois aliments du petit-déjeuner de démo ne comptent plus qu'une fois).

## Suite
- I134 (covariables sommeil / stress / écran) ; I171 c avec I135 ; POL-1d attend P28.
