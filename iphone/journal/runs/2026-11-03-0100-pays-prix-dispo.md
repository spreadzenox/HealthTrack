# 2026-11-03 01:00 UTC — Abonnements dans les 5 pays de P32 ; l'app n'a ni prix ni pays chez Apple

**Étape** : I9 (publication : préparation de la soumission du 7 ou du 8/11), suivi d'Android  ·  **PR** : #224, #225,
#226 (mergées), journal  ·  **Android suivi** : v725 (`ab16d9a`)  ·  **iOS** : 725 sur TestFlight
(725.227) ; version 717 dans App Store Connect, build 717.216 attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- Aucun.

## Android depuis le run précédent
- #641 (v725, P32) : abonnements Google Play vendables dans les 5 pays de la production, décidés par le propriétaire
  le 2/11 (France, Belgique, Suisse, Luxembourg, Canada ; jamais les États-Unis). Prix : zone euro au prix français,
  Suisse 4,90 / 29,00 / 9,90 CHF, Canada 6,99 / 39,99 / 12,99 $CA. Scripts de Google Play seulement.

## Ce qui a été fait
- **#224** : les abonnements d'Apple dans les mêmes 5 pays.
  - `TERRITORIES`, prix par pays (ceux d'Android), disponibilité étendue en gardant les pays ouverts ;
  - essai de 2 semaines dans chaque pays ; prix français jamais renvoyé ; palier absent signalé ;
  - 18 tests.
- **Workflow « Abonnements App Store »** (run 41557291477) :
  - les 3 abonnements sont en vente en FRA, BEL, LUX, CHE et CAN ;
  - prix fixés : 9,90 CHF / 12,99 $CA (Gold), 29,00 CHF / 39,99 $CA (Silver annuel), 4,90 CHF / 6,99 $CA (Silver
    mensuel), zone euro au prix français ;
  - essai créé en BEL, LUX, CHE, CAN ;
  - aucun palier manquant.
- **Constat** : la disponibilité de l'app chez Apple répondait 404.
  - #225 rend le relevé explicite et lit aussi le prix de l'app (run 41557584950) : « disponibilité de l'app non
    réglée (« Prix et disponibilité » vide) ; prix de l'app non réglé ».
  - La page « Prix et disponibilité » de l'app n'a jamais été remplie. C'est la piste la plus probable pour l'état
    `MISSING_METADATA` des abonnements alors que tout le reste est en place, et pour la section des abonnements
    absente de la page de la version.
  - C'est un réglage du propriétaire (comme les pays de Google Play le jour de la production) : préparé pas à pas en
    tête du résumé ; il peut aussi répondre « ok prix et disponibilité » pour que la routine le fasse par l'API
    (gratuit, 5 pays de P32).

- **v725** : `scripts/upstream.sh --latest` ; 35 correctifs tels quels, 3173 tests et build appstore ; **#226 mergée**
  (CI macOS verte, aucune erreur JS ni texte d'Android) ; **TestFlight 725.227** (run 41561126764) ; fiche renvoyée
  (run 41561797120) : version 717 gardée, captures iPad et iPhone 8/8 traitées.

## Suite
- Après « Prix et disponibilité » : relire l'état des abonnements (workflow « Abonnements App Store »).
- Avant le 7/11 : liste de contrôle de la soumission (BACKLOG).
