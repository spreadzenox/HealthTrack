# 2026-10-27 19:59 UTC — Essai d'import Santé (PR #11) : plantage expliqué, corrections

**Étape** : I4 (vérification de l'import)  ·  **PR** : #11  ·  **Android suivi** : v527  ·  **iOS** : 527 (simulateur)  ·  **Parité** : 23 % (11/47)

## Déclenchement
- Tâche planifiée de 19:59 UTC, à l'heure. `main` vert ; PR #11 ouverte (travail en cours).

## Ce qu'Android a livré depuis le run précédent
- Rien de nouveau depuis v527.

## Constats sur la 1re CI de la PR #11 (verte, mais l'essai a échoué)
- La sonde s'arrête après `checkAuthorization` : **l'app est fermée par iOS** à la demande d'écriture des pas, faute
  de phrase d'usage (`NSHealthUpdateUsageDescription must be set in the app's Info.plist in order to request write
  authorization … HKQuantityTypeIdentifierStepCount`, dans la console). Le script a ensuite attendu sa limite de
  15 min sur chaque iPhone (d'où 40 min de captures).
- `idb-companion` ne s'est pas installé (`brew install` en échec, sortie masquée) : la feuille n'aurait pas pu être
  touchée de toute façon. D'après la documentation d'idb, le paquet Homebrew est une version précompilée qui
  demande un Mac arm64 sous macOS 15 et Xcode 26 (https://fbidb.io/docs/idb/installation).
- Les 2 lignes de `js-errors.txt` venaient de l'ancienne lecture de la copie de secours (corrigée par la PR #10).

## Ce qui a été fait
- Branche remise à jour sur `main` (PR #10).
- `ios-build.yml` : la phrase d'écriture Santé est ajoutée par la CI à la **seule build de captures**
  (`PlistBuddy`), jamais à `ios/App/App/Info.plist` du dépôt : l'app livrée n'écrit rien dans Santé.
- `scripts/ios-captures.sh` : arrêt immédiat si l'app se ferme en cours de parcours, avec la ligne
  « Terminating app » de la console, au lieu d'attendre la limite.
- Journal de l'installation d'`idb` affiché en cas d'échec.

## 2e CI de la PR #11 (verte)
- Plus de plantage : la sonde va jusqu'au bout (« feuille toujours ouverte : pas d'écriture ni de relecture »),
  feuille capturée sur les deux iPhone, 0 erreur JavaScript, captures en 21 min.
- `idb` toujours inutilisable : Homebrew refuse le dépôt tiers de Facebook tant qu'il n'est pas approuvé
  (« Refusing to load formula facebook/fb/idb-companion from untrusted tap facebook/fb. Run `brew trust …` »), et le
  client cherche son compagnon dans `/usr/local/bin`. L'approbation (`brew trust facebook/fb`) a été **refusée par
  le contrôle de sécurité de la session** (intégration de code non approuvé) : c'est une protection de Homebrew, je
  ne la contourne pas. Étapes `idb` retirées de la CI et du script.

## Suite
- Accepter la feuille par un test d'interface XCUITest écrit ici (sans bibliothèque tierce : toucher « Tout
  activer » puis « Autoriser » dans l'app), cible de test ajoutée au projet ; puis `saveSample` / `readSamples`
  (1234 pas) et l'import par le connecteur jusqu'au Journal.
- Merger la PR #11 après sa 3e CI : phrase d'écriture limitée à la build de captures, arrêt sur plantage, sonde.
