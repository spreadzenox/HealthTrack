# 2026-10-21 10:30 Paris (08:30 UTC) — Jalon 3b-2 : variante play sans service caméra, lecture à l'ouverture, Health Connect réduit

**Type** : 🛠️ code (jalon 3) · **PR** : « [Auto] Jalon 3b-2 : variante play sans service caméra… »

## Pourquoi
- Main à `c18ab96` (#247), workflows verts, aucune PR « [Auto] » ouverte. Signalement du 20/10 19:05 déjà corrigé.
- 10:30 Paris → run de code. `PRODUIT.md` / `BACKLOG.md` : prochaine étape **3b-2** (manifeste play épuré + lecture du
  visage à l'ouverture, décision B de `PLAY-CONFORMITE.md`), en y joignant **I131** (permissions Health Connect).

## Ce qui a été fait
- **Natif** : `BuildConfig.FACE_UNLOCK` (vrai en sideload, faux en play) ; `src/play/AndroidManifest.xml` retire
  `FaceSenseService`, `FaceResumeJob`, `FaceResumeReceiver`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_CAMERA`,
  `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` et **26 permissions Health Connect** (20 écritures + 6 lectures jamais
  demandées) ; `READ_EXTERNAL_STORAGE` bornée à Android 12 (manifeste principal). Nouveau `FaceOneShot` : une lecture
  app à l'écran (mêmes modèles, même rafale, même boîte que le service), déclencheur `app_open` (1 / 30 min, 12 / jour,
  jamais pendant un appel ni app cachée) ou `manual` (« Tester »). `FaceSensePlugin` : `readNow`, et en play `start`
  ne fait que noter l'accord, pas de service, `requestBatteryExemption` refusée. `FaceSchedule` + tests JUnit.
- **JS** : `FEATURES.faceUnlock` / `faceAppOpen` ; `services/faceAppOpen.js` (lecture à l'ouverture et à chaque
  retour dans l'app, intervalle de 30 min côté JS pour ne pas faire clignoter le bandeau) ; **bandeau
  `FaceReadIndicator`** (menthe, « Lecture du visage · regardez l'écran une seconde », puis « Bien-être lu · quelques
  nombres gardés, aucune image ») ; carte « Lecture du visage » et diagnostic en mode play (ni batterie, ni Samsung,
  ni accès permanent, ni « Arrêtée ») ; divulgation `camera_app_open`. `MOOD_TRIGGERS` = `unlock` + `app_open`.
- **D5** : les lectures `app_open` comptent pour le bien-être (Y) car HealthTrack est déjà exclu des facteurs « temps
  par app » (`PhoneUsagePlugin.ignoredPackages`) ; le test anti-circularité le vérifie maintenant (et refuse toujours
  `manual`, `inUse`, `social`, toute autre app).
- **I131** : `READ_TYPES` du connecteur exporté = seule source ; test qui compare le manifeste du plugin et les retraits
  play ; `check-play-manifest.sh` vérifie le manifeste fusionné (service caméra, FGS, batterie, écritures HC).
- `PLAY-CONFORMITE.md` : tableau des permissions mis à jour, **justification par type Health Connect** (brouillon pour
  P16). Contrôle visuel : option `--play` (+ `--face=reading`).

## Vérifications
- `npm run test` : **1 693 verts** (131 fichiers) ; `npm run test:java` : 119 JUnit verts ; `npm run lint` : 6 erreurs
  (= main) ; `npm run build` ✅ (et build `VITE_DISTRIBUTION=play` ✅).
- `npm run visual` complet sans erreur JS ; captures lues : `--play --face=reading` (bandeau sur l'accueil, clair et
  `--dark`), `--play --face --face-diag` (carte et diagnostic play), `--play --face=off --disclosure=camera`
  (divulgation play), `--face` sideload (inchangée : déverrouillages, bouton « Sans restriction »).
- Pas de SDK Android dans la session : la compilation Java et le manifeste fusionné play sont vérifiés par le check
  « Build APK » de la PR (`bundlePlayRelease` + `check-play-manifest.sh`).

## Suite proposée
- Prochain run de code : **2b/2c + 2 bis (iii)** — Accueil « Aujourd'hui » de la maquette et navigation 4 onglets.
- 3b-3 « Lecture rapide » (tuile / notification → activité) ; 3c envoi automatique en test interne après P10 / P11.
- À vérifier sur téléphone dès que la variante play est installable (P10) : 1re lecture à l'ouverture, bandeau.

## Après le merge
- PR **#248** : 9 checks verts (Vitest, Build APK avec `bundlePlayRelease` + `check-play-manifest.sh` étendu, Java,
  émulateurs A56 API 35 et 36…) → fusionnée en squash (`522d63a`).
- « Build & Release » ✅ → **v194** publiée (`HealthTrack-v194.apk`, 33,7 Mo). « Play — AAB » ✅ → artefact
  **`HealthTrack-play-335`** (17,0 Mo zippé) : c'est lui à envoyer pour P10 (manifeste conforme : sans service caméra,
  15 permissions Health Connect).
