# 2026-11-09 11:00 UTC — Livraison continue (expiration des builds) ; suivi d'Android v939

**Étape** : décision du propriétaire + suivi d'Android  ·  **PR** : #401 (outil d'expiration, mergée), v939  ·
**Android suivi** : v939 (`1531123`)  ·  **iOS** : 937 sur TestFlight (937.414) ; 918.396 prête pour les testeurs
externes ; version 844 dans App Store Connect, build 844.344 attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` 09/11 11:05, **décision du propriétaire (vers 11:00)**, ses mots : « Oui de manière générale la routine
  doit expirer les versions précédentes à chaque fois qu'une nouvelle version arrive le but c'est de faire du continuous
  deployment le plus propre possible et rapide ». (a) tout de suite : expirer la 896.376, vérifier qu'elle n'est plus
  en examen, soumettre la 918.396 ; (b) règle durable : après chaque nouvelle build, expirer celles qui ne servent plus
  (garder la build de l'App Store, la dernière distribuée au groupe externe jusqu'à sa remplaçante, celle en examen ;
  examen de plus de 24 h : céder la place à une plus récente). Reportée dans le résumé et le BACKLOG.

## Fin du run précédent
- #400 (v937, correctif 57) : trois vérifications vertes ; captures : Accueil « VFC (SDNN) · hier 51 ms, d'habitude
  49 ms » ; mergée (`f01a63c`) ; TestFlight 937.414 ; fiche envoyée (« Version 844 gardée (build 844.344 attachée,
  choisie par le propriétaire) ; builds en 893 »).

## Livraison continue
- **PR #401** (mergée, `59d8ef5`) : `scripts/store-beta-expire.mjs` + `.github/workflows/store-beta-expire.yml`.
  `--builds` (nommées), `--nettoyage` (règle du 09/11), `--essai`. Seule écriture permise : `PATCH /v1/builds/{id}`
  avec `expired: true` (toute autre écriture refusée avant l'appel) ; version de l'App Store lue seulement ; 844.344
  jamais expirée ; dernière build distribuée refusée en mode nommé ; examen de plus de 24 h signalé. 8 tests sans appel
  réel ; relevé de l'examen bêta après chaque passage.
- **Essai à blanc** (run 42607006505, `builds=896.376`, `nettoyage`, `essai`) : 146 builds non expirées ; build de la
  version de l'App Store 844.344 ; dernière distribuée 839.337 ; en examen 896.376 (soumise le 7/11 à 15:12 heure du
  Pacifique, 35 h) ; gardées 844.344, 839.337, 896.376, 937.414 ; ≈145 à expirer, de 935.413 à 638.121 — **dont la
  918.396**, pas encore soumise : l'ordre sera 896 → soumission de la 918 → nettoyage.
- **Exécution réelle (`builds=896.376`) refusée par le système de permissions de la session** (« Irreversible Deletion
  (general) ») : aucune expiration, aucun contournement. Message à 12:15 dans `POUR-ORCHESTRATEUR.md` : le propriétaire
  lance le workflow lui-même (« builds » = `896.376`) ou autorise ce lancement dans les permissions de la session.
- Soumission de la 918.396 : pas tentée (Apple la refuserait tant que la 896.376 est en examen).

## Android depuis le run précédent (v937 → v939)
- #861 : journal d'Android (relais de la décision vers iOS).
- #862 (POLISH-SIM-23) : Analyses, « pt » expliqué (points de votre note, sur 5), « Comment c'est calculé » en deux
  phrases et la méthode sous « Le détail ». Code partagé, note pour tous. 47 correctifs sans retouche.

## Vérifications
- `scripts/upstream.sh` (47 correctifs) ; Vitest, build appstore, ESLint, tests des scripts (54), fiche.

## Suite
- Dès « 896 expirée » ou « permission donnée » : relevé, soumission de la 918.396, puis nettoyage.
- Merge de la v939 après les vérifications et les captures (Analyses).
