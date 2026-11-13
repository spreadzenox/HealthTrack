# 2026-11-08 20:00 UTC — Envoi aux testeurs du soir : 918 ; second passage des personas

**Étape** : examen bêta du soir + PERSONAS  ·  **PR** : envoi du soir  ·  **Android suivi** : v918 (`c04e4fc`)  ·  **iOS** :
**918 sur TestFlight (918.396, version 893), soumise ce soir au groupe externe** ; 896.376 en examen bêta depuis le 7/11
23:17 UTC ; version 844 dans App Store Connect, build 844.344 attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf depuis 18:45 (nouvel accueil, appliqué et mergé).

## Fin du run précédent
- #382 (v917–v918, correctif 53, copie de secours protégée) : trois vérifications vertes ; captures regardées (« trouvé »
  sans Santé, Accueil vide) ; mergée (`ade4afc`) ; TestFlight **918.396** ; fiche envoyée (version 844 et build 844.344
  inchangées). Avant : 916.395 (nouvel accueil) aussi sur TestFlight.

## Android depuis le run précédent
- #843, #844 : la v918 (nouvel accueil) est partie sur Alpha dès 20:00 (heure de Paris) ; **gel jusqu'au 9/11 22:00** :
  pas d'envoi Alpha ce soir à 23:45 (100918 en examen chez Google). #842 (v919, Tendances en toutes lettres) et #845
  (personas sur le nouvel accueil) : au run suivant.

## Envoi du soir (autorisation (b) du propriétaire)
- La dernière version d'Android de la journée envoyée aux testeurs est la v918 : l'équivalent iPhone, **918.396**, est
  ajouté au groupe « Testeurs Halcya » et soumis à l'examen bêta par `store-beta-submit.yml` (build demandée
  explicitement, pour que les testeurs iPhone aient la même version que ceux d'Android, même si d'autres builds
  arrivent sur TestFlight d'ici 23:45).
- **Résultat (20:11 UTC)** : « Build 918.396 (traitée par Apple) », « À tester » (fr-FR) complété, « Ajoutée au groupe
  externe « Testeurs Halcya » », puis `POST /v1/betaAppReviewSubmissions` : **422 « Another build in the same train is
  already in beta review. Please submit it again once it gets completed. »** La 896.376 (même version 893) attend
  depuis le 7/11 23:17 UTC. Rien d'autre à faire côté API sans geste du propriétaire (retirer la 896 de l'examen) :
  `POUR-ORCHESTRATEUR.md` ; nouvelle soumission au premier run après la décision d'Apple sur la 896.
- « À tester » remis à jour (`store/app-store/fr-FR/testflight-a-tester.txt`, 918 caractères) : nouvel accueil, visite
  guidée, Journal › Tendances, Agir.

## Personas (avant l'envoi)
- Deux simulations J45 tirées au hasard (« Tout mesurer » avec Apple Watch et sur iPhone seul) ; synthèse
  `journal/simulations/2026-11-08-2010-synthese.md`. Rien de bloquant pour l'envoi ; « kca l » encore vu dans l'outil
  (cause à chercher demain) ; constats du code commun relayés (`DEMANDES.md`).

## Suite
- Relevé de l'examen bêta à chaque run ; v919 et suivantes ; mode polish dès le 9/11.
