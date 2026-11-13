# 2026-11-08 00:00 UTC — Examen bêta de la nuit soumis ; décisions (A) (B) (C) ; Android v897

**Étape** : décisions du propriétaire et suivi d'Android  ·  **PR** : v897  ·  **Android suivi** : v897 (`450bdb7`)  ·
**iOS** : 896 sur TestFlight (896.376, version 893), **soumise à l'examen bêta** ; version 844 dans App Store Connect,
build 844.344 attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md`, trois lignes du 08/11 00:35 : **Décisions du propriétaire (07/11 au soir)** : (A) mode polish dès le
  9/11 (à partir de la version envoyée aux testeurs le 8/11 au soir) ; (B) intégrations dans l'ordre Garmin et Samsung,
  Withings, Huawei (dont Huawei Health Kit sur iPhone), Xiaomi, avec garde-fous ; (C) simulation de personas avant
  chaque envoi aux testeurs. Reportées : README (résumé), BACKLOG (POLISH, INTÉGRATIONS, PERSONAS).

## Examen bêta
- Fin du run précédent : correctif #363 mergé (`eda6d96`) ; `store-beta-submit.yml` relancé (23:17 UTC) : « « À tester »
  (fr-FR) déjà là, gardé. Ajoutée au groupe externe « Testeurs Halcya ». Soumise à l'examen bêta d'Apple. » ; « La
  version de l'App Store n'a pas été touchée. »
- Relevé de 00:02 UTC : 896.376 « WAITING_FOR_REVIEW » ; 839.337 et 817.312 en test.

## Android depuis le run précédent
- #819 (T1) Tendances s'ouvre sur une courbe ; décisions du 07/11 au soir inscrites.

## Ce qui a été fait
- `scripts/upstream.sh --latest` → v897 : 41 correctifs tels quels ; 3573 tests, build appstore et lint passent.
- PARITE, README, BACKLOG.

## Suite
- Vérifications, merge, TestFlight (version 893). Relevé de l'examen bêta de la 896.376 à chaque run ; ligne en tête de
  `POUR-ORCHESTRATEUR.md` dès qu'elle passe en test ou est refusée.
