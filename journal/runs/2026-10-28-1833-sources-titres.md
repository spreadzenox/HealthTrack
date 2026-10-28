# Run du 28/10/2026 18:33 (Paris, CET) — Sources : titre Health Connect et carte visage (POL-PLAY-28)

**Type** : 🎨 UI (variantes play et sideload, code commun avec l'app iPhone)

## Constat au démarrage
- Main à `ed5a7c1` (#479), v343 verte (Build & Release, Play — AAB, Tests). L'émulateur A56 était rouge sur `0ff467f`
  (#478) puis vert sur `ed5a7c1` (même code app) : pas d'action. Aucune PR « [Auto] » ouverte (PR #51 `cursor/*` non
  touchée).

## Fait (POL-PLAY-28)
- **Health Connect** (`HealthConnectConnector.js`) : nom « Health Connect » (le titre « Health Connect (montre, bague,
  balance…) » passait sur 2 lignes) ; description « Montre, bague, balance : ce que vos apps santé y écrivent (Samsung
  Health, Garmin, Withings, Oura…) : sommeil, cœur, pas, poids… » (128 car., limite VC-27 de 140 respectée).
- **Lecture du visage** (`FaceSenseCard.jsx`) : carte éteinte en play (`appOpen`) quand le natif annonce
  `unlockAvailable` (interrupteur de build faceUnlockPlay) : « … quand vous ouvrez Halcya et, si vous le voulez, à chaque
  déverrouillage », et une phrase dans « Détails » (3 images par déverrouillage, notification visible tant que c'est en
  marche). Sans l'interrupteur, texte inchangé (test existant « à l'ouverture » toujours vert).

## Tests
- `FaceSenseCard.test.jsx` : nouveau test POL-PLAY-28 ; `HealthConnectConnector.test.js` : nom exact et début de
  la description.

## Vérifications
- `npm run test` : vert (2 626) ; lint 6 erreurs (inchangé) ; build OK.
- `npm run visual -- --play` complet OK ; `--play --empty --routes=/connectors` (titre sur une ligne) et `--play --dark
  --routes=/connectors` relus.

## Demandes iOS
- Note de Nouveautés commune (Sources partagé) : pas de `variants`.

## Suite
- POL-PLAY-12 : nouvel audit `--play --empty` puis démo, écran par écran.

## Après le merge (#480, `41ae7d3`)
- Checks de la PR verts (Vitest, Build APK, relais, protocole montre, budget de lectures, bord à bord API 34,
  émulateur A56 API 35 et 36).
- Sur main : Build & Release **v344** publiée, APK **34,5 Mo** (34 492 765 octets) ; Play — AAB (test interne) vert ;
  Tests verts.
