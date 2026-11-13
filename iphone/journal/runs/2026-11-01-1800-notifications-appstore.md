# 2026-11-01 18:00 UTC — Android v691 (notifications de l'App Store au relais) ; adresse réglée par l'API ; brouillon de la vente

**Étape** : I6 (abonnement), suivi d'Android  ·  **PR** : #182 (rappel de fin d'essai, v691, notifications) mergée ; journal (#178) ; branche `claude/ios-achat-iphone-011815` (brouillon, sans PR)  ·  **Android suivi** : v691 (`0f0d705`)  ·  **iOS** : 691 sur `main` et sur TestFlight (691.183)  ·  **Parité** : 48 % (23/48)

## Messages du propriétaire depuis le run précédent
- Aucun.

## Android depuis le run précédent
- **#607 (v691) : le relais reçoit les notifications serveur V2 de l'App Store** (I6-RELAIS-3) : `POST
  /appstore/notifications`, `signedPayload` vérifié jusqu'à Apple Root CA - G3 ; remboursement, révocation,
  expiration, fin de grâce → abonnement verrouillé (empreinte de `originalTransactionId`, Firestore, aucun identifiant
  de personne), levé par un renouvellement ou un nouvel achat. Adresse donnée par Android au propriétaire, à coller
  dans App Store Connect (production et sandbox, version 2). Rien dans l'app.
- Suite annoncée par Android : I6-RELAIS-6, le nom du magasin dans l'écran d'abonnement.

## Ce qui a été fait
- **Adresse des notifications réglée par l'API plutôt que par le propriétaire** : `store-subscriptions.mjs` règle
  `subscriptionStatusUrl…` de l'app (V2, production et sandbox) si elle est vide, ne remplace jamais une autre adresse
  (écart signalé) ; attributs vérifiés dans la spécification OpenAPI d'App Store Connect ; 13 tests ; à lancer après
  le merge de #182.
- v691 ajoutée à #182 (35 correctifs tels quels, 3077 tests, build appstore) ; CI d'avant annulée ; PARITE.
- **Brouillon de la vente sur iPhone** (branche `claude/ios-achat-iphone-011815`, poussée sans PR, à publier avec
  l'ouverture de l'achat) : conditions (abonnements Silver et Gold par l'App Store : contenu, essai une fois par compte
  Apple, renouvellement automatique et délai de 24 h, changement de formule, annulation, grâce, remboursements par
  Apple, rétractation, restauration), confidentialité (transaction signée vérifiée par le relais, notifications de
  l'App Store, empreinte seulement), fiche (paragraphe « Abonnements facultatifs » avec le lien vers les conditions,
  exigé par Apple ; 3908/4000 caractères).

- #182 : CI macOS verte (4 tests `TrialReminderRuleTests` et 3 `SnapshotFolderTests` passés, l'app compile avec le
  plugin, aucune erreur JS ni texte d'Android) ; **mergée** ; TestFlight 691 lancé ; **« Abonnements App Store —
  création » relancé : adresse des notifications serveur réglée (V2, production et sandbox)**, abonnements déjà en
  place, rien de recréé, toujours `MISSING_METADATA` (capture pour l'examen).
- **TestFlight 691.183** (19:41) ; fiche renvoyée sans captures (version 689 renommée 691).

## Suite
- Dès I6-RELAIS-6 chez Android : PR d'ouverture de l'achat sur la branche du brouillon (`FEATURES.billing`, captures
  de l'écran d'achat avec les trois formules, capture pour l'examen envoyée, tests des pages adaptés).
- Run de dimanche 23:00 UTC : archiver le résumé de la semaine S44.
