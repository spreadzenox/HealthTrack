# 2026-11-07 02:00 UTC — retours du testeur, point (5), fin : position et appareil photo à l'accueil

**Étape** : décision du propriétaire (retours du premier testeur iPhone)  ·  **PR** : #351 (v850, mergée),
autorisations à l'accueil (correctif 46)  ·  **Android suivi** : v850 (`788cca8`)  ·  **iOS** : 848 sur TestFlight
(848.350), 850 en cours ; version 844 dans App Store Connect, build 844.344 attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf depuis la décision du 06/11 au soir (retours du testeur, point 5).

## Examen bêta
- Relevés de 01:00 et 02:00 UTC : inchangés ; 839.337 et 817.312 « IN_BETA_TESTING ».

## Fin du run précédent (v850)
- #351 : build simulateur de 63 min (runners lents) ; tout vert ; captures regardées : onglet Ventre (« Vos analyses
  du ventre arrivent dans 19 jours », sans détail technique), Journal vide (« Rien de noté pour l'instant »,
  « Photographier un repas ») ; aucune erreur JS ni texte d'Android ; mergée (`26329eb`).
- Vu au passage : à 390 points, les sous-onglets d'Analyses passent sur deux lignes (« Tendances » seul), déjà en v846 et
  v848 ; code partagé, demande dans `DEMANDES.md`.

## Retours du testeur, point (5), fin : autorisations à l'accueil
- Correctif 46 : sur iPhone, après l'app Santé (et son import), l'étape « Ce que Halcya peut utiliser »
  (`overlay/app/src/ios/PermissionsStep.jsx`) : une ligne par accès, avec sa raison et « Autoriser » ; « Continuer »
  toujours possible.
  - Position approximative : même chemin que la carte météo de Sources (explication `location`, position lue une fois,
    arrondie à ≈ 10 km par `enableWeather`, météo branchée et mise à jour) ; refusée : la ville reste possible dans
    Sources.
  - Appareil photo : `FaceSense.requestCamera`, nouvelle méthode native (`FaceSensePlugin.swift`) qui demande l'accès
    sans activer la lecture du visage ; module `cameraPermission.js`.
- Styles en ligne et classes de l'accueil : tout le CSS de l'app doit être chargé d'emblée (`pageStyles.js`,
  `bundleGuard.test.js` d'Android) ; un fichier CSS de l'iPhone aurait demandé un correctif de plus.
- Tests d'abord : `PermissionsStep.appstore.test.jsx` (6), `cameraPermission.test.js` (2), accueil (l'étape à l'écran 4),
  plan des captures (autorisations 4, visage 5, geste 6). Note de Nouveautés propre à l'iPhone
  (`2026-11-07-0200-autorisations-accueil`). 39 correctifs ; 3532 tests, build appstore et lint passent.
- Le point (5) du testeur est fait (BACKLOG).

## Suite
- PR du correctif 46 : vérifications (build iOS avec la méthode native), capture de l'étape regardée, merge ;
  TestFlight.
- Suivi d'Android : #768 (TESTEUR-4d, Nutrition) à suivre.
