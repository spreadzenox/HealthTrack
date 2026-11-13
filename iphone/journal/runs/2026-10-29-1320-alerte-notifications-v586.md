# 2026-10-29 13:20 UTC — Essais de Fichiers verts ; alerte des notifications fiabilisée ; Android v586

**Étape** : tests, suivi d'Android  ·  **PR** : #61 (mergée), #62  ·  **Android suivi** : v586  ·  **iOS** : 585 sur `main`, 586 en PR  ·  **Parité** : 49 % (23/47)

## Messages du propriétaire depuis le run précédent
- Aucun. A1 reste en cours. (Déclenchement reçu à 13:19, prévu à 12:59.)

## Ce qui a été fait
- **Merge de #61** : CI verte sur `5081f29` : import, export et rapport réussis sur les deux iPhone (+2 chacun, sans
  avoir eu besoin du nouvel essai d'ouverture du sélecteur), 0 erreur JavaScript, achat d'essai réussi,
  `[healthkit] base` correct. Mais 88 captures au lieu de 94 : sur l'iPhone 17 Pro, l'alerte « Autorisez-vous
  Halcya à vous envoyer des notifications ? » est restée ouverte après le toucher du test (capture prise après le
  test : alerte toujours là ; le test, lui, était « réussi ») ; l'app n'a donc pas eu de réponse et a sauté les trois
  essais de notifications, comme prévu quand elles sont refusées. Branche à jour sur `main` (`da457a6`),
  squash-merge → `43035a2`.
- **#62** : le test touche le bouton « Autoriser » jusqu'à ce que l'alerte disparaisse (trois fois au plus) et
  échoue sinon, au lieu de réussir sans effet.
- **Android v586** (#502) : fer de l'oignon cru mis à « inconnu » (valeur Ciqual suspecte) ; donnée partagée, note
  vraie sur iPhone ; 28 correctifs s'appliquent directement ; suite d'Android : 2840 passés ; builds appstore et
  captures faites.

## Suite
- CI de #62 : 94 captures et les trois essais de notifications sur les deux iPhone ; puis merger.
