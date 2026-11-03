# Run du 03/11/2026 14:35 (Paris, CET) — Version Play : ressources inutilisées retirées (POL-PLAY-11, shrinkResources)

**Type** : 🔧 code (build de la variante play ; rien de visible dans l'app)

## Constat au démarrage
- Main à `6e20c48` (#655) ; Tests, Build & Release, Play — AAB (100739) et émulateur verts ; aucune PR « [Auto] »
  ouverte (la #51, hors routine, n'est pas touchée).
- Priorités du prompt déjà tenues : Alpha 100721 (examen en cours), `until` 27/11 et fin iPhone 06/11 servis.
  GOLD-a3 attend P37, VITALS attend P43, INSTALLS-21b-2 attend 2–3 versions, TEST-ALPHA-1 le 07–08/11.
  Étape indépendante : le dernier reste de POL-PLAY-11, `shrinkResources`.

## Fait
- `build.gradle` : `shrinkResources true` sur la release (seule la variante play est construite en release), à côté de
  R8. Les modèles du visage (`faceModelsAssetsDir`) et les polices (dans le web, sous `assets/public`) sont dans
  `assets/`, que la réduction ne touche jamais : la crainte notée au 28/10 (« lus par nom ») ne s'applique pas.
- `res/raw/keep.xml` : mode `safe` (les noms lus par `getIdentifier`, comme dans `AssetUtil` de Capacitor, restent
  gardés) et garde explicite des ressources de l'app (icône de notification, mises en page des notifications du soir,
  règles de sauvegarde, icônes, écran de démarrage).
- Aucune ressource de l'app n'est lue par son nom (`getIdentifier` absent du code de l'app).

## Tests
- `distribution.android.test.js` : POL-PLAY-11 (`shrinkResources true` dans la release, `keep.xml` en mode safe avec les
  ressources de l'app, modèles servis depuis assets/). Rouge avant le changement, vert après.
- Le vrai contrôle est l'émulateur de la PR : il construit `assemblePlayRelease` (R8 + réduction) et appelle les
  plugins natifs (`smoke.mjs`), plus le démarrage à froid.

## Vérifications
- Voir la PR : `npm run test`, `npm run lint`, `npm run build` ; `npm run visual` inutile pour l'UI (aucun fichier web
  touché) mais lancé par garde-fou.
- Taille : AAB 100739 (avant) = 15 867 781 octets (artefact de « Play — AAB ») ; à comparer à la première version
  construite après le merge.

## Résultat de la PR #656
- Tous les checks verts : Frontend (Vitest), Build APK, Relais, Protocole montre, budget de lectures, bord à bord
  API 34, émulateur API 35 et 36. Sur API 35, la release Play réduite (R8 + shrinkResources) : premier écran en 7 s,
  17 plugins natifs, lecture du visage (LiteRT + ONNX, modèles chargés en 174 ms), lecture au déverrouillage
  démarrée, journal R8 propre, aucun plantage.
- **Pas mergée** : le merge (squash) a été refusé par le contrôle des permissions de la session (« merge sans
  revue »), sans contournement. La PR reste ouverte, prête : un clic « Squash and merge » du propriétaire, ou le run
  suivant si la permission revient (remettre la branche à jour sur main d'abord).

## Données
- Aucune.

## Demandes iOS
- Aucune (Android seulement).

## Suite
- Lire au prochain bilan de « Play — AAB » la taille de l'AAB et l'absence de plantage (VITALS-1 dès P43).
- TEST-ALPHA-1 (07–08/11) ; INSTALLS-21b-2.
