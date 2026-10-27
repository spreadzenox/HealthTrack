# Run du 27/10/2026 05:33 (Paris, CET) — N3c : `fodmap_score` calculé depuis les sous-groupes

**Type** : 🏗️ code (priorité du propriétaire du 26/10 14:45 : « remplace le score générique » ; reste de N3b-2)

## Constat au démarrage
- Main à `8fd9957` (#416, v307 vert). PR #417 (journal du merge N6b, checks requis verts) mergée en ouverture →
  `237f731`. Aucun « Build & Release » en cours.
- Le moteur d'analyse du bien-être (`analysisEngine.js`) lisait encore le `fodmap_score` 0–3 **de la table**,
  recopié de l'ancienne table inventée en avril 2026 (seul champ non issu de Ciqual qui restait).

## Ce qui a été fait
- `computeTotalsFromItems` (nutritionKPIs.js) : `fodmap_groups` = sous-groupes au-dessus du repère de départ
  (`estimateMealFodmap` + `highFodmapGroups`, mêmes règles que la carte d'un repas et les pistes du ventre) et
  `fodmap_score` = leur nombre (0–6). La clé garde son nom (données du moteur, caches, tests) ; les anciens exports
  ne contiennent pas ce champ (calculé à la volée), rien à migrer.
- `analysisEngine.js` : libellé « Groupes FODMAP au-dessus du repère (repas le plus chargé) », format « Aucun /
  1 groupe / N groupes », action « Manger des repas qui cumulent moins de groupes FODMAP » ; le jour garde toujours
  le repas le plus chargé.
- `ingredientsNutrition.json` : champ `fodmap_score` retiré des 3 553 aliments (plus lu nulle part) ;
  `build-ciqual-table.mjs` ne le recopie plus (`keepFields: []`). Table 2,08 Mo.
- Pourquoi un seul facteur dans le moteur du bien-être (et pas six) : six variables de plus coûteraient de la
  puissance à toutes les autres pistes du bien-être ; l'isolement par sous-groupe est fait là où il sert, dans les
  pistes du ventre (`fodmap:<groupe>`, N5), la carte d'un repas (N4) et le rapport PDF (N6).

## Bilan chiffré (portion de 100 g, 3 553 aliments)
- Ancien score ≥ 2 (« modéré » ou « élevé ») : **1 104** aliments ; nouveau calcul, au moins un groupe au-dessus du
  repère : **600**.
- 414 aliments notés 3 avant n'ont aucun groupe au-dessus du repère maintenant : surtout des produits transformés
  (barres céréalières, bases de pizza, biscuits) dont les **fructanes du blé ne sont pas mesurés** → « inconnu », jamais
  compté comme présent (règle « jamais inventé »). 38 aliments notés 0 avant ont un groupe au-dessus (mesures Ciqual).

## Tests
- `nutritionKPIs.test.js` : lait 250 ml → `['lactose']` ; oignon + lait → fructanes et lactose ; 15 ml de lait → 0 ;
  abat → 0.
- `analysisEngine.test.js` : libellé et format ; jour avec deux repas → le plus chargé (2), autre jour 1.

## Vérifications
- `npm run test` : **2 517** verts (+ 44 sautés) ; `npm run build` OK ; lint 6 erreurs (inchangé).
- `npm run visual` : toutes les pages « ok », 0 erreur JS ; Analyses regardé (clair) : inchangé sur les données de
  démo (aucun lien FODMAP repéré par le moteur du bien-être).

## Suite
- N6c (partage du PDF sur l'émulateur) ; la ligne FODMAP sur le résultat d'une analyse photo avant enregistrement
  (reste de N4) ; puis M6 / suite.

## Après le merge (PR #418 → `0e989b3`)
- Checks de la PR verts (Vitest, Build APK, Budget de lectures, relais, protocole montre, Publier l'APK).
- Sur main : « Build & Release » vert, **v308**, APK sideload de 34 892 193 octets (−15 Ko : champ retiré de la
  table) ; « Play — AAB » vert.
