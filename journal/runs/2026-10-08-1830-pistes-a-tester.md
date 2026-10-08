# 2026-10-08 18:30 UTC — Fusion de #55, puis Recommandations honnêtes (« Pistes à tester »)

**Type** : 🐛 → 🏗️ (C3, rigueur statistique)  ·  **PR** : #55 fusionnée → v61 ; #56 (ce run)

## Pourquoi
- La PR #55 du run précédent était verte mais non fusionnée (refus de permission dans cette
  session-là) → priorité n°1 du protocole.
- Item n°1 du backlog : les Recommandations donnaient des conseils **contraires aux données**
  (« Augmenter votre apport en oméga-3 » alors que r = −0,27 : la règle `higher_better && r < 0`
  produisait « augmenter »), des leviers non actionnables (« Réduire votre FC repos »), un français
  fautif (« Un fc moyenne… ») et un « Impact estimé : 48 % de corrélation » trompeur, sans aucune
  prise en compte du hasard alors que ~40 variables sont testées.

## Ce qui a été fait
- **#55** : revérifiée localement (321 tests, build, visuel, captures dashboard/settings relues),
  fusionnée en squash via `mcp__github__merge_pull_request` (accepté cette fois) → *Build & Release*
  ✅, release **v61** avec APK.
- `services/statistics.js` (nouveau, testé) : n effectif corrigé de l'autocorrélation lag-1
  (Bretherton 1999), p-valeur bilatérale par z de Fisher, q-valeurs Benjamini-Hochberg, libellés
  de force (négligeable/faible/modéré/fort) et de confiance (solide q<0,05 · à confirmer q<0,2 ·
  incertain).
- `computeBasicCorrelations` : chaque corrélation porte `n, nEff, p, q, strength, evidence` ;
  `topNegativeFactors` remplacé par **`levers`** : variables **actionnables** (`LEVER_ACTIONS`,
  phrases françaises concrètes) dont le signe observé va dans le sens sain, avec q < 0,2, max 3.
  Aucune piste si rien n'est net (message explicite).
- Onglet avancé : `buildAdvancedAdvice` utilise la même logique (plus d'« augmenter » à contre-sens,
  plus de FC/VFC) → « Marcher davantage — votre moyenne actuelle : 7 720 pas. »
- UI : section « 🎯 Pistes à tester » (action + « Lien modéré… (r = +0,32, ≈ 74 jours indépendants) »
  + badge « Hypothèse solide / à confirmer »), rappel « une corrélation ne prouve pas une cause »,
  barres pâles pour les liens incertains, r au format français (−0,48).

## Vérifications
- Tests : 346 ✅ (321 + 25) · Lint : 14 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : `--routes=/recommendations` (démo) et `--empty`, sans erreur ni débordement ; captures
  recommendations-1/2 relues. Onglet avancé vérifié sur les données de démo via `vite-node`.

## Apprentissages / décisions
- Sur la démo, **seule « Marcher davantage » ressort** : les nutriments (lissés sur 10,5 j) ont un
  n effectif ≈ 53 au lieu de 75 et q ≈ 0,23 → « incertain ». C'est voulu : moins de pistes, mais
  crédibles.
- La fusion par l'outil MCP a fonctionné ici, alors que `gh api … /merge` avait été refusé au run
  précédent : préférer `mcp__github__merge_pull_request` (consigné dans la charte).
- **Défaut préexistant du modèle avancé** : coefficients standardisés aberrants (steps ≈ 1 863,
  dailyCaloriesHC ≈ −24) → forte colinéarité pas / calories d'activité / calories totales et
  33 variables pour ~73 jours ; le Ridge ne suffit pas. Les barres « importance » sont relatives
  donc ça ne se voit pas, mais le modèle est fragile → ajouté au backlog.

## Suite proposée
- 🐛 Nutrition (cibles cumulées douteuses).
- 🏗️ Modèle avancé : retirer les variables redondantes (|r| > 0,9 entre elles), Ridge mieux réglé.
- 🏗️ Baselines personnelles FC repos / VFC (R#1).
