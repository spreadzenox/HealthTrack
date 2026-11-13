# 2026-11-05 16:00 UTC — Android v809 : photo des selles, masquée sur iPhone jusqu'à la soumission

**Étape** : suivi d'Android  ·  **PR** : v809 (journal compris)  ·  **Android suivi** : v809 (`8234086`)  ·  **iOS** :
807 sur TestFlight (807.305) ; version 717 dans App Store Connect, build 717.216 attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf.

## Android depuis le run précédent
- #726 (SELLES-PHOTO-2) : « Selles : estimer la forme avec une photo » dans Journal → Jours (si le ventre est suivi) :
  accord avant le premier envoi, photo réduite sans métadonnées envoyée au relais (`/v1/stool/analyze`), type de
  Bristol proposé et corrigeable, photo effacée ; `postRelay` prend un chemin ; confidentialité d'Android mise à jour.
- #725 : journal d'Android. (#728, corrections comptées, pas encore envoyée sur Google Play.)

## Ce qui a été fait
- `scripts/upstream.sh --latest` → v809 : **le correctif 38 ne s'appliquait plus** ; refait (TDD) : l'assertion App
  Attest signe le corps exact de toute analyse passant par `postRelay`, selles comprises (test ajouté).
- **Correctif 42** (TDD, `Journal.appstore.test.jsx` rouge puis vert) : photo des selles masquée sur iPhone. Pourquoi :
  à deux jours de la soumission, la phrase d'accès à la caméra (repas et visage seulement), la page de confidentialité
  de l'iPhone et « Confidentialité de l'app » (une photo de selles est une donnée de santé pour Apple : une case de plus
  pour le propriétaire) ne la couvrent pas. Note de Nouveautés cachée sur iPhone (correctif 28, test).
- Décision demandée au propriétaire (`POUR-ORCHESTRATEUR.md`, 05/11 17:15) : garder masqué pour la soumission
  (proposé) ou l'inclure (il coche alors « Santé »). Ce qu'il faudra pour l'ouvrir : BACKLOG.
- Confidentialité d'Android relue (section selles), empreinte mise à jour ; 36 correctifs ; 3413 tests, build
  appstore et lint passent. PARITE (ligne v808–v809, 🟡), README, BACKLOG.

## Suite
- PR v809 : vérifications, Journal regardé (aucun bouton photo des selles), merge ; TestFlight 809 seul ; fiche.
- Demain 6/11 : build finale ; selon la réponse du propriétaire, avec ou sans la photo des selles.
