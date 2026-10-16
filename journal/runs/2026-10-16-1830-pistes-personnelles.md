# 2026-10-16 18:30 Paris (16:30 UTC) — Pistes personnelles : plus de piste cachée parce que contraire à la norme (D6)

**Type** : 🧭 D6  ·  **PR** : « [Auto] Pistes personnelles : vos données font foi, même contre la norme »

## Pourquoi
- Démarrage : main à `0c55e5a` (#186, v146 publiée avec son APK) ; « Tests », « Build & Release » et émulateur A56
  verts. Aucune PR « [Auto] » ouverte. Aucun nouveau journal dans `journal/diagnostics/`.
- 18:30 Paris = run normal. D1 a avancé 8 runs d'affilée, D5 au run précédent. D6 (« l'algorithme ne présuppose aucun
  sens d'effet ») avait un manquement concret noté le 16/10 06:30 : `leverAction()` **cachait** toute piste dont le
  signe personnel contredisait `VARIABLE_META.direction` (ex. : plus de pas ↔ moins bon bien-être → aucune piste ;
  écran tard ↔ meilleur bien-être → aucune piste). C'est exactement le cas que le propriétaire veut voir « tel quel ».
  Touchait les pistes simples, les effets décalés et les pistes du modèle avancé.

## Ce qui a été fait
- `services/analysisEngine.js` :
  - `leverSuggestion(variable, r)` remplace `leverAction` : suit le **signe du lien personnel** ; même sens que
    l'hypothèse générale → son action (« Marcher davantage ») ; sens contraire → formulation neutre générée
    (« Ne pas chercher à marcher davantage », exemples entre parenthèses retirés) avec `againstNorm: true` ;
  - exception documentée `NO_COUNTER_SUGGESTION` = alcool, cigarettes : jamais « ne pas chercher à boire / fumer
    moins » ; le lien reste affiché tel quel dans « Corrélations » (barres colorées par le signe, déjà neutres) ;
  - `LEVER_ACTIONS` : chaque action commence par un verbe (« Plus de vitamine C… » → « Manger plus de… ») pour que la
    phrase inverse se lise bien ; `direction` n'est plus qu'un a priori (hypothèse générale), plus un filtre ;
  - pistes simples (`levers`) et avancées (`buildAdvancedAdvice`) portent `againstNorm` / la mention.
- `services/laggedEffects.js` : effets « la veille » idem (`action`, `againstNorm`).
- `pages/Recommendations.jsx` : `AgainstNormNote` (« Contraire à l'hypothèse générale : chez vous, vos données font
  foi. ») sous la piste et sous l'effet décalé ; une phrase dans « Comment c'est calculé » (« Aucun comportement n'est
  jugé bon ou mauvais d'avance… »).
- Tests écrits avant le code (rouges puis verts) : `analysisEngine.test.js` (bloc `leverSuggestion — D6` : signe
  personnel, parenthèses, alcool / tabac, non actionnable, verbe initial ; piste « pas » contraire désormais montrée ;
  conseil avancé), `laggedEffects.test.js` (effet décalé contraire gardé), `Recommendations.test.jsx` (mention
  affichée seulement quand `againstNorm`).
- Données inchangées (calcul d'affichage seul).

### Retiré et pourquoi
| Retiré | Pourquoi |
|---|---|
| Filtre « sens attendu » de `leverAction` (pistes simples, décalées, avancées) | Imposait une norme (D6) : une réalité personnelle contraire était cachée |
| `leverAction` (remplacée par `leverSuggestion`) | Plus aucun appelant |

## Vérifications
- `npm run test` : **1299 tests verts** (101 fichiers). Lint : **6 erreurs** (inchangé). Build ✅.
- `npm run visual` (8 pages) ✅ ; regardés : `/recommendations` 1–2 (pistes « Dormir un peu plus longtemps »,
  « Marcher davantage », effet décalé « Bouger davantage » inchangés ; la démo ne produit pas de piste contraire, la
  mention est couverte par les tests).

## Suite
- D6 : autres messages normatifs à relire (Radar forme, prédiction, Nutrition « repères ») ; `direction` comme a priori
  faible chiffré (shrinkage) plutôt que simple étiquette.
- D5 : ordre temporel (pas **du jour** vs bien-être du jour dans les corrélations simples), garde-fous visibles I46.
- D4 : I88 (service visage + diagnostic).
- D1 : « Voyage » déduit ; Connecteurs et Analyses avancées.
