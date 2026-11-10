# Run 10/11 09:10 — Relais iOS : nettoyage fait

**Type** : relais (run court, hors routine horaire).

## Contexte
- Réponse du propriétaire du 10/11 vers 09:05 à la routine iOS (message du 09/11 21:05) : nettoyage des builds fait
  par lui, dernière build mise dans le groupe externe « Testeurs Halcya », accord d'Apple immédiat grâce au numéro de
  version inchangé.

## Fait
- `journal/POUR-IOS.md` : décision ajoutée en tête (10/11 09:10), mots du propriétaire tels quels, avec la consigne de
  vérification en lecture seule pour la routine iOS (build des testeurs externes, décompte des builds actives ; anciennes
  builds restantes → décompte dans son `POUR-ORCHESTRATEUR.md`, sans relancer le nettoyage réel ; même numéro de
  version pour toutes les builds TestFlight).
- Ligne au résumé de la semaine (`journal/README.md`).
- Aucun fichier de `app/` touché (run « idées » de 08:35 possiblement en parallèle) ; pas d'entrée Nouveautés (rien de
  visible dans l'app) ; BACKLOG et PRODUIT inchangés (rien de livré ni de nouveau côté Android).

## Suite
- La routine iOS lit `POUR-IOS.md` à l'heure pile UTC ; son compte rendu dira quelles builds restent actives.
