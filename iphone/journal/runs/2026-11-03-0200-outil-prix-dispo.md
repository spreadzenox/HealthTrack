# 2026-11-03 02:00 UTC — Prix, disponibilité et Content Rights de l'app par l'API, prêts pour l'accord du propriétaire

**Étape** : I9 (publication : préparation de la soumission du 7 ou du 8/11)  ·  **PR** : #228 (mergée), journal  ·
**Android suivi** : v725 (`ab16d9a`)  ·  **iOS** : 725 sur TestFlight (725.227) ; version 717 dans App Store Connect,
build 717.216 attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- Aucun.

## Android depuis le run précédent
- #642 : journal seulement (abonnements Google Play actifs dans les 5 pays, vérifiés après le merge) ; rien à suivre
  (pas d'envoi sur Google Play).

## Ce qui a été fait
- **#228**, outillage seulement, rien de lancé :
  - `scripts/store-app.mjs` et le workflow manuel « App Store — prix, disponibilité et Content Rights » ;
  - `--prix-et-disponibilite` : app gratuite (palier à 0, France comme territoire de base), disponible dans les 5 pays
    de P32, jamais les États-Unis, pas dans les nouveaux pays ;
  - `--content-rights` : la déclaration choisie par le propriétaire ;
  - ne crée que ce qui manque, ne remplace jamais un réglage en place ;
  - 5 tests contre un App Store Connect simulé ; corps des requêtes vérifiés sur la spécification OpenAPI d'App Store
    Connect (`AppAvailabilityV2CreateRequest`, `AppPriceScheduleCreateRequest`, `contentRightsDeclaration`).
- Le workflow ne sera lancé que sur « ok prix et disponibilité » et sur le choix de Content Rights du propriétaire.
  Sinon, il règle les deux lui-même dans App Store Connect (pas à pas en tête du résumé).

## Suite
- Sur « ok » : lancer le workflow, puis relire l'état des abonnements (workflow « Abonnements App Store »).
- Avant le 7/11 : liste de contrôle de la soumission (BACKLOG).
