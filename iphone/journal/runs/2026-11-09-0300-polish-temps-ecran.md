# 2026-11-09 03:00 UTC — Polish : temps d'écran à l'accueil sous iOS 26.4 (correctif 55)

**Étape** : POLISH  ·  **PR** : polish temps d'écran  ·  **Android suivi** : v929 (`1a8ff81`)  ·  **iOS** : 928 sur TestFlight
(928.405), 929 à l'envoi ; 918.396 prête pour les testeurs externes ; version 844 dans App Store Connect, build 844.344
attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf depuis 22:50.

## Examen bêta
- Relevé de 02:59 UTC : 918.396 « READY_FOR_BETA_SUBMISSION », 839.337 en test ; hors du groupe, 896.376 toujours
  « WAITING_FOR_REVIEW ». Pas de nouvel essai ; message au propriétaire inchangé.

## Fin du run précédent
- #393 (v929) : trois vérifications vertes, captures sans erreur ; mergée (`14192e0`) ; TestFlight lancée.

## Android depuis le run précédent
- Rien : `main` toujours à `1a8ff81` (v929).

## Ce qui a été fait (mode polish)
- **Correctif 55** : le nouvel accueil d'Android affiche la ligne « Temps d'écran » dès que le module natif existe
  (`isPhoneUsageAvailable`) ; sur un iPhone sous iOS 26.4, elle ne servait à rien (retour du premier testeur du 6/11,
  réglé pour Sources par le correctif 44, pas pour l'accueil, nouveau). Elle n'est plus proposée quand
  `checkPhoneUsageAccess` répond `supported: false`, sauf si le temps d'écran était déjà activé. Test d'abord (rouge
  puis vert) ; note de Nouveautés iPhone.
- Vérifié en local : 46 correctifs, Vitest 3635 tests, build appstore, ESLint.

## Suite
- Merge après les vérifications ; examen bêta de la 918 dès que la 896 n'est plus en examen.
