# 2026-11-07 23:00 UTC — Examen bêta de la nuit : 896.376 ; correctif du script

**Étape** : examen bêta chaque nuit (autorisation du propriétaire du 07/11)  ·  **PR** : correctif de
`store-beta-submit.mjs`  ·  **Android suivi** : v896 (`40832b0`, dernière version du jour)  ·  **iOS** : **896 sur
TestFlight (896.376, version 893)** ; version 844 dans App Store Connect, build 844.344 attachée  ·  **Parité** : 67 %

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf depuis 22:30.

## Examen bêta
- Relevé de 23:05 UTC : inchangé ; 839.337 et 817.312 en test.

## Fin du run précédent (v896)
- #362 : trois vérifications vertes (22:53 UTC) ; aucune erreur JS ni texte d'Android ; Nouveautés regardées (note
  iPhone en tête ; « Version installée : 896 ») ; mergée (`ad3e7af`) ; **TestFlight 896.376** (« Version 893, build
  896.376 (app : version 896 d'Android) ») ; fiche renvoyée (« Version 844 gardée (build 844.344 attachée) ; builds en
  893 »). Le numéro fixe tient : 895.375 et 896.376 acceptées en version 893.

## Android depuis le run précédent
- Rien après v896 : c'est la dernière version de la journée.

## Ce qui a été fait
- `store-beta-submit.yml` (build 896.376), 23:11 UTC : build traitée par Apple ; « À tester » (fr-FR) complété ; puis
  **arrêt** : `GET /v1/builds/{id}/betaGroups` refusé par Apple (403 « The relationship 'betaGroups' does not allow
  'GET_RELATED'. Allowed operations are: CREATE, DELETE »). Ni ajout au groupe ni soumission.
- Correctif : l'appartenance au groupe se lit par `GET /v1/betaGroups/{id}/builds` (déjà utilisé par le relevé) ;
  test : ce chemin refusé n'est plus jamais appelé ; 45/45 tests des scripts.

## Suite
- Merger le correctif, relancer `store-beta-submit.yml` (896.376) : « À tester » déjà là, ajout au groupe, soumission ;
  relevé ensuite.
