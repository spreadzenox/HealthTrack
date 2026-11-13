# 2026-11-02 23:00 UTC — Lot de la soumission (#219) : App Attest, notes pour l'examen, abonnements

**Étape** : I9 (publication : préparation de la soumission du 7 ou du 8/11)  ·  **PR** : #219 (mergée), #220 (mergée), journal  ·
**Android suivi** : v722 (`b7e583e`)  ·  **iOS** : 722 sur TestFlight (722.221, avec App Attest) ; version 717 dans App Store Connect,
build 717.216 attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- Aucun.

## Android depuis le run précédent
- #639 : journal seulement (Alpha 100721 en examen chez Google, invitation des testeurs prête) ; rien dans l'app ni
  dans le relais.

## Ce qui a été fait
- **#219 mergée** (23:45) : remise à jour sur `main` après #218, CI macOS verte, aucune erreur JS ni texte d'Android.
  Elle n'a pas d'écran touché (fiche, scripts, droit de l'app).
- **TestFlight** :
  - premier envoi refusé par notre propre vérification (run 41547835983) : « App Attest (production) absent de l'app
    signée ». Le droit y était (`[Key] …appattest-environment`, `[Value]`, `[String] production`), mais `codesign`
    écrit la valeur deux lignes sous la clé et la vérification n'en lisait qu'une ;
  - **PR #220** : `grep -A2`, essayé sur l'extrait du journal (production acceptée, development refusée), mergée
    (workflow seulement, aucune CI concernée) ;
  - **TestFlight 722.221**, première build avec App Attest en production (run 41548756121).
- **Fiche renvoyée** (run 41549541442) :
  - « Version 717 gardée (build 717.216 attachée…) ; builds en 722 » ;
  - mots-clés 99 caractères (« bien-être ») ;
  - **captures iPad 8/8 traitées, 0 refusée** ; captures iPhone 8/8.
- **Abonnements** (run 41549544906) :
  - noms « Halcya Silver annuel » et « Halcya Silver », description de Gold « IA : 20 par jour, quantités mieux
    estimées » : mis à jour chez Apple ;
  - relevé complet : groupe fr-FR « Halcya » `PREPARE_FOR_SUBMISSION`. Pour chaque abonnement : noms fr-FR, capture
    `COMPLETE`, prix, France, note pour l'examen de 113 caractères (celle du propriétaire), formule `UPFRONT`,
    version 1 `PREPARE_FOR_SUBMISSION`. L'état reste pourtant `MISSING_METADATA` ;
  - l'API n'expose plus aucune pièce manquante (les textes de version sont les mêmes `subscriptionLocalizations`).
    Hypothèse : Apple garde cet état jusqu'à la première soumission avec une version de l'app. Elle se vérifiera le
    jour de la soumission, quand la section des abonnements devra apparaître sur la page de la version.

## Suite
- Avant le 7/11 :
  - sur TestFlight, l'écran d'achat après le 6/11 ;
  - la build finale ; la version renommée (`version_des_builds`) ; le numéro de build donné au propriétaire ;
  - si la section des abonnements n'apparaît toujours pas sur la page de la version, relire avec le propriétaire ce
    qu'App Store Connect affiche sur chaque abonnement.
