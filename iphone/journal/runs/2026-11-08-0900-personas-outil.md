# 2026-11-08 09:00 UTC — Outil des personas en mode iPhone (correctif 49) ; TestFlight 905 relancée

**Étape** : PERSONAS (décision (C) du propriétaire)  ·  **PR** : outil des personas  ·  **Android suivi** : v905
(`b02562f`)  ·  **iOS** : 904 sur TestFlight (904.385) ; 905 en cours d'envoi ; 896.376 en examen bêta ; version 844 dans
App Store Connect, build 844.344 attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf depuis 00:35.

## Examen bêta
- Relevé de 09:00 UTC : 896.376 « WAITING_FOR_REVIEW » ; 839.337 et 817.312 en test.

## Fin du run précédent (v905)
- #372 mergée (`1727a3c`) après trois vérifications vertes ; **TestFlight en échec** à l'étape « Paquets Swift (jusqu'à
  3 essais) » (« Could not resolve package dependencies » trois fois : réseau, avant toute compilation ; la même build
  est passée dans la PR) ; tâche relancée une fois (08:50 UTC) : **même échec** (09:20 UTC). Pas d'autre relance : le
  journal ne dit pas quel paquet ; `testflight.yml` affiche maintenant la fin du journal des paquets Swift et le joint aux
  journaux de la build ; le merge de cette PR (qui touche `patches/`) relance TestFlight sur un nouveau commit.

## Android depuis le run précédent
- Rien : `main` toujours à `b02562f` (v905).

## Ce qui a été fait
- **Correctif 49** : l'outil des personas d'Android (`npm run persona`) accepte `--store=appstore` (variante iPhone,
  écran de 390 × 844). Essai en local : ouverture, gestes, captures. Limites du navigateur notées au BACKLOG (PERSONAS).

## Panne de GitHub (téléchargement des paquets Swift)
- 09:10 UTC : la build simulateur de cette PR échoue aussi (« Could not resolve package dependencies »). Cause trouvée :
  les fichiers binaires de `capacitor-swift-pm` 8.2.0 (`Capacitor.xcframework.zip`, `Cordova.xcframework.zip`, releases
  de GitHub) répondent **504** (passerelle expirée), depuis ce conteneur comme depuis les runners macOS ; un autre
  fichier de release GitHub répond 200. Panne extérieure, pas de code à corriger.
- 09:13 UTC : un essai répond 200, puis 504 de nouveau (09:20 : 3 sur 4) ; la build simulateur de cette PR échoue
  encore. Panne intermittente : résolution des paquets à part dans `ios-build.yml` et 6 essais espacés (30 s, 60 s…)
  dans les deux workflows.
- Parade pour la suite : `actions/cache` de `~/Library/Caches/org.swift.swiftpm` (clé : `CapApp-SPM/Package.swift`)
  dans `testflight.yml` et `ios-build.yml` ; le cache se remplira à la première build réussie.
- 09:24–09:40 UTC : avec ces 6 essais, la build simulateur de cette PR échoue encore (504 aux 6 essais, sur 12 min).
  09:43 UTC : les fichiers de release d'autres dépôts (`cli/cli`, `ionic-team/capacitor`) répondent aussi 504 : panne
  générale des téléchargements de releases chez GitHub, pas propre à Capacitor. Parade de secours étudiée et écartée :
  le paquet npm `@capacitor/ios` n'a que les sources (pas de projet Xcode), recompiler les binaires sans Mac serait un
  chantier ; on attend GitHub. Une surveillance relance la build de cette PR dès que les fichiers répondent.
- Tant que GitHub ne sert pas ces fichiers : pas de build iPhone, donc pas de merge (vérifications rouges) ni de
  TestFlight ; 904.385 reste la dernière build. Relevé à chaque run.

## Suite
- Android a publié après la v905 (`a4887eb`) : au run suivant. Relance de la build de cette PR quand GitHub revient,
  merge si vert, puis TestFlight (905 ou la suivante) ; passage des personas iPhone ce soir, avant l'envoi aux testeurs.
