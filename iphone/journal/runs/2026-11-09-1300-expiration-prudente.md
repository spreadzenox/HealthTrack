# 2026-11-09 13:00 UTC — Livraison continue : l'outil d'expiration garde la build à soumettre

**Étape** : livraison continue (décision du 09/11) + polish  ·  **PR** : outil + journal  ·  **Android suivi** : v940
(`62abe36`, inchangé)  ·  **iOS** : 940 sur TestFlight (940.416) ; 918.396 prête pour les testeurs externes ; version
844 dans App Store Connect, build 844.344 attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf depuis 11:05. Pas de réponse au message de 12:15 ; aucun lancement de
  `store-beta-expire.yml` depuis l'essai de 11:11 UTC.

## Examen bêta
- Relevé de 13:01 UTC (lecture seule) : 918.396 « READY_FOR_BETA_SUBMISSION » ; 839.337 en test ; hors du groupe,
  896.376 toujours « WAITING_FOR_REVIEW ». Rien expiré, rien soumis.

## Fin du run précédent
- #402 (v939, v940 ; correctif 57 refait) : trois vérifications vertes ; captures : Journal « Repas ≈ 479 kcal,
  repas incomplets ? », tuile « VFC (SDNN) » rose ; Analyses sans abonnement ; mergée (`6e02c52`) ; TestFlight
  940.416 ; fiche envoyée (« Version 844 gardée (build 844.344 attachée, choisie par le propriétaire) ; builds en
  893 »). Le nettoyage des builds qui devait suivre (règle du 09/11) n'a pas été lancé : bloqué comme à 12:15.

## Android depuis le run précédent
- Rien de publié (main à `62abe36`, v940).

## Livraison continue
- L'essai de 11:11 montrait que le nettoyage aurait expiré la 918.396 (dans le groupe externe, pas encore soumise) :
  il faudrait toujours le lancer après sa soumission. Plus sûr : `cleanupPlan` garde désormais une build du groupe
  externe sans examen, traitée, plus récente que la distribuée (« dans le groupe externe, à soumettre ») ; une plus
  ancienne que la distribuée ne sert plus et part. Test ajouté (9 tests du script, 55 en tout).
- Marche à suivre écrite dans la charte (§ 4) : TestFlight → `store-beta-expire.yml` « nettoyage » → `store-push.yml` ;
  soumission de la nuit avec la règle des 24 h.

## Polish
- Captures vierges de la v940 relues (Accueil, Sources, Journal, Analyses sur iPhone 16e) : rien de propre à l'iPhone
  à corriger.

## Suite
- Merge (scripts et journal : pas de build macOS) ; essai à blanc du nettoyage sur main pour vérifier que la 918.396
  est gardée ; dès « 896 expirée » ou « permission donnée » : soumission de la 918.396 puis nettoyage.
