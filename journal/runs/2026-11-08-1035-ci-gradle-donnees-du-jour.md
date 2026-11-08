# Run 08/11 10:35 — CI : Gradle résistant aux pannes ; données du jour vers Tendances (POLISH-SIM-2)

**Type** : 🛠️ CI + 🎨 code. **Branche** : `auto/run-1035`.

## État trouvé
- « Build & Release », « Play — AAB » et l'émulateur rouges sur main (a4887eb, #828) : le wrapper ne télécharge pas
  `gradle-8.11.1-all.zip` (504 de github.com/gradle/gradle-distributions, puis délai de 10 s dépassé). 4 tentatives
  relancées (dont 3 par ce run) sur plus d'une heure, toutes rouges. Le code n'y est pour rien (Tests verts).
- PR #829 « [Auto] CI : délai de téléchargement de Gradle porté à 120 s » (run précédent, 09:08 UTC) : son « Build APK »
  échoue aussi sur un 504 (relancé deux fois). Je n'ai pas touché à sa branche ; elle devient inutile si celle-ci passe.

## Ce qui a été fait
- `.github/scripts/fetch-gradle.sh` : télécharge la distribution avant la construction, `curl --retry 4
  --retry-all-errors`, puis le miroir Tencent si le serveur officiel ne répond pas ; vérifie l'empreinte SHA-256
  officielle (prise sur services.gradle.org : `89d4e70e…098a`, identique sur le miroir, vérifié depuis la session)
  quelle que soit la source ; pointe le wrapper sur le fichier local. Appelé dans build-release, emulator-samsung-a56,
  play-bundle, play-p28-draft, p28-video.
- `gradle-wrapper.properties` : `distributionSha256Sum` (Gradle la vérifie aussi).
- POLISH-SIM-2 : chaque ligne de « Vos données du jour » est un lien vers sa courbe (`/tendances?mesure=…`), la
  cigarette reste sans lien (pas de courbe) ; le « + » entoure 1,6 s les boutons du bandeau (anneau sans mouvement).
- Tests : `TodayBySource.test.jsx` (2 cas), `StripPlus.test.jsx` (1 cas). Nouveautés : `2026-11-08-1035-donnees-du-jour-courbes.json`.

## Vérifications
- `npm run test` : 3 267 verts ; lint sans erreur ; build OK ; `npm run visual --routes=/` (+ `--dark`) : ok, lignes
  inchangées à l'œil (aucun soulignement). L'anneau du « + » n'apparaît pas sur la capture (prise après les 1,6 s).
- Script lancé depuis la session : 2 × 504 puis succès officiel, empreinte vérifiée. Le check « Build APK » de la PR le
  prouve en CI.

## Résultat CI (PR #830, NON MERGÉE)
- L'étape Gradle marche en CI (« Gradle prêt (empreinte vérifiée) » en 11 s, malgré les 504).
- Mais « Build APK » échoue plus loin, 2 fois : `kotlin-compiler-embeddable-2.1.0.jar`, que Maven Central redirige vers
  github.com/JetBrains/kotlin/releases, répond 504. C'est la même panne des téléchargements de releases GitHub, vue
  depuis les runners (depuis la session, le fichier répond 200). Garde-fou : pas de merge sans « Build APK » vert.

## Suite (run suivant, en premier)
- Relancer les jobs en échec de #830 (`gh api -X POST …/actions/runs/<id>/rerun-failed-jobs`) ; si « Build APK » est
  vert, merger #830 (remise à jour sur main d'abord), puis fermer #829. Si la panne GitHub dure, envisager un cache
  Gradle (`actions/setup-java` avec `cache: gradle`) pour ne plus dépendre du réseau à chaque construction.
- Après merge : vérifier la release (taille de l'APK), « Play — AAB » et l'émulateur ; fermer #829 si inutile.
- POLISH-SIM-2c (« Pas · hier »), 5, 6, 12, 13, 7, 9.
