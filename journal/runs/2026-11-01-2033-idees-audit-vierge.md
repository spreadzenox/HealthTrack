# Run du 01/11/2026 20:33 (Paris, CET) — Idées : audit de la version Play vierge

**Type** : 💡 idées (journal seul, aucun code produit)

## Constat au démarrage
- Main à `6b9de64` (#610). Aucune PR « [Auto] » ouverte ; « Build & Release » de v435 vert ; un « Test — émulateur »
  encore en cours sur main (journal seul ici, aucun fichier commun).
- Demandes reprises : I6-RELAIS (01/11 17:10), relecture de l'étape (6) côté iPhone ; critères (1) et (2) de la
  version candidate (audit sur données vierges).

## Fait
- `npm run visual -- --play --empty` (clair, toutes les pages) et `--play --empty --subscription=launch --dark`
  (Accueil, abonnement, Paramètres, Repas, Analyses, historique du bien-être, onboarding) : captures relues, aucune
  erreur JS, aucun débordement.
- Trouvé : **I206 / I6-RELAIS-7** : `trialReminderAvailable()` est vrai sur tout build natif avec facturation
  (l'objet de `registerPlugin` est toujours « vrai »), donc l'app iPhone promettrait le rappel « jour 12 » et
  « Rappel 2 jours avant la fin de l'essai » alors que `trialReminderPlan` ne programme rien hors `source: 'play'`.
- Trouvé : **I207 / POL-PLAY-93** : tuiles Silver / Gold, phrase entière en mono, sur deux lignes.
- Conforme : période de lancement (« Gold offert pendant le test », rien à acheter), Accueil, Analyses et onboarding
  vierges.

## Fichiers
- `journal/IDEES.md` (I206, I207), `journal/BACKLOG.md` (I6-RELAIS-7, POL-PLAY-93), `journal/PRODUIT.md`,
  `journal/README.md`.

## Vérifications
- Journal seul ; `npm run test` lancé avant la PR (garde-fou).

## Suite
- Prochain run de code : I6-RELAIS-7 (petit, testable), puis GOLD-a2, GOLD-a3, POL-PLAY-93.
