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
- Aucun code de l'app touché ; voir la suite ci-dessous pour les checks, le merge et l'envoi.
