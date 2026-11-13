# 2026-11-10 09:00 UTC — Déploiement continu : 962.437 chez les testeurs ; suivi d'Android v965

**Étape** : décisions du propriétaire (déploiement continu)  ·  **PR** : v965 + journal  ·  **Android suivi** : v965
(`ec13d3c`)  ·  **iOS** : **962.437 sur TestFlight et chez les testeurs externes** ; version 844 dans App Store Connect,
build 844.344 attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- Dans cette session (10/11 vers 09:30) : autorisation du nettoyage réel sans redemander (run de 08:15 UTC).
- `POUR-IOS.md` 10/11 09:10, **décision du propriétaire (vers 09:05)**, ses mots : « J'ai nettoyé et déployé la
  derniere version sur externzl testeur sur apple, le trick du non changement de version fonctionne bien :) ça a
  déployé instantanément :) » : c'est lui qui a mis la 959.434 chez les testeurs. Consigne : relever la build des
  testeurs et le nombre de builds actives (fait : voir plus bas).
- `POUR-IOS.md` 10/11 09:15, **décision du propriétaire (vers 09:15)**, ses mots : « Ceci dit normalement la clé api
  apple permet à la routine de le faire j'aimerais qu'elle le fasse tout seul pour que le déploiement des nouvelles
  versions soit le plus continuous possible :) » : (1) à chaque run, la build TestFlight la plus récente traitée et pas
  encore chez les testeurs externes part au groupe et à l'examen, sans attendre le soir ; (2) dès qu'elle y est,
  nettoyage réel.

## Examen bêta et déploiement continu
- Relevé de 09:00 UTC : 959.434 seule dans le groupe (en test) ; hors du groupe : aucune.
- `store-beta-submit.yml` (run 42787092826) : « Build 962.437 (traitée par Apple). », « À tester » (fr-FR) complété,
  ajoutée au groupe « Testeurs Halcya », soumise à l'examen bêta ; la version de l'App Store n'a pas été touchée.
- Relevé de 09:01 UTC : **962.437 APPROVED, IN_BETA_TESTING** (accord d'Apple en moins d'une minute).
- Nettoyage réel (run 42787291304) : 3 builds actives avant ; gardées 844.344 et 962.437 (distribuée, la plus récente) ;
  **959.434 expirée**. Restent 2 builds actives.

## Android depuis le run précédent (v962 → v965)
- #884, #885 : journal (relais iOS). #886 : gel Alpha levé (`app/scripts/play/review-freeze.json`), envoi Alpha
  immédiat côté Android. Rien dans l'app. 47 correctifs sans retouche.

## Vérifications
- `scripts/upstream.sh` (47 correctifs) ; Vitest, build appstore, ESLint, tests des scripts, fiche.

## Suite
- Après chaque merge : TestFlight → fiche → soumission dès que la build est traitée → relevé jusqu'à `IN_BETA_TESTING`
  → nettoyage. Personas chaque jour, sans bloquer les envois.
