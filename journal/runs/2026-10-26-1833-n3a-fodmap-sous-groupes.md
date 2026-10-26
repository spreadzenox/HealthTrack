# Run du 26/10/2026 18:33 (Paris, CET) — N3a : FODMAP par sous-groupe (calcul)

**Type** : 🏗️ code (priorité du propriétaire du 26/10 14:45 : FODMAP par sous-groupe)

## Constat au démarrage
- Main à `4ac3cbc` (#399, N2), CI de main verte (Build & Release, Play — AAB, Relais, émulateur).
- PR #398 « [Auto] P28 » : poussée à 17:31 UTC par un autre run encore actif (checks en cours) → pas touchée ; ses
  fichiers (`.github/…`, scripts P28) sont indépendants de ce run. Seul `journal/` est commun (ajouts à des endroits
  différents).

## Ce qui a été fait
- `app/src/services/fodmapGroups.js` (pur) :
  - `fodmapPer100g(food, published)` : six sous-groupes aux mêmes id que la réintroduction (`fructans`, `gos`,
    `fructose`, `lactose`, `sorbitol`, `mannitol`) ; lactose Ciqual ; fructose en excès = fructose − glucose
    (≥ 0 ; `approché` si le glucose est « < x ») ; polyols totaux nuls ⇒ sorbitol et mannitol nuls ; « < x » ou
    « traces » = 0 avec le statut `traces` (la moitié de la limite, utile aux totaux nutritionnels, mettrait 0,25 g de
    lactose dans l'oignon) ; fructanes / GOS / sorbitol / mannitol pris dans les mesures publiées seulement, jamais à
    la place d'une valeur Ciqual ; analogie = confiance basse.
  - `estimateMealFodmap(items, table, measurements)` : grammes par groupe, aliments contributeurs triés, aliments
    inconnus, niveau `élevé` (≥ repère, même si d'autres aliments sont inconnus) / `bas` (tous connus et sous le repère)
    / `inconnu` ; polyols totaux connus sous 0,4 g ⇒ sorbitol et mannitol `bas` ; mesures cherchées aussi sous
    `alias_of`.
  - `highFodmapGroups` : groupes élevés triés par rapport au repère.
  - Repères de départ par portion : Varney J et al., J Gastroenterol Hepatol 2017;32 Suppl 1:53-61 (PMID 28244665) —
    oligosaccharides 0,3 g (appliqué aux fructanes et aux GOS séparément), fructose en excès 0,15 g, lactose 1 g,
    polyols 0,4 g. Hypothèses de départ (règle 6), documentées dans le module.
- `app/src/data/fodmapMeasurements.json` : schéma vide (sources, foods, confiance), à remplir en N3b.
- Couverture Ciqual de la table livrée : lactose connu pour 1 739 / 3 553 aliments, fructose + glucose 1 883,
  polyols connus 3 094 (dont 377 > 0).
- Rien d'affiché, aucune donnée ni appel réseau nouveau (Sécurité des données inchangée), pas d'entrée « Nouveautés ».

## Tests
- `fodmapGroups.test.js` (19) : valeurs Ciqual, traces, excès jamais négatif, approché, polyols nuls, mesures publiées
  et analogie, priorité de Ciqual, repas (élevé / bas / inconnu), alias, tri, mêmes groupes que la réintroduction,
  table livrée (125 ml de lait demi-écrémé → lactose élevé ; poire 150 g → fructose élevé), intégrité du fichier de
  mesures (aliment existant, source déclarée, confiance valide).

## Vérifications
- `npm run test` : **2 448** verts (+ 33 sautés) ; `npm run build` OK ; lint 6 erreurs (inchangé) ; `npm run visual` :
  0 erreur JS, Accueil relu (inchangé).

## Suite
- **N3b** : mesures publiées (fructanes, GOS, sorbitol, mannitol) vérifiées dans les articles, citées par aliment.
- **N4** : carte d'un repas « riche en lactose : lait » (simple d'abord), avec `estimateMealFodmap`.
- **N2b** : inconnu ≠ 0 dans les totaux nutritionnels.
