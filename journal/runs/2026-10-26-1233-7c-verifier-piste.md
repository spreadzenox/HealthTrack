# Run du 26/10/2026 12:33 (Paris, CET) — 7c : vérifier une piste ventre par une réintroduction guidée

**Type** : 🏗️ code (jalon 7, étape 7c)

## Constat au démarrage
- Main à `a9edc29` (#394, 7b-2), CI de main verte (Tests, émulateur, Build & Release, Play — AAB). Aucune PR « [Auto] »
  ouverte (seule la PR #51 `cursor/*`, hors routine, non touchée).

## Ce qui a été fait
- `services/fodmapChallenge.js` : chaque aliment de test porte `words` (noms des repas qui y renvoient, singulier,
  accents ignorés, pluriel en s/x accepté) et `not` (exclusions : « lait de coco / d'amande / d'avoine / de soja / de
  riz », « sans lactose », « pain sans gluten »). `challengeFoodFor(factor)` → `{ group, food }` ou null (le facteur
  « repas riches en FODMAP » compris) ; `challengePath(factors)` → `/reintroduction?groupe=…&aliment=…` pour le premier
  aliment qui a un test (une piste peut regrouper des aliments toujours mangés ensemble), sinon `/reintroduction`.
- `components/GutLinks.jsx` : lien « Vérifier avec une réintroduction guidée › » (lilas, cible ≥ 44 px) sur chaque
  piste, visible sans ouvrir les détails.
- `pages/Reintroduction.jsx` : lit `groupe` / `aliment` et ouvre directement la préparation de l'aliment
  (« ← Autre groupe » revient au choix) ; paramètre inconnu → choix du groupe. Sans premium hors période de
  lancement, l'écran « Débloquer » habituel (moment de la valeur).
- La carte lilas d'Analyses donnait déjà l'état du test (7b-2) : la partie « états dans la carte lilas » de 7c est
  donc couverte.
- Aucun appel réseau, aucune donnée nouvelle : formulaire Sécurité des données inchangé.

## Tests
- `fodmapChallenge.test.js` (+23) : 14 correspondances (oignon rouge, échalote, pain de mie, pâtes, lentilles,
  houmous, lait demi-écrémé, yaourt, chou-fleur…), 8 refus (lait de coco, boisson à l'avoine, pain sans gluten,
  volaille ≠ ail, café, facteur FODMAP, vide), chemins (dont aliments regroupés → yaourt → lactose).
- `GutLinks.test.jsx` (+3, rendu dans un routeur) ; `Reintroduction.test.jsx` (+2 : présélection et retour, lien
  inconnu).

## Vérifications
- `npm run test` : **2 384** verts (+ 33 sautés) ; `npm run build` OK ; lint 6 erreurs (inchangé) ; `npm run visual`
  (`/recommendations --gut-links` clair ; `/reintroduction?groupe=fructans&aliment=onion --fodmap --dark`) : 0 erreur
  JS ; captures relues (lien lisible sous « À confirmer » dans la carte pêche ; préparation « Oignon (oignon cuit) »
  ouverte directement en sombre). Le `--click` du script ne suit pas les liens : l'adresse est couverte par les tests.

## Suite
- **I175** (rapport PDF : `buildReport.js` pur, puis rendu `pdf-lib`), puis **I176**, **7d** (à l'aveugle).
