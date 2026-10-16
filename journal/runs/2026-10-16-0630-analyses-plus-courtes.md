# 2026-10-16 06:30 Paris (04:30 UTC) — Nettoyage : Analyses plus courtes (D1)

**Type** : 🧹 D1  ·  **PR** : « [Auto] Nettoyage : Analyses plus courtes »

## Pourquoi
- Démarrage : main à `d3be657` (#179) ; « Tests » et émulateur A56 verts, v141 publiée. Aucune PR « [Auto »
  ouverte (`cursor/*` #51 hors routine, non touchée). Aucun nouveau journal dans `journal/diagnostics/`.
- 06:30 Paris = run normal → D1 en tête. Reste D1 noté au run précédent : « relire Analyses (intro « Vos habitudes »
  de 5 lignes, « Effets décalés » 6 lignes) ». Capture avant : l'onglet simple faisait **4 écrans**, dont ≈ 28 lignes
  d'explications avant / entre les résultats, et « une corrélation ne prouve pas une cause » répété 3 fois.

## Ce qui a été fait (`pages/Recommendations.jsx`)
- Intro de page : 3 lignes → 1 (« Ce qui va de pair avec votre bien-être dans vos données, calculé sur votre téléphone »).
- Onglet simple : bloc méthode (6 lignes) + bloc week-end (4 lignes) → une ligne « Analyse sur N jours notés · week-end
  pris en compte » + un repli **« Comment c'est calculé »** (`reco-method-note`, déjà stylé) qui réunit méthode
  (Pearson, autocorrélation, Benjamini-Hochberg, jours sans mesure), couverture alimentaire, week-end (moyennes),
  explication des tags, des effets décalés, et l'unique « une corrélation ne prouve pas une cause ».
- Indices de section ramenés à une ligne (Pistes, Vos habitudes, Effets décalés, et leurs états vides / en attente).
- Onglet avancé : la ligne de tête ne garde que jours + fiabilité (« ✓ généralise » / « ⚠ encore peu fiable ») ;
  méthode, R², variables retenues, surapprentissage, effet du week-end et variables redondantes passent dans
  « Comment fonctionne ce modèle ? » (désormais toujours présent, plus seulement en OLS). Indices d'une ligne.
- Mentions de bas de page : une ligne « Hypothèses tirées de vos seules données : pas un avis médical. »

### Retiré et pourquoi (D1)
| Retiré / replié | Pourquoi |
|---|---|
| Paragraphe d'intro de 3 lignes | Redit le titre ; « sur votre téléphone » tient en une proposition |
| Bloc méthode + bloc week-end visibles | Détail technique utile une fois → replié, l'info reste à un geste |
| Explications de 4–6 lignes sous Pistes / Habitudes / Effets décalés | Répétaient la méthode et l'avertissement ; 1 ligne chacune |
| « Corrélation ≠ cause » ×3, « hypothèses » ×4 | Une fois dans le repli + badges « Hypothèse … » sur chaque carte + pied de page |
| R², nb de variables, week-end en tête de l'onglet avancé | Jargon → dans « Comment fonctionne ce modèle ? » |

## Vérifications
- Vitest : **1290 ✅** (+3 : repli unique fermé avec méthode / tags / décalés / avertissement ; avertissement dit une
  seule fois et indices < 110 caractères ; onglet avancé : ligne de tête sans R², détails dans le repli). Un test
  existant suit le texte week-end vers le repli.
- Build ✅. Lint : **6 erreurs** (inchangé).
- `npm run visual` : 8 pages ok, aucune erreur JS ; Analyses **4 → 3 écrans**, relues `recommendations-1/2/3`.
  `--empty --routes=/recommendations` ok.

## Sécurité / vie privée / science
- Aucun calcul ni schéma modifié ; seul l'affichage change. L'incertitude reste visible sur chaque carte (badges
  « Hypothèse solide / à confirmer / incertaine ») et en pied de page ; renvoi « pas un avis médical » conservé.
- Remarque D6 : l'ancien indice de l'onglet avancé disait « dont l'effet estimé va dans le sens attendu » — le texte
  est retiré, mais le filtre correspondant dans `analysisEngine` (sens « attendu » d'un levier) reste à revoir en D6.

## Suite proposée
1. 🧭 D6 : revoir le filtre « sens attendu » des pistes du modèle avancé (`topRecommendations`) et `LEVER_ACTIONS`.
2. 🧹 D1 : « Voyage » déduit (I85 ②b) ; relire Repas (`food-*`).
3. ⚡ D2 : lecture `heart_rate` partagée / par sous-type pour l'Accueil.
4. 🔁 D5 : I84 (« Stress » ressenti côté Y) + `ESTIMATOR_INPUTS` et test anti-circularité.

## Livraison
- PR #180 : Vitest, Build APK, Protocole montre (Java), émulateurs A56 API 35 et 36 verts → fusionnée (squash),
  **v142 publiée avec son APK** (« Build & Release » vert).
