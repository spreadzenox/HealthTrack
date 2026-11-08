# Run 08/11 11:35 — CI : miroir Google de Maven Central

**Type** : 🔧 CI (priorité absolue : main rouge depuis #828). **Branche** : `auto/run-1035` (PR #830, reprise du run
précédent, terminé ; #829 remplacée).

## Constat
- #830 avait réglé le téléchargement de Gradle (script avec reprises et miroir, empreinte vérifiée : étape passée en CI).
- Son « Build APK » échouait ensuite plus loin : `kotlin-compiler-embeddable-2.1.0.jar`, demandé à Maven Central,
  renvoyé vers `github.com/JetBrains/kotlin/releases/download/…` qui répondait **504**. Même panne côté GitHub, autre
  fichier.

## Correctif
- `app/android/build.gradle` (buildscript et allprojects) : `https://maven-central.storage-download.googleapis.com/maven2/`
  (miroir officiel de Maven Central tenu par Google, mêmes artefacts) placé après `google()` et avant `mavenCentral()`,
  qui reste en secours. Vérifié depuis la session : le jar Kotlin (58,8 Mo) s'y télécharge directement.

## Vérifications
- `npm run test` : 3 267 verts ; lint propre ; build OK ; `npm run visual --routes=/` ok (capture de l'Accueil lue).
- Checks de la PR : voir ci-dessous (rempli avant merge).

## Suite
- Si main repasse au vert : release publiée, et l'envoi Alpha de 23:45 prendra la dernière version.
- POLISH-SIM-5, 6, 12, 13 restent au BACKLOG.
