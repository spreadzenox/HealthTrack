# 2026-11-03 10:00 UTC — Run court ; App Attest à vérifier sur un vrai iPhone

**Étape** : I9 (préparation de la soumission du 7 ou du 8/11)  ·  **PR** : journal  ·  **Android suivi** : v734
(`9bd117b`)  ·  **iOS** : 734 sur TestFlight (734.241) ; version 717 dans App Store Connect, build 717.216 attachée  ·
**Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- Aucun.

## Android depuis le run précédent
- #651 : journal seulement. Bilan du relais avant les testeurs : la période de lancement de l'iPhone se termine bien
  le 6/11 (`2026-11-06T23:00Z`). Pour App Attest, la route du défi est active mais **aucune clé n'est enregistrée**
  (« normal, l'app iPhone ne signe pas encore ») au déploiement du 2/11 à 22:57 UTC. La première build qui signe
  (722.221) est sortie après, et personne ne l'a encore installée (aucun testeur, A6). Pas d'envoi sur Google Play.

## Ce qui a été fait
- `store/app-store/soumission.md`, vérification du 7/11 au matin : une analyse de repas sur la build finale (TestFlight)
  enregistre la clé App Attest de l'iPhone. Le bilan du relais d'Android la compte alors (observation, jamais
  bloquante).
- CI de `main` : build simulateur de la v734 en cours sur `124b074`.

## Suite
- Suivi d'Android à chaque run ; le 6/11 : build finale, version renommée, numéro de build donné au propriétaire.
