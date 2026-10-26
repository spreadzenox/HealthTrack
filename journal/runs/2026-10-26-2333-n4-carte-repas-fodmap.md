# Run du 26/10/2026 23:33 (Paris, CET) — N4 : FODMAP par sous-groupe sur la carte d'un repas

**Type** : 🏗️ code (priorité du propriétaire du 26/10 14:45 : FODMAP par sous-groupe ; P28 attend le propriétaire)

## Constat au démarrage
- Main à `309458c` (#405), vert (« Build & Release » v301). Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`).

## Ce qui a été fait
- `services/fodmapGroups.js` : `mealFodmapHighlights(estimate)` — groupes au-dessus du repère (du plus chargé au moins
  chargé), 3 aliments au plus, `probable` quand le repère n'est dépassé qu'en comptant des valeurs à confiance basse
  (analogie, valeur citée, glucose sous la limite de détection).
- `components/MealFodmapLine.jsx` (+ CSS pêche, ajouté à `pageStyles.js`) : sous chaque repas de Journal → Repas,
  « Riche en fructanes : oignon » / « Probablement riche en fructanes : ail » ; chevron (`DetailsToggle`) : « ≈ 1,4 g ·
  repère 0,3 g par repas », « teneurs approchées » si besoin, et « Repères généraux (Varney 2017), une hypothèse de
  départ : vos propres données priment. Teneurs Ciqual (Anses) et mesures publiées. » Rien quand aucun groupe ne
  dépasse son repère ; un groupe inconnu n'est jamais dit bas.
- `pages/Food.jsx` : la ligne seulement si `gutCardMode() !== 'hide'` (objectif ventre, comme la carte ventre de
  l'Accueil), masquée pendant la modification d'un repas.
- Nouveautés : « Quels FODMAP dans vos repas ». Aucune donnée, aucun appel réseau nouveau (Sécurité des données
  inchangée).

## Tests
- `fodmapGroups.test.js` +4 (ordre, aliments, « probable », 3 au plus, table livrée : ail seul probable, oignon sûr) ;
  `MealFodmapLine.test.jsx` (4) ; `Food.test.jsx` +1 (ligne avec « Mon ventre », rien avec « énergie »).
- La garde `bundleGuard` (tout CSS chargé d'emblée) a rappelé d'ajouter le CSS à `pageStyles.js`.

## Vérifications
- `npm run test` : **2 466** verts (+ 33 sautés) ; `npm run build` OK ; lint 6 erreurs (inchangé) ; `npm run visual` : 15 pages « ok », 0 erreur JS.
- Captures `/food` claire et sombre relues : « Riche en lactose : yaourt nature » sur les repas yaourt-banane-café
  des données de démo, rien sur riz-saumon-brocoli ni poulet-pomme de terre (fructanes / GOS inconnus pour eux),
  contraste pêche correct dans les deux thèmes.

## Suite
- N3b-2 (GOS des légumineuses cuites depuis le sec, `water_g`), N2b (inconnu ≠ 0 dans les totaux), N5 (pistes ventre
  par sous-groupe, banc des nulles et de puissance). Possible : la même ligne sur le résultat d'une analyse photo avant
  enregistrement et dans « Vos derniers jours ».
