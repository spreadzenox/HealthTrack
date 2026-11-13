# 2026-11-13 05:00 UTC — Personas du jour ; geste de retour sur iPhone

**Étape** : PERSONAS (passage du jour) puis POLISH  ·  **PR** : #496 (geste de retour, ouverte, mergée au run suivant)
·  **Android suivi** : v1019 (`340bbe1`)  ·  **iOS** : 1019.498 chez les testeurs externes ; version 844 dans App Store
Connect, build 844.344 attachée  ·  **Parité** : 67 % (31/46)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf depuis le 12/11 16:35. Android : rien après #942 (12/11, 17:06 UTC).

## Ce run
- **Passage des personas du 13/11** (version 1019, celle des testeurs) : persona 7 « Stressé et pressé », jamais jouée
  sur iPhone, iPhone + Apple Watch avec la VFC, jour 14, presque rien de noté ; agent sans connaissance de l'app,
  39 gestes. 1 tâche réussie, 1 avec effort, 2 à moitié, 2 ratées. Rapport et synthèse :
  `journal/simulations/2026-11-13-0500-*.md` (8 captures).
- **Propre à l'iPhone, corrigé** : aucun moyen de revenir depuis Réglages, Paramètres et Données (Android a son bouton
  retour ; la vue web de l'iPhone n'avait pas le balayage). `allowsBackForwardNavigationGestures` dans
  `HalcyaBridgeViewController`, test XCTest `BackGestureTests`, note de Nouveautés iPhone : PR #496. Vérifié dans le
  conteneur : `scripts/upstream.sh`, 3832 tests Vitest, build appstore, lint, 57 tests des scripts.
- **Propre à l'iPhone, gardé** : « un ticket GitHub » sous « Votre avis » (à revoir à la sortie), contrôles « façon
  Android » (identité commune) : inscrits au BACKLOG.
- **Code partagé** : 9 constats relayés à Android (`DEMANDES.md`, 13/11) ; limites du banc écartées (VFC RMSSD au lieu
  de SDNN, « Version 0.0.0 », accueil sauté).

## Suite
- #496 : captures et XCTest à regarder, merge, TestFlight, testeurs, nettoyage.
