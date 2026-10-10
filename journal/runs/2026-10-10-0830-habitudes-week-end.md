# 2026-10-10 08:30 UTC — Vos habitudes : comparaison stratifiée week-end / semaine

**Type** : 🏗️  ·  **PR** : voir tableau du résumé

## Pourquoi
1er item des « Prochaines étapes » (C3, R#25 étape 2), annoncé par le run 06:30 : « Vos habitudes » (tags)
comparait les jours avec / sans sans tenir compte du week-end. Or l'alcool est surtout pris le vendredi / samedi
et mesuré le lendemain (un jour de week-end, où le bien-être est plus haut) : l'effet réel est masqué, ou un faux
effet apparaît. Derniers runs : 🐛, 🏗️, 🔭/🎨, 🐛, 🏗️ — ce run termine le chantier week-end avant de passer à autre chose.

## Ce qui a été fait
- `behaviorTags.js`
  - Strates = type du **jour où le bien-être est mesuré** (lendemain pour les tags du soir) : week-end / semaine.
  - `diff` = moyenne pondérée des écarts intra-strate (poids n_avec·n_sans / n, comme Cochran-Mantel-Haenszel) ;
    `diffRaw` = écart brut (cohérent avec `meanWith` / `meanWithout`, toujours affichés).
  - `stratifiedPermutationPValue(strata)` : permutation des étiquettes **dans** chaque strate ; `permutationPValue`
    devient le cas à une strate (même tirage, mêmes p-valeurs qu'avant pour une strate).
  - Aucune strate avec des jours avec ET sans → tag en `pending` avec `weekendOnly: true` (pas d'effet affiché).
  - Tri, couleur, BH et niveau de confiance portent sur l'écart contrôlé.
- `Recommendations.jsx` : ligne « 📅 Week-end comparé au week-end, semaine à la semaine : −0,8 point » quand
  |contrôlé − brut| ≥ 0,1 ; phrase d'explication dans l'en-tête de section ; libellé « pas encore comparable » en
  collecte.
- Démo : l'alcool tombe surtout le vendredi / samedi (60 % vs 10 %), comme dans la vraie vie → la capture montre le cas.

## Vérifications
- Tests : 609 ✅ (603 avant ; +2 permutation stratifiée, +3 contrôle week-end, +1 page) · Lint : 7 erreurs, 1 warning
  (inchangé) · Build ✅
- Tests clés : alcool sans effet mais surtout avant le week-end → brut > +0,8, contrôlé ≈ 0, p > 0,3 ; vrai effet
  −1 masqué par le bonus week-end (+1,5) → brut > 0, contrôlé = −1, p < 0,01 ; alcool uniquement ven./sam. → en
  collecte, aucune carte.
- Visuel : `/recommendations` (démo) : carte Alcool « −0,6 point » brut puis « −0,8 point » à type de jour égal, autres
  cartes inchangées, pas de débordement ; `--empty` ok ; toutes les pages (démo) sans erreur JS.

## Apprentissages / décisions
- Stratifier (comparer samedi à samedi) plutôt que régresser : simple, exact pour une covariable binaire, et le test
  de permutation reste valide en ne permutant que dans les strates.
- Les moyennes « avec / sans » affichées restent brutes (sinon elles ne seraient plus des moyennes de vrais jours) ;
  l'écart contrôlé est affiché à part seulement quand il diffère.

## Suite proposée
- 🏗️ Effets décalés (lags 0–3 j) sur sommeil / activité (C3).
- 🐛 Formulaires : heure `datetime-local` sur l'A56, modifier une note de bien-être ; captures émulateur réelles.
- 🏗️ Tags comme leviers dans « Pistes à tester » (C4, tags étape 2).
