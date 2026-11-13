# 2026-11-08 15:00 UTC — Premier passage des personas iPhone ; « kca l » du Journal (correctif 51)

**Étape** : PERSONAS + POLISH  ·  **PR** : personas iPhone  ·  **Android suivi** : v911 (`e22e1dd`)  ·  **iOS** : 911 sur
TestFlight (911.391, version 893) ; 896.376 en examen bêta ; version 844 dans App Store Connect, build 844.344 attachée
·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf depuis 00:35.

## Fin du run précédent
- #377 (v911, correctif 19 refait) : vérifications vertes, captures regardées (Sources : « cœur au repos, variabilité
  cardiaque (SDNN) », « Jamais reçu : oxygène du sang » ; Tendances : « attendu » au-dessus du futur), mergée
  (`0f71b92`) ; TestFlight **911.391** ; fiche envoyée (version 844 et build 844.344 inchangées).

## Examen bêta
- Relevé de 15:05 UTC (lecture seule) : 896.376 toujours « WAITING_FOR_REVIEW » ; 839.337 et 817.312 en test.

## Android depuis le run précédent
- Rien : `main` toujours à `e22e1dd` (v911).

## Ce qui a été fait
- **Passage des personas iPhone** (décision (C)) : outil d'Android avec le correctif 49, deux agents à accès visuel
  seul, tirage pondéré (deux fois « iPhone seul », J45 : personas 6 et 4). Rapports, captures et synthèse dans
  `journal/simulations/` (`2026-11-08-1510-*`). Tri : un défaut propre à l'écran de l'iPhone corrigé ; deux limites de
  l'outil écartées après lecture du code (partage du PDF : correctif 09 sur iPhone ; « Aucun aliment reconnu » : réponse
  vide du faux relais) ; constats du code partagé relayés à Android (`DEMANDES.md`) ; idées de fonction notées pour une
  proposition avec maquette (mode polish).
- **Correctif 51** : Journal › Jours, tuile des repas « ≈ 1 039 kca l » (aucune coupure permise, `overflow-wrap:
  anywhere`) : espace ordinaire avant « kcal », le nombre reste entier ; test iPhone d'abord (rouge puis vert), test
  POL-PLAY-8 d'Android ajusté dans le correctif ; note de Nouveautés iPhone. Vérifié en local : 44 correctifs, Vitest
  3592 tests, build appstore, ESLint.

## Suite
- Merge après les vérifications et la capture du Journal, puis TestFlight et fiche.
- Ce soir : second passage des personas sur la dernière version, puis examen bêta après 23:45.
