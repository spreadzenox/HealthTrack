# 2026-10-19 16:30 Paris (14:30 UTC) — Visage : chaque déverrouillage repéré (signalement 19/10 15:05)

**Type** : 🚑🙂 régression bloquante du chantier bien-être (signalement du propriétaire, prioritaire)  ·  **PR** : voir ci-dessous

## Signalement
« J'ai déverrouillé plusieurs fois et toujours aucune prise de photo automatique. Le test manuel fonctionne. Je
déverrouille avec l'empreinte. » Captures 15:05–15:06 (Galaxy A56, One UI) : carte « Active », « Aucun déverrouillage
depuis minuit », service actif · caméra autorisée · batterie sans restriction, 0 lecture rangée, notification
permanente affichée, autorisation Appareil photo « seulement lorsque l'appli est utilisée ».

## Cause (la plus probable, et corrigée)
`dayUnlocks` n'avance que dans `burst()`, appelé **uniquement** par le récepteur `ACTION_USER_PRESENT` : 0 =
le récepteur n'a jamais été appelé. Il était enregistré avec `ContextCompat.RECEIVER_NOT_EXPORTED`. Or
`ACTION_USER_PRESENT` est envoyée par l'écran de verrouillage, c'est-à-dire **SystemUI** (uid d'app persistante, pas
l'uid système 1000) : pour un récepteur dynamique non exporté, le contrôle « exported » d'Android ne laisse passer que
l'uid système / root ou la même app → diffusion filtrée. (`SCREEN_OFF`, envoyée par system_server, passait, ce qui
masquait le problème.) Le test manuel, lui, ne passe pas par le récepteur : d'où « le test marche ».
La caméra en arrière-plan n'est probablement **pas** en cause ici : tous les démarrages du service viennent de l'app à
l'écran (interrupteur, « Reprendre » relancé dans `onResume`), donc l'exemption « pendant l'utilisation » est acquise.
Mais rien ne le prouvait : c'est maintenant mesuré (voir diagnostic).

## Ce qui a été fait
- **Natif, règle pure** `face/UnlockWatch` : trois voies, la première arrivée compte, **une seule lecture par allumage
  de l'écran** — ① `ACTION_USER_PRESENT` ; ② secours : `KeyguardManager.isKeyguardLocked()` interrogé toutes les 500 ms
  pendant 60 s après `ACTION_SCREEN_ON` (empreinte, visage, constructeur qui n'enverrait pas la diffusion) ; ③ écran
  allumé déjà déverrouillé (Smart Lock, pas de verrou, verrouillage différé). Au-delà de 60 s, seule la diffusion
  compte (on regardait l'heure sur l'écran verrouillé). `SCREEN_OFF` remet tout à zéro.
- **Service** : récepteur `USER_PRESENT` + `SCREEN_ON` + `SCREEN_OFF` enregistré **`RECEIVER_EXPORTED`** (diffusions
  protégées : aucune autre app ne peut les émettre) et **livré sur le fil du service** (plus de course entre récepteur
  et interrogations). Recréé à chaque `onCreate` (donc après « Reprendre », mise à jour, redémarrage dès que le service
  repart). Démarré écran allumé et déverrouillé : l'état est pris tel quel (pas de lecture parasite).
- **Compteurs du jour** (remis à zéro à minuit par `rollDay`, qui efface toutes les clés `day…`) : allumages
  (`dayScreenOns`), diffusions reçues (`dayPresents`), déverrouillages repérés par source (`dayUnlock_user_present`,
  `_keyguard`, `_screen_on`), `lastUnlockAt` / `lastUnlockSource`, `lastScreenOnAt`, `lastPresentAt`.
- **Journal des 12 dernières tentatives** (`attempts`, JSON) : heure, déclencheur, source, 2e essai, résultat, **erreur
  exacte** d'Android (`FaceCamera.Capture.detail` : `onError:<code>`, `CameraAccessException:<raison>`,
  `SecurityException`, `onDisconnected`, classe de l'exception).
- **Mode de démarrage** : extra `origin=app` posé par `FaceSensePlugin` et par `FaceResumeNotice.resumeFromApp` ; tout
  démarrage sans lui est noté `background` (`startOrigin`, `startAction`, `starts`).
- **Mode app-op caméra** (`cameraOpMode`, `unsafeCheckOpNoThrow`, API 29+) : `allow` / `foreground` / `ignore` /
  `deny` / `default`, exposé par `status` (`cameraOp`).
- **`start({ restart: true })`** : arrête puis redémarre le service app ouverte (rend l'accès caméra « pendant
  l'utilisation » si un démarrage en arrière-plan l'a fait perdre).
- **JS** `faceCameraAccess(status)` → `{ op, permanent, blocked }` : bloqué si démarré en arrière-plan, ou si la dernière
  lecture **du déverrouillage** a été refusée (`camera_disabled` / `camera_denied` / `camera_error`), et que l'accès
  n'est pas permanent. Carte : nouvel état **« À relancer »** (explication, « Relancer » → redémarrage, guide ouvert).
  Ligne « Écran allumé N fois aujourd'hui, mais aucun déverrouillage repéré : ouvrez le Diagnostic et envoyez-le. »
- **I89 (en partie)** : guide « Accès permanent à la caméra (Shizuku ou ADB) » dans le Diagnostic
  (`appops set com.healthtrack.app CAMERA allow`), détection du mode : « accordé en permanence » quand `cameraOp = allow`.
  Reste pour I89 : le micro (`RECORD_AUDIO`) le jour où la voix arrive.
- **Diagnostic exporté v2** : `detection { screenOns, userPresents, unlocks, bySource, lastUnlockAt, lastUnlockSource,
  lastScreenOnAt }`, `camera { op, startOrigin, startAction, starts }`, `attempts[]` ; lignes lisibles
  « Aujourd'hui : écran allumé N fois, M déverrouillages repérés (écran de verrouillage a, verrou interrogé b), le
  dernier à HH:MM », « Accès caméra : … · service démarré … », « Dernières tentatives : … [erreur exacte] ».
- `npm run visual -- --face=blocked` ; faux plugin enrichi. Nouveauté `2026-10-19-1630-visage-deverrouillage.json`.

## Biais (I114, D5)
La source ② / ③ déclenche toujours **au déverrouillage** (même instant, même délai de 1,2 s) : la composition des
lectures ne dépend pas de l'usage. ③ peut compter un allumage écran déjà déverrouillé (verrouillage différé) : c'est
le début d'une session d'usage, comme un déverrouillage ; l'intervalle minimal de 2 min reste appliqué.

## Tests (TDD : rouges avant le code)
- `UnlockWatchTest` (JVM, compilé et lancé localement avec JUnit 4, avec `FaceScheduleTest` : **15 OK**) : diffusion
  seule, empreinte sans diffusion (le verrou prend le relais, pas de doublon quand la diffusion arrive après), écran
  allumé déjà déverrouillé, un déverrouillage par allumage, fin de la fenêtre d'interrogation, écran éteint, diffusion
  sans allumage vu.
- `faceSense.test.js` (+6) : export v2 (détection, caméra, tentatives), journal illisible, lignes lisibles, « écran
  allumé mais aucun déverrouillage », état « bloqué » (et pas avec `allow`, ni après une lecture réussie),
  `start({ restart: true })`.
- `FaceSenseCard.test.jsx` (+2) : « À relancer » → Relancer redémarre, commande `appops` affichée ; accès permanent dit.

## Vérifications
- `npm run test` : **1 525 verts** (114 fichiers). Lint **6 erreurs** (inchangé). Build ✅.
- `npm run visual` ✅ toutes pages ; `--routes=/connectors --face --click=Diagnostic` (lignes allumages /
  déverrouillages, accès caméra, dernières tentatives lisibles) ; `--face=blocked` (badge orange « À relancer »,
  message, Relancer / Désactiver, guide ouvert) ; `--empty --face=off` ; `--light`.
- `FaceSenseService.java` / `FaceSensePlugin.java` non compilés localement (pas de SDK Android) : check « Build APK ».
- **Émulateur** : pas de test instrumenté du déverrouillage (éteindre l'écran / déverrouiller un verrou à empreinte
  n'est pas pilotable proprement depuis un test d'instrumentation) ; la règle est couverte en JVM, la validation se
  fait sur l'A56 avec le diagnostic.

## Pour le propriétaire (Galaxy A56)
1. Installer la nouvelle version (bannière de mise à jour, ou Plus → Nouveautés : version ≥ celle du 19/10 ~17 h).
2. Ouvrir Plus → Connecteurs → **Lecture du visage**. Si la carte dit « Arrêtée » ou « À relancer », toucher
   **Relancer** (app ouverte).
3. Verrouiller puis **déverrouiller 2 ou 3 fois à l'empreinte**, en regardant l'écran (le point vert doit s'allumer
   ~1 s après), à plus de 2 minutes d'écart si possible (en dessous, la 2e est volontairement sautée, mais comptée).
4. Revenir sur la carte → **Diagnostic** → **« Enregistrer le diagnostic »** et renvoyer le fichier
   `Documents/healthtrack-visage-….json` (ou une capture des lignes « Aujourd'hui : écran allumé… », « Accès
   caméra… » et « Dernières tentatives… »). Ces trois lignes suffiront à trancher : déverrouillage vu ou non, par
   quelle voie, et ce qu'a répondu la caméra.
5. Facultatif mais recommandé : accorder l'accès permanent (guide « Accès permanent à la caméra » dans le Diagnostic).

## Suite
Lire le diagnostic de l'A56 dès qu'il arrive (`journal/diagnostics/`). Si « verrou interrogé » domine, la diffusion est
bien bloquée chez Samsung (ou toujours filtrée) : le secours suffit. Si les tentatives montrent `camera_disabled` en
arrière-plan malgré `startOrigin = app`, passer par l'accès permanent ou relancer le service à chaque retour dans
l'app. Ensuite : I119 lexiques → I117 dictée du soir, I115 estimation du jour.
