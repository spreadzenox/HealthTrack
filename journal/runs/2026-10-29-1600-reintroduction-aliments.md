# Run du 29/10/2026 16:00 (Paris, CET) — Réintroduction : aliments de test cohérents avec la table (POL-PLAY-43)

**Type** : 🎨 Code (polissage de la version play, POL-PLAY-12 : audit Réintroduction en période de lancement)

## Constat au démarrage
- Main à `817f600` (#503), tous les workflows verts ; aucune PR « [Auto] » ouverte (PR #51 `cursor/*` non touchée).

## Audit
- `npm run visual -- --play --subscription=launch --routes=/reintroduction --fodmap` (choix), `--fodmap=day2` (lait
  jour 2), `--fodmap=result` (blé bien toléré), puis `--click=Sorbitol --dark` après correction : captures relues.
- Défaut 1 (fond) : le test **Sorbitol** proposait ¼ d'avocat (« avocat, mûres ») et le **Mannitol** citait le
  chou-fleur et 40 g de champignons de Paris (crus par défaut). D'après notre propre table (Ciqual 2025), avocat, mûre
  et chou-fleur ont **< 0,5 g de polyols / 100 g** ; le champignon de Paris cru 0,28 g. Même au 3e jour (×3), la
  portion restait sous le repère du groupe (0,4 g, Varney 2017) : `estimateMealFodmap` la classait « bas ». Un test
  qui n'apporte pas le groupe conclut « bien toléré » à tort.
- Défaut 2 (forme) : titre de la préparation « Lait (lait) », « Miel (miel) », « Ail (ail) ».
- Écrans jour 2 et résultat : rien à redire.

## Fait (POL-PLAY-43)
- `fodmapChallenge.js` : chaque aliment de test porte sa `reference` (nom Ciqual + grammes de la portion du 1er
  jour). Sorbitol → **pruneaux secs** (1 pruneau ≈ 8 g → 0,77 g de sorbitol, « élevé » dès J1 ; indice « pruneaux,
  prunes ») ; Mannitol → **champignons de Paris poêlés** (40 g → 1,2 g) et indice « champignons, pois mange-tout »
  (1,16 g / 100 g, Liljebo 2020). Avocat gardé en `retired` (un ancien test reste lisible, l'historique et le rapport
  PDF gardent son nom) mais plus proposé, plus présélectionné par un lien, refusé par `startChallenge`, et plus relié
  aux pistes (« avocat », « mûres », « chou-fleur » → choix du groupe). `pickableGroups()` pour l'écran.
- `Reintroduction.jsx` : choix sur `pickableGroups()` ; précision entre parenthèses seulement si elle diffère du nom.

## Tests
- Nouveau test de cohérence : la portion du 3e jour de chaque aliment proposé n'est jamais « bas » d'après la table
  de l'app ; sorbitol et mannitol « élevé » dès le 1er jour. Il échouait avant (avocat, champignons crus).
- Avocat retiré (lisible, non proposé, refusé au départ) ; pistes « pruneaux », « prune reine-claude »,
  « pois mange-tout » → bon test ; « avocat », « mûres », « chou-fleur » → aucun. Page : titre sans répétition, lien
  vers l'avocat → choix du groupe sans avocat.

## Vérifications
- `npm run test` OK (2 690+ tests), `npm run build` OK, `npm run lint` 6 erreurs (comme avant), `npm run visual`
  (voir PR) ; captures Réintroduction claire (choix) et sombre (préparation sorbitol) relues.

## Données
- Aucune migration : un test existant garde `food: 'avocado'` et reste affiché tel quel.

## Demandes iOS
- Rien de propre à Android : note de Nouveautés sans `variants`.

## Suite
- POL-PLAY-12 : Rapport PDF en période de lancement (`/data`, bas d'Analyses).
- Idée : la même vérification pourrait servir aux repères « riche en … » du Journal (déjà calculés par la table).
