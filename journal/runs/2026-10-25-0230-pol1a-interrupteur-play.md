# 2026-10-25 02:30 Paris (00:33 UTC) — POL-1a : interrupteur de build de la lecture au déverrouillage (play)

**Type** : 🧭 chantier produit (polissage du 24/10 15:00, point 1 ; cahier des charges `PLAY-CONFORMITE.md` §1 bis)

## Constat au démarrage
- Main à `d44c612` (#342, v261), aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- Polissage POL-2 à POL-8 livré ; reste POL-1, à préparer derrière un interrupteur **coupé** (P28 pas encore fait).

## Ce qui a été fait (natif + CI ; aucun changement pour la version play publiée ni pour la sideload)
- `build.gradle` : propriétés `-PfaceUnlockPlay=true` (défaut `false`) et `-PplayPreview=true` (suffixe `.apercu`).
  Nouveau `BuildConfig.FACE_KEEPALIVE` (relance horaire / au démarrage, exemption de batterie : sideload `true`, play
  `false`) ; `FACE_UNLOCK` de play suit l'interrupteur.
- `src/playFaceUnlock/AndroidManifest.xml` : copie du manifeste play qui garde `FaceSenseService` et
  `FOREGROUND_SERVICE(_CAMERA)` ; relance (`FaceResumeJob`, `FaceResumeReceiver`) et exemption de batterie restent
  retirées. Choisi par `sourceSets.play.manifest.srcFile` seulement si l'interrupteur est allumé. Test de parité :
  les deux fichiers ne diffèrent que par ces 3 lignes.
- `FaceSensePlugin` : `status` rend `unlockAvailable` et `unlock` (préférence propre au déverrouillage, distincte de
  l'accord `enabled` de la lecture à l'ouverture qui reste le secours) ; `start({ unlock: true })` démarre le service
  en play ; `stopUnlock` ne coupe que lui ; `readNow` rend `skip:unlock` quand le service tourne ; `test` passe par
  FaceOneShot si le service ne tourne pas ; vérification horaire et exemption de batterie sous `FACE_KEEPALIVE`.
- `FaceSenseService` : `runPref()` (« enabled » en sideload, « unlock » en play) ; « Arrêter » de la notification ne
  coupe que le déverrouillage en play ; notification d'importance **basse** en play (icône visible : fonction
  perceptible, règle Play), minimale en sideload comme avant.
- CI (« Test — émulateur Samsung Galaxy A56 », job build) : construit l'APK d'aperçu
  (`assemblePlayDebug -PfaceUnlockPlay=true -PplayPreview=true`), vérifie son manifeste fusionné
  (`check-play-manifest.sh --face-unlock-preview` : identifiant `fr.jpesquet.sante.apercu`, service caméra et Billing
  présents ; ni relance, ni exemption, ni REQUEST_INSTALL_PACKAGES, ni écriture Health Connect) et l'envoie en
  artefact `halcya-apercu-deverrouillage` (14 jours).

## Vérifications
- Vitest **2 167** verts (nouveaux : interrupteur Gradle, parité des manifestes, garde-fous Java) ; build OK ; lint
  inchangé (6 erreurs préexistantes) ; `npm run visual -- --play` OK, capture Sources relue (inchangée, attendu).
- Pas de SDK Android dans la session : la compilation Java et le manifeste de l'aperçu sont vérifiés par la CI de la PR.

## Suite
- **POL-1b** (prochain run de code) : côté app, interrupteur « Aussi à chaque déverrouillage » dans la carte Lecture du
  visage (variante play, seulement si `unlockAvailable`), feuille de divulgation (`permissionDisclosures`, AI Act
  art. 50), demande des notifications, réglage pour couper, état « Lecture au déverrouillage active » ; aucun guide
  Shizuku / ADB ni bouton batterie en play. Ensuite l'APK d'aperçu est prêt à filmer (P28).
