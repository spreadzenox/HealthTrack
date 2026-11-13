# 2026-11-09 20:00 UTC — v950 livrée ; « 896 expirée » confirmé ; nettoyage refusé par la session

**Étape** : examen bêta (décision du 09/11 19:50) + fin du suivi d'Android  ·  **PR** : #410 (mergée) + journal  ·
**Android suivi** : v950 (`2aa4385`)  ·  **iOS** : 946 sur TestFlight (946.422), 950 en route ; **918.396 en examen
bêta** ; version 844 dans App Store Connect, build 844.344 attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` 09/11 19:55, **décision du propriétaire (vers 19:50)**, ses mots : « 896 expirée ». Consigne : vérifier
  (lecture seule) que la 896.376 est expirée et hors examen, soumettre la 918.396 dans le même run, puis appliquer le
  nettoyage (règle du 09/11 11:05, avec la protection de #403) ; si la session refuse encore le lancement réel,
  « n'insiste pas » et l'écrire dans `POUR-ORCHESTRATEUR.md`.

## Examen bêta
- Déjà fait au run précédent (19:01–19:03 UTC) : 896.376 absente des builds actives ; 918.396 soumise (run 42679499099).
- Relevé de 20:00 UTC : 918.396 « WAITING_FOR_REVIEW » (TestFlight externe WAITING_FOR_BETA_REVIEW) ; 839.337 en
  test ; hors du groupe : aucune.
- **Nettoyage réel** (`store-beta-expire.yml`, `nettoyage`, sans essai) lancé une fois : **refusé par le système de
  permissions de la session** (« Irreversible Deletion (general) ») ; rien expiré ; pas d'autre essai. Message au
  propriétaire : `POUR-ORCHESTRATEUR.md` 21:05.

## Fin du run précédent
- #409 (journal : 918.396 soumise) mergée (`0c1e8eb`).
- #410 (v950) : trois vérifications vertes ; captures : Agir « Dormir au moins 7 h 53 » ; mergée (`89c6aaf`) ;
  TestFlight puis fiche lancées.

## Android depuis le run précédent
- #871 : journal d'Android (relais « 896 expirée »). Pas de nouvelle version de l'app (main à `8a91dcc`, journal seul).

## Suite
- Relevé de l'examen de la 918.396 à chaque run ; nettoyage dès « nettoyage fait » ou « permission donnée » ; cette
  nuit, pas d'Alpha d'Android (gel jusqu'au 10/11 22:00) et la 918.396 en examen depuis moins de 24 h : rien à soumettre.
