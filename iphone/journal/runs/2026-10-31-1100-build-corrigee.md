# 2026-10-31 11:00 UTC — build corrigée (638.121) sur TestFlight ; fiche App Store envoyée ; Android v640 préparé

**Étape** : I9 (TestFlight, fiche)  ·  **PR** : #121 et #122 (mergées), #120 (journal), suivi de v640  ·  **Android suivi** : v638 sur `main`, v640 en PR  ·  **iOS** : 638 sur `main` et sur TestFlight (638.121)  ·  **Parité** : 48 % (23/48)

## Messages du propriétaire depuis le run précédent
- 10:44 : l'e-mail d'Apple (ITMS-90683), traité dès le run précédent (#121) et reporté dans son compte rendu.

## Ce qui a été fait
- **#121 mergée** (phrase `NSSpeechRecognitionUsageDescription`) après sa CI verte (audit vide, sondes bonnes).
  - Envoi TestFlight (run 41197665489) : réussi, build **638.121**. La vérification de l'app signée trouve la phrase.
  - C'est la première build qui devrait passer le contrôle d'Apple après l'envoi ; à confirmer par l'absence de nouvel
    e-mail.
- **#122 mergée** (fiche sans « ★ ») : seul `store-check` a tourné (fiche ignorée par la build iOS depuis #119).
  - **Fiche envoyée dans App Store Connect** (`store-push.yml`, run 41197722535) : « Version 1.0 : fiche fr-FR mise à
    jour (description, mots-clés, texte promotionnel, assistance) ; App : nom, sous-titre et confidentialité fr-FR mis à
    jour ». Rien n'est soumis.
- **Android v639 et v640** (#555 journal, #556) préparés sur `claude/ios-suivi-android-1100`, PR ouverte après ce
  journal.
  - #556 touche la page « Données de la montre » (montre Huawei en direct), absente sur iPhone.
  - Sa note de Nouveautés est cachée sur iPhone (`APPSTORE_HIDDEN`, correctif 28), avec une demande à Android dans
    `DEMANDES.md`.
  - 34 correctifs ; tests (2984) et build appstore OK.
- Ordre suivi : la correction urgente d'abord, puis la fiche (contrôle d'une minute), puis ce journal, puis le suivi
  d'Android ouvert sur un `main` à jour, pour une seule CI.

## Suite
- PR de v640 : CI, merge, TestFlight.
- Prochaines étapes d'I9 : captures de la fiche par l'API ; numéro de la version d'App Store Connect (« 1.0 ») à aligner
  sur la build choisie avant la soumission.
