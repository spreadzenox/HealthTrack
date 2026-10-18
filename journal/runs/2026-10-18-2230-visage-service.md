# 2026-10-18 22:30 Paris (20:30 UTC) — Consigne du soir consignée ; service « Lecture du visage » (I88 ①)

**Type** : 🔴🙂 consigne du 18/10 au soir (§00000), D4 / D5  ·  **PR** : « [Auto] Lecture du visage : service caméra au déverrouillage + diagnostic »

## Pourquoi
- Démarrage : main à `1f62bbd` (#211, run idées 20:30, journal seul). Aucune PR « [Auto] » ouverte.
- **Nouvelle consigne du propriétaire (18/10 au soir)** : « concentration maximale sur la collecte entièrement
  automatique du bien-être ». Premier run qui la lit → reportée dans la charte (§00000), le résumé, le backlog, et
  « Prochaines étapes » réordonnées (bien-être automatique seul ; le reste en pause).
- 22:30 Paris : run de code. Le run idées de 20:30 proposait d'abord I113 (note du soir depuis une notification) ;
  la consigne demande que rien ne soit à saisir et place le visage en (3) après état des lieux et cœur Y / X (déjà
  faits) → **I88 ① service « Lecture du visage »** d'abord, I113 gardée en option de calibration.

## Ce qui a été fait
- `journal/BIEN-ETRE-AUTO.md` : état des lieux, décisions Y / X (réseaux sociaux = X, **signaux physiologiques de la
  montre = X**), plan en 7 étapes, ce qu'il faut valider sur l'A56, état Android 11–16 / One UI.
- Java pur (testé sur la JVM) : `face/FaceFrames` (YUV 4:2:0 → RVB tourné), `face/FaceSchedule` (règle de
  déclenchement), `face/FaceRecord` (JSON d'une rafale, scores seuls) ; `CaptureInbox` accepte un plafond.
- Android : `FaceCamera` (Camera2), `FaceSenseService` (premier plan `camera`), `FaceSensePlugin`, manifeste
  (`CAMERA`, `FOREGROUND_SERVICE(_CAMERA)`, `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, caméra non obligatoire),
  enregistrement dans `MainActivity`. Détails : `protocoles/visage.md` §8.1.
- JS : `services/faceSense.js` (plugin, miroir local de l'interrupteur, `describeFaceSense`, diagnostic exportable sans
  score), `components/FaceSenseCard.jsx` (Activer / Relancer / Sans restriction / Désactiver / Tester / Enregistrer le
  diagnostic), source `face` en tête de Connecteurs (`connectorsLayout`), faux plugin `--face[=off|stopped]` pour
  `npm run visual`.
- Nouveautés : `2026-10-18-2230-lecture-visage.json`.

## Vérifications
- `npm run test:java` : **80 verts** (63 → 80 : `FaceFramesTest` 7, `FaceScheduleTest` 5, `FaceRecordTest` 4,
  plafond de la boîte 1).
- Pas de SDK Android dans la session : `FaceCamera`, `FaceSenseService`, `FaceSensePlugin` (+ `face/`, `huawei/`,
  `FaceModels`, `LiteRtModel`) **compilés avec javac** contre `android-all` 15 de Robolectric (API 35), androidx.core
  1.15.0, LiteRT 1.4.2 et des bouchons des classes Capacitor utilisées (signatures relues dans
  `node_modules/@capacitor/android`) : aucune erreur. Compilation réelle : check « Build APK » de la PR.
- `npm run test` : **1 430 verts** (110 fichiers ; +15 : `faceSense.test.js` 9, `FaceSenseCard.test.jsx` 6, layout
  mis à jour). Lint **6 erreurs** (inchangé). Build ✅. `npm run visual` ✅ (toutes pages), `--empty`, `--light`,
  `--face` (+ volet Diagnostic ouvert), `--face=stopped` : captures de Connecteurs relues (carte active : comptes,
  « Sans restriction », diagnostic lisible ; arrêtée : « Relancer » ; vide / web : explication + « Disponible dans
  l'app Android »). Intro raccourcie après relecture.
- Pas d'exécution sur émulateur de la caméra (l'émulateur de la CI n'a pas de vraie caméra frontale) : validation
  sur l'A56 par le diagnostic.

## D5 / D6
- Les indices restent des **Y** (`face_*` dans `ESTIMATOR_INPUTS`) ; rien n'est affiché ni importé (porte I110 / I112).
- `FaceSchedule` refuse tout déclencheur autre que le déverrouillage (et le test manuel) : pas de biais de
  composition par l'usage des apps (I114). Aucun indice codé « bon » ou « mauvais ».

## Apprentissages / décisions
- Un jar `android-all` de Robolectric (Maven Central) suffit à compiler du code Camera2 / services hors SDK : à
  réutiliser pour vérifier le natif avant la CI.
- Signaux de la montre = X, consigné dans `BIEN-ETRE-AUTO.md` §2.

## Suite proposée
1. 🙂 Lire le diagnostic visage de l'A56 dès qu'il arrive ; adapter (délai après déverrouillage, exposition, One UI).
2. 🙂 **I90** : import des rafales en entrées `face_burst` (+ export / import, test « composition »).
3. 🙂 I88 ② notification « Reprendre », I89 Shizuku / ADB, puis I91 voix.
4. 🗓️ Le prochain run (lundi 19/10 00:30 Paris) ouvre la semaine S43 : archiver le résumé S42 dans
   `semaines/2026-S42.md`.
