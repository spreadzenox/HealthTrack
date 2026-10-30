# Run du 30/10/2026 17:33 (Paris, CET) — Lecture du visage : plantage reproduit, interrupteur coupé (signalement du 30/10 16:35)

**Type** : 🐛 Signalement du propriétaire, priorité absolue

## Constat au démarrage
- Main à `2267b1d` (#530). Aucune PR « [Auto] » ouverte.
- Signalement : « quand je clique sur activer la lecture du visage, ça ferme brutalement l'application » (Galaxy A56,
  version de test interne = play release R8 **avec** faceUnlockPlay).

## Cause (lecture du code ; pas d'émulateur KVM dans la session, reproduction confiée au workflow émulateur)
- `FaceSensePlugin.startService` et `FaceResumeNotice.resumeFromApp` lançaient `FaceSenseService` par
  `ContextCompat.startForegroundService`. Dans `onStartCommand`, deux sorties font `stopSelf()` **sans**
  `startForeground` : caméra non accordée, et `startForeground(…, FOREGROUND_SERVICE_TYPE_CAMERA)` refusé (Android 14+
  lève une `SecurityException` si l'accès caméra « pendant l'utilisation » n'est pas utilisable à cet instant ;
  Android 12+ une `ForegroundServiceStartNotAllowedException` hors premier plan). Un service lancé avec la promesse
  de premier plan et détruit avant de la tenir fait tuer l'app par le système (`RemoteServiceException` « did not
  then call startForeground »). C'est le seul chemin du code de la lecture où un refus d'Android tue le processus.
- Autres pistes vérifiées : R8 — règles keep `ai.onnxruntime`, LiteRT et `org.tensorflow.lite` présentes, et le
  smoke R8 de l'émulateur charge déjà les modèles et lit un visage ; mais il était construit **sans**
  faceUnlockPlay, donc le service caméra n'était jamais exercé en R8. ONNX : les lectures rattrapaient
  `RuntimeException` seulement ; une `LinkageError` / `OutOfMemoryError` sur leur fil aurait aussi fermé l'app.

## Correctif
- `startService` au lieu de `startForegroundService` (l'app est toujours à l'écran quand on démarre le service :
  Android l'autorise, et le service passe au premier plan lui-même). Un refus se termine par `stopSelf` + `lastError`,
  sans plantage. Commentaires dans le code.
- `startFaceUnlock` (JS) attend jusqu'à ~2 s que `status.running` soit vrai ; sinon `started: false` avec l'erreur
  notée depuis le démarrage (une erreur plus ancienne ne compte pas). Carte : « Android n'a pas permis la lecture au
  déverrouillage : elle reste coupée. La lecture à l'ouverture de l'app continue. Réessayez app ouverte. »
- `FaceOneShot`, rafales du service, `readOnce` : rattrapent aussi `LinkageError` et `OutOfMemoryError`.
- Émulateur : l'APK play release R8 est construit avec `-PfaceUnlockPlay=true` (après la vérification des manifestes,
  qui porte sur l'AAB normal) ; `smoke.mjs` démarre la lecture au déverrouillage (service en marche, même processus),
  la coupe, puis la redemande caméra refusée (`cmd appops set … CAMERA ignore`) et vérifie après 12 s que le
  processus est le même.

## Tests (écrits avant le code, rouges puis verts)
- `src/config/faceServiceStart.android.test.js` : aucun `startForegroundService(…FaceSenseService…)` ; lectures qui
  rattrapent les erreurs natives (2 tests, rouges sur l'ancien code Java).
- `faceSense.test.js` : service refusé → `started: false` + erreur, pas de demande de notifications ; erreur ancienne
  ignorée ; démarrage lent accepté.
- `FaceSenseCard.test.jsx` : refus → message clair, interrupteur coupé.

## Vérifications
- `npm run test` (tout vert), `npm run build`, `npm run lint` (6 erreurs, comme avant). Pas de capture : seul un
  message texte change, couvert par le test de la carte.
- CI de la PR : Build APK (compile Java), émulateur A56 (smoke R8 avec les deux scénarios).

## Résultat de l'émulateur (PR #531, premier passage) — le correctif ne suffit pas
- Job API 35 : « Lecture au déverrouillage démarrée (R8) » ÉCHEC — `start({ unlock: true })` sans réponse ; « Caméra
  refusée » ÉCHEC — pid 6146 → 6333 : l'app est tuée (puis relancée) **dès le démarrage normal**, avec la caméra
  accordée. La lecture à l'ouverture (`test`) passe, modèles LiteRT + ONNX chargés. Le script est resté bloqué après
  le plantage (« unsettled top-level await ») : ni logcat ni tampon crash enregistrés.
- Donc : plantage reproduit, cause exacte **pas encore** confirmée. Comme demandé, **`FACE_UNLOCK_INTERNAL` coupé**
  (`play-bundle.yml`) : les prochaines versions de test interne n'ont plus le service caméra.
- Smoke revu : scénarios du déverrouillage en dernier, tampon crash et journal filtré gardés
  (`play_release_unlock.txt`, artefact + log du job), affichés « ⚠️ connu » sans bloquer tant que `UNLOCK_KNOWN` ;
  caméra frontale émulée sur l'AVD API 35 (`hw.camera.front`, `-camera-front emulated`) pour que la capture réelle
  passe aussi par R8.

## Données
- Aucune donnée touchée ; préférences `face_sense` inchangées.

## Suite
- Run suivant : lire la trace (`[release] tampon crash après la lecture au déverrouillage` dans le log du job API 35
  de main, ou `play_release_unlock.txt`), corriger avec un test, puis `UNLOCK_KNOWN = false` et
  `FACE_UNLOCK_INTERNAL: "true"` quand les deux scénarios sont verts. Le propriétaire retest « Activer » (lecture à
  l'ouverture) sur la version de test interne suivante.
