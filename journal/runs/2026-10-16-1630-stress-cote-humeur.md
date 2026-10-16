# 2026-10-16 16:30 Paris (14:30 UTC) — Anti-circularité : entrées de l'humeur déclarées, « Stress » côté Y (D5, I92 + I84)

**Type** : 🧪 D5  ·  **PR** : « [Auto] Anti-circularité : entrées de l'humeur déclarées, Stress côté humeur »

## Pourquoi
- Démarrage : main à `7343c73` (#185, v145 publiée avec son APK) ; « Tests », « Build & Release » et émulateur A56
  verts. Aucune PR « [Auto] » ouverte. Aucun nouveau journal dans `journal/diagnostics/`.
- 16:30 Paris = run normal. D1 avance depuis 8 runs d'affilée ; le plan vérifié au run idées de 08:30 place **I92**
  (petit, D5) avant tout code D4 (visage). La règle anti-circularité est « non négociable » et n'avait encore **ni
  liste déclarée ni test** : c'est un trou de garde-fou, plus urgent qu'un nouvel écran à raccourcir.
- Constat : `services/moodEstimate.js` n'était plus importé par l'app (carte retirée le 12/10) mais gardait ses
  entrées comportementales (sommeil, pas, écran tard `higherIsBetter: false` = norme cachée, D6). Et le tag « Stress »
  (auto-déclaré, donc un morceau de Y) était comparé au bien-être dans « Vos habitudes » comme un facteur (I84).

## Ce qui a été fait
- `services/mood/estimatorInputs.js` (nouveau) : `ESTIMATOR_INPUTS = selfReport (colonne wellbeing, tag stress),
  face (préfixe face_), voice (préfixe voice_)` + `isEstimatorInput(name)`. Choix documenté : **réseaux sociaux =
  X** (expliquent l'humeur, ne servent pas à l'estimer) ; la capacité « émotion » d'une montre serait aussi un X.
- `services/mood/calibration.js` (nouveau) : Ridge + λ par LOO + garde-fou « ≥ 10 % mieux que la moyenne », extrait de
  l'ancien estimateur et rendu générique (colonnes de signaux directs), pour D4.
- `services/moodEstimate.js` + test **supprimés** (code mort à entrées comportementales).
- `behaviorTags.js` : `side: 'Y'` sur « Stress » ; `computeTagEffects` saute les tags côté Y (ni effet, ni « en cours
  de collecte »). Le tag reste proposé dans la saisie, lisible dans l'historique, et cause connue pour le Radar.
- `Recommendations.jsx` : une phrase dans « Comment c'est calculé » (« Le stress ressenti fait partie de votre
  humeur : il n'est pas présenté comme sa cause »).
- Tests écrits avant le code (rouges puis verts) : `mood/antiCircularity.test.js` (aucune clé de `VARIABLE_META` n'est
  une entrée de l'estimateur ; tags côté Y ⇔ tags d'entrée ; « Stress » absent des effets), `mood/calibration.test.js`,
  `Recommendations.test.jsx` (pas de carte Stress, phrase de méthode). Tests qui prenaient « stress » comme exemple de
  tag du jour même passés sur « Malade ».
- Données inchangées : les anciens tags « stress » restent stockés, exportés et importés.

### Retiré et pourquoi
| Retiré | Pourquoi |
|---|---|
| Carte « Stress » de « Vos habitudes » | Y comparé à Y : tautologique (D5) |
| `moodEstimate.js` (sommeil, VFC, FC repos, pas, écran tard comme entrées de l'humeur) | Entrées comportementales = cercle (D5) et « écran tard = mauvais » codé en dur (D6) ; plus affiché depuis le 12/10 |

## Vérifications
- `npm run test` : **1291 tests verts** (101 fichiers). Lint : **6 erreurs** (inchangé). Build ✅.
- `npm run visual` ✅ ; regardés : `/recommendations` 1–2 (plus de carte Stress, « Vos habitudes » intact).

## Suite
- D5 : revue des pièges (ordre temporel : pas **du jour** vs bien-être du jour dans les corrélations simples) ; garde-fous
  visibles I46.
- D6 : `VARIABLE_META.direction` / `LEVER_ACTIONS` (pistes formulées selon une norme — « Dormir un peu plus
  longtemps ») → formulations neutres et réalité personnelle.
- D4 : I88 (service visage + diagnostic) peut maintenant s'appuyer sur `ESTIMATOR_INPUTS` (préfixe `face_`) et
  `calibrateRidge`.
- D1 : « Voyage » déduit ; Connecteurs et Analyses avancées.
