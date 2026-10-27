# Run du 27/10/2026 15:34 (Paris, CET) — versionCode Play au-dessus de 100487

**Type** : 🏗️ infrastructure Play (priorité du prompt : « versionCode de toutes les versions play suivantes > 100487 »)

## Constat au démarrage
- Main à `27124b0` (#436), aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- Prompt : à 15:17, le propriétaire a publié le brouillon `p28-100487` en test interne depuis la Play Console, accepté.
  Son téléphone est donc sur le versionCode 100487 ; les envois de « Play — AAB » (nombre de commits, ≈ 520) ne lui
  parviendraient plus jamais.

## Fait
- `play-bundle.yml` : `VERSION_CODE = 100000 + nombre de commits` (≥ 100523, strictement croissant), `VERSION_NAME` =
  nombre de commits, passé à Gradle (`-PhtVersionName`) et à l'app (`VITE_APP_VERSION`) : le numéro affiché ne change
  pas d'échelle. Alpha : même numérotation (la 453 en place reste plus petite, elle sera remplacée normalement par la
  prochaine version alpha).
- `play-p28-draft.yml` : brouillon à `50000 + n` : il ne croise jamais « Play — AAB » et, déployé par erreur, ne
  bloquerait plus rien (plus petit que les versions normales).
- `build.gradle` : `versionName` lit `htVersionName` s'il est passé (sideload inchangé).
- `FACE_UNLOCK_INTERNAL: "true"` : le prompt demande la version de test interne « interrupteur allumé si Google
  l'accepte, sinon coupé et erreur notée ». Google a accepté le brouillon publié depuis la Console : on retente par l'API.

## Vérifications
- `npm run test` : 209 fichiers, 2 565 tests verts ; `npm run build` OK ; lint : 6 erreurs, comme avant ;
  `npm run visual -- --play` : 15 pages, 0 erreur JS (Accueil relue, aucun écran touché).

## Merge et envoi
- PR #437 : tous les checks verts (Vitest, Build APK, relais, protocole montre, budget de lectures, brouillon P28,
  émulateurs API 35 et 36) → mergée (squash) en `efcdb21`. « Build & Release » vert : **v318**, APK 34 897 573 octets.
- **« Play — AAB » (run 40524635501) : versionCode 100522 importé (sha256 cd72797b…), manifeste vérifié avec la
  lecture au déverrouillage allumée, et DÉPLOYÉ en test interne** (aucun groupe de testeurs : le propriétaire seul).
  Google n'a plus renvoyé le 403 « Foreground Service permissions » : la publication du brouillon par le propriétaire
  a débloqué la validation par l'API. Alpha (453) inchangée.

## Suite
- Propriétaire : vérifier la mise à jour 100522 sur son téléphone et la lecture au déverrouillage (notification
  permanente avec « Arrêter ») ; regarder la déclaration dans Contenu de l'app ; « P28 faite ».
- Interrupteur laissé allumé pour le test interne. Prochaine version alpha : toujours coupée, numérotée 100000 + n.
- Puis polissage de la version play par impact (BACKLOG, POL-PLAY).
