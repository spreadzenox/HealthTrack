# 2026-10-19 04:30 Paris (02:30 UTC) — Visage : notification « Reprendre » (I88 ②)

**Type** : 🔴🙂 consigne du 18/10 au soir (§00000), D4  ·  **PR** : voir le résumé de la semaine

## Pourquoi
- Démarrage : main à `d75987d` (#214), « Build & Release » vert (v170). Aucune PR « [Auto] » ouverte.
- Run de code. Toujours pas de diagnostic visage de l'A56. Étape suivante du plan qui ne dépend pas de l'appareil :
  **I88 ②**. Le service caméra est `START_NOT_STICKY` et Android interdit de le relancer depuis l'arrière-plan ; or
  **chaque mise à jour de l'app le tue** (le propriétaire en installe plusieurs par jour), comme un redémarrage ou le
  ménage de One UI. Sans rappel, la collecte s'arrête en silence jusqu'à la prochaine ouverture de Connecteurs.

## Ce qui a été fait
- `face/FaceResume.java` (règle pure, testée sur la JVM) : prévenir seulement si l'interrupteur est allumé, le
  service absent, l'app fermée et la caméra autorisée ; pas plus d'un rappel par 6 h, sauf juste après un
  redémarrage ou une mise à jour (le service est alors forcément mort). Rend la raison du silence.
- `FaceResumeNotice` : notification « Lecture du visage arrêtée » (canal `face_resume`, importance basse, sans son),
  actions **Reprendre** (ouvre `MainActivity` avec `ACTION_FACE_RESUME`) et **Arrêter** (`ACTION_STOP` existant).
  Compteurs dans les préférences `face_sense` : `resumeNotices`, `resumeNoticeAt`, `resumeTaps`, `resumeCheck`
  (dernière décision), `resumeCheckAt`, `resumeCheckTrigger`.
- `FaceResumeJob` (JobScheduler, ~1 h, flex 20 min, persisté) programmé à l'activation (et au `status` si déjà
  activée), annulé à l'arrêt ; `FaceResumeReceiver` (`BOOT_COMPLETED`, `MY_PACKAGE_REPLACED`).
- `MainActivity` : le geste « Reprendre » relance le service **dans `onResume`** (activité visible : Android autorise
  alors un service de premier plan `camera`, ce qu'il refuse depuis une notification ou un récepteur).
  Choix délibéré de ne pas utiliser `PendingIntent.getForegroundService` : un service caméra démarré hors de l'app
  visible n'a pas accès à la caméra (restriction « while-in-use » d'Android 11+, et Android 15 interdit le type
  `camera` depuis `BOOT_COMPLETED`).
- Le service retire la notification dès qu'il redémarre ; « Arrêter » (carte ou notification) l'annule avec la tâche.
- JS : bloc `resume { notices, lastNoticeAt, taps, lastCheck, lastCheckAt, lastCheckTrigger }` dans le diagnostic
  exportable et ligne « Notifications « Reprendre » : N, reprise d'un geste M fois ; dernière vérification : … ».
  Carte arrêtée : « … une notification « Reprendre » vous le propose quand l'app est fermée. »

## Vérifications
- `npm run test:java` : **86 verts** (+6 `FaceResumeTest`).
- `FaceResume*`, `FaceResumeNotice/Job/Receiver` **compilés avec javac** contre `android-all` 15 (Robolectric
  13954326) + androidx.core 1.15.0 avec des bouchons de `FaceSenseService` / `CompanionPlugin` / `MainActivity` ;
  `onNewIntent` protégé / `onResume` public conformes à `BridgeActivity`. Compilation réelle : check « Build APK ».
- `npm run test` : **1 461 verts** (+1). Lint **6 erreurs** (inchangé). Build ✅.
- `npm run visual` ✅ (toutes pages) ; `--face --click=Diagnostic` (ligne « Notifications « Reprendre » … »),
  `--face=stopped` (nouveau texte), `--empty` (Connecteurs, Accueil), `--light --face=stopped` : sans erreur JS,
  captures relues.

## D5 / D6
- Aucune donnée nouvelle d'humeur ni de comportement : seulement l'état du service. Le geste « Reprendre » ne
  déclenche pas de rafale (la prochaine viendra au déverrouillage suivant) : pas de lecture biaisée par le moment où
  l'utilisateur ouvre la notification.

## À valider sur l'A56
- Après la mise à jour (qui elle-même arrête la lecture) : une notification « Lecture du visage arrêtée » doit
  apparaître **quelques secondes après l'installation** sans ouvrir l'app → toucher « Reprendre » → l'app s'ouvre,
  le point vert s'allume au déverrouillage suivant. Le diagnostic doit alors dire « reprise d'un geste 1 fois ».
- Si rien n'apparaît : vérifier que les notifications de HealthTrack sont autorisées (le diagnostic dira
  « notifications de l'app désactivées »).

## Suite proposée
1. 🙂 Lire le diagnostic visage de l'A56 dès qu'il arrive (`history`, `gate`, `resume`).
2. 🙂 I89 guide Shizuku / ADB (+ détection de `appops CAMERA allow` : permettrait peut-être de relancer sans geste).
3. 🙂 I113 note du soir d'un geste depuis une notification (accélère la porte ; réutilise ce canal de notification).
4. 🙂 I115 estimation du jour avec fourchette (derrière la porte) ; I91 voix ; temps par app comme X.

## CI et fusion
- Fusion en squash une fois « Frontend (Vitest) » et « Build APK » verts sur le dernier commit ; release à vérifier.
