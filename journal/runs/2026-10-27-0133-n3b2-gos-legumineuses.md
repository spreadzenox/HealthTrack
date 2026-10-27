# Run du 27/10/2026 01:33 (Paris, CET) — N3b-2 : GOS des légumineuses cuites

**Type** : 🏗️ code (priorité du propriétaire du 26/10 14:45 : FODMAP par sous-groupe ; P28 attend le propriétaire)

## Constat au démarrage
- Main à `8b59687` (#409), vert (v303). Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`).

## Ce qui a été fait
- `scripts/nutrition/legumeGos.mjs` (nouveau, reproductible) : relit l'eau (constituant 400) dans le `compo_*.xml` de
  Ciqual 2025 (Zenodo, md5 vérifiés : alim `8e1171d6…`, compo `2da72558…`, const `d8f2f25f…`) et calcule les GOS
  (raffinose + stachyose) de 13 légumineuses cuites depuis la mesure à sec de **Siva et al. 2019** (Front. Nutr. 6:38,
  CC BY, **tableau 5** relu dans l'article le 27/10 : moyennes à 10 % d'humidité, lentilles 496 + 2 292 mg, haricots
  662 + 2 218, pois chiches 441 + 1 533 ; méthode HPAE-PAD) :
  `GOS_cuit = Σ (sucre × (1 − perte à la cuisson)) × (100 − eau Ciqual du cuit) / 90 × (1 − perte au trempage)`,
  pertes de Njoumi 2019 (cuisson −32 % raffinose, −25 % stachyose ; trempage −10 % lentille, −40 % pois chiche ;
  haricots non mesurés → 10 %, la plus faible, estimation plutôt haute, dit dans `notes`). Correction de la règle 3
  d'I178 : la base sèche de Siva est à 10 % d'humidité, pas l'eau Ciqual du sec. Verbascose notée, non comptée.
  Conserves : même calcul, note « jus d'égouttage non chiffré, sans doute plus bas ». Tout en `analogie` (confiance
  basse) avec un objet `derivation` (sec, eau, pertes, code Ciqual) qui permet de recalculer chaque valeur.
- Résultats (g/100 g) : lentilles cuites 0,69–0,72 ; pois chiches cuits 0,37, en conserve 0,27 ; haricots blancs /
  rouges / flageolets cuits 0,70–0,74, en conserve 0,57–0,66. 150 g de lentilles ≈ 1,1 g (repère 0,3 g).
- `fodmapMeasurements.json` : 13 entrées GOS + sources `siva2019` et `njoumi2019` ; champ `cite` sur chaque source.
  Le script réécrit le fichier dans sa mise en forme d'origine (aller-retour identique vérifié).
- `mealFodmapHighlights` renvoie `sources` ; la note du chevron de la carte d'un repas cite les sources réellement
  utilisées (« Teneurs : Ciqual (Anses), Ferjančič 2024. ») au lieu de « Teneurs Ciqual (Anses) et mesures
  publiées » : l'attribution que demandent les licences CC BY.
- Nouveautés : « Lentilles, pois chiches, haricots : leurs GOS sont estimés ». Aucun appel réseau, aucune donnée
  nouvelle (Sécurité des données inchangée).

## Tests
- `scripts/nutrition/legumeGos.test.mjs` (nouveau, 5) : formule, monotonie, chaque entrée livrée recalculable depuis sa
  dérivation et identique à la sortie du générateur, ordres de grandeur.
- `fodmapGroups.test.js` +1 (lentilles 150 g et pois chiches 120 g → « probablement riche en GOS » ; 50 g de pois
  chiches en conserve sous le repère), `MealFodmapLine.test.jsx` +1 et une attente de plus (sources citées).

## Vérifications
- `npm run test` : **2 478** verts (+ 33 sautés) ; `npm run build` OK ; lint 6 erreurs (inchangé) ; `npm run visual` :
  15 pages « ok », 0 erreur JS.
- Captures `/food` avec `--goal=gut` et le chevron ouvert, claire et sombre : « Riche en lactose : yaourt nature »,
  note « … Teneurs : Ciqual (Anses). » sur trois lignes, sans débordement. Les données de démo n'ont pas de
  légumineuses : le cas « GOS » est couvert par les tests de composant.

## Suite
- N5 (pistes repas → ventre par sous-groupe, banc des nulles et de puissance) ; reste de N3b-2 possible plus tard :
  sorbitol des lentilles et pois chiches (Siva 662 / 515 mg à sec, pertes à la cuisson inconnues : laissé inconnu),
  cerise et autres aliments MEXT, `fodmap_score` des nouveaux repas branché sur les sous-groupes.
