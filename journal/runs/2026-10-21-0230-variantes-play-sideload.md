# 2026-10-21 02:30 Paris (00:30 UTC) — Jalon 3a : variantes play / sideload, AAB play signé par la CI

**Type** : 🧭📦 produit / build · **PR** : voir « Après le merge »

## Pourquoi
- Main à `408a60b` (#241), tous les workflows verts, v190 publiée ; aucune PR « [Auto] » ouverte (seule #51
  `cursor/*`, hors périmètre). Run de 02:30 → run de code. Signalement du 20/10 19:05 déjà corrigé (v188).
- Prochaine étape notée par le run précédent : **jalon 3** (le test fermé Play dure 14 jours : une première variante
  play installable au plus tôt).

## Ce qui a été fait
- **Android** (`app/android/app/build.gradle`) : dimension `distribution`, flavors `sideload` (`com.healthtrack.app`,
  inchangé : les mises à jour s'installent toujours par-dessus) et `play` (`fr.jpesquet.sante`, neutre, définitif,
  sans nom commercial ; coexistence possible). `REQUEST_INSTALL_PACKAGES` déplacée dans `src/sideload/AndroidManifest.xml`.
  `BuildConfig.SELF_UPDATE` : `AppUpdatePlugin` n'est enregistré que dans la sideload. `versionCode` / `versionName`
  depuis `-PhtVersionCode` (1 par défaut). Signature `upload` (PKCS12, alias `upload`) lue dans `HT_UPLOAD_KEYSTORE` /
  `HT_UPLOAD_PASSWORD`, seulement si présents.
- **JS** : `src/config/distribution.js` (`VITE_DISTRIBUTION`, `sideload` par défaut et pour toute valeur inconnue,
  `FEATURES.selfUpdate`) ; `UpdateBanner` ne rend rien et n'interroge pas GitHub en play.
- **CI** : « Build & Release » → `assembleSideloadDebug -PhtVersionCode=<run>` (APK v191 → versionCode 191, plus de
  versionCode 1 figé) ; check « Build APK » → sideload + tests instrumentés + `bundlePlayRelease` non signé, puis
  `scripts/check-play-manifest.sh` (identifiants et permission dans les manifestes fusionnés) ; nouveau workflow
  **« Play — AAB »** (push `main` / `workflow_dispatch`) : WIF → Secret Manager (échec immédiat et explicite si le
  secret manque — NOT_FOUND → P9, PERMISSION_DENIED → commande `gcloud` exacte) → `keytool` vérifie alias et mot de
  passe → build web `VITE_DISTRIBUTION=play` → AAB signé, `versionCode` = nombre de commits de `main` → `jarsigner
  -verify` + manifeste → artefact `HealthTrack-play-NNN` (30 j) + empreinte SHA-256 du certificat dans le résumé.
  Mot de passe masqué (`::add-mask::`), clé effacée du runner même en cas d'échec.
- **Correction au passage** : `loadNutritionEntries(now)` calculait la fenêtre des repas avec l'horloge réelle au lieu
  de `now` (`getRecentWindowStart` prend maintenant `now`) — le test `nutritionData.test.js` (daté du 14/10) est devenu
  rouge aujourd'hui, une semaine plus tard ; sans effet visible dans l'app (elle passe toujours l'heure réelle).
- **Journal** : PRODUIT (jalon 3a, choix de l'applicationId, **P9 et P10 pas à pas avec les commandes exactes**),
  INFRA (tableau des workflows), BACKLOG (3a coché, 3b / 3c / 3d), charte (« Play — AAB » rouge jusqu'à P9 = attendu),
  `app/BUILD_APK.md` (variantes).
- Pas d'entrée « Nouveautés » : rien de visible dans l'app sideload.

## Vérifications
- Vitest : **1 660 verts** (+7 : `distribution.test.js` 3, `distribution.android.test.js` 3, UpdateBanner +1).
  `npm run build` ✅ (et `VITE_DISTRIBUTION=play` ✅). `npm run lint` : 6 erreurs, identiques à main.
- `npm run visual` sans erreur JS ; `--routes=/ --update-banner=progress` : le bandeau de la sideload est intact (capture lue).
- `check-play-manifest.sh` testé sur des manifestes simulés (cas valide, cas play fautif). Pas de SDK Android local :
  la compilation Gradle des deux flavors et le vrai manifeste fusionné sont vérifiés par le check « Build APK » de la PR.

## Apprentissages / décisions
- **Rouge attendu** : « Play — AAB » échouera sur `main` jusqu'à P9 — c'est ce que demande le prompt (« échouer
  proprement avec un message clair ») ; noté dans la charte pour que les runs suivants ne le prennent pas pour une panne.
- `versionCode` play = nombre de commits de `main` plutôt que le numéro de run : survit à un renommage du workflow.
- La sideload passe de versionCode 1 à 191 : montée de version, aucune incidence sur l'installation par-dessus.

## Suite proposée
- Propriétaire : **P9** (5 minutes dans Cloud Shell, commandes dans `PRODUIT.md`), puis P8 → P10.
- Prochain run de code : **2 bis (ii) icône « H nuit »** + écran de démarrage, puis **3b** (option caméra play,
  permissions sensibles, divulgations), puis Accueil / navigation 4 onglets.

## Après le merge
- PR **#242** : les 7 checks au vert (Frontend (Vitest), Build APK — qui construit maintenant aussi l'AAB play et vérifie
  les manifestes fusionnés —, Publier l'APK, Protocole montre (Java), Budget de lectures (perf), émulateur A56 API 35 et
  API 36) → fusionnée en squash (`3c8fefe`).
- « Build & Release » réussi : **release v191**, `HealthTrack-v191.apk` = **33 685 409 octets (33,7 Mo)** (versionCode 191).
- **« Play — AAB » vert du premier coup** : les secrets existaient déjà (P9 fait par le propriétaire) → artefact
  **`HealthTrack-play-330`** (17 029 708 octets zippé), versionCode 330. P9 passé à ✅ ; prochaine action : P8 puis P10.
