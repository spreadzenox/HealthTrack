# Run du 31/10/2026 08:33 (Paris, CET) — Idées : invitation des testeurs relue contre la v402

**Type** : 💡 idées (journal seul, aucun code produit)

## Constat au démarrage
- Main à `05576ca` (#552) : Tests, Build & Release (v402), Play — AAB et émulateur A56 verts. Aucune PR « [Auto] »
  ouverte (seule #51, `cursor/*`, non touchée). Plantage du visage du 30/10 corrigé (#531) : retest du propriétaire
  attendu, donc pas de code dans ce run « idées ».

## Fait (suite proposée par le run « idées » du 30/10 20:33)
- `INVITATION-TESTEURS.md` relu ligne à ligne contre le code de la v402 :
  - « Votre avis » et « Données » sont derrière la roue dentée « Réglages » (en haut à droite) : chemins précisés
    dans l'invitation et les missions ; bouton réel « Donner mon avis sur le Play Store » (`config/feedback.js`).
  - Le bilan du soir (`TodayCards`), « Tester un groupe FODMAP » (`ReintroductionEntry`, monté seulement si
    `showGut`) et la carte ventre n'existent qu'avec l'objectif « Mon ventre » : missions des jours 3 et 10
    conditionnées, avec une astuce pour passer à « Mon ventre » le temps du test (couvrir « la plupart des
    fonctions », question 2 du formulaire de production).
  - Jour 10 : « export de vos données » → le vrai libellé « Télécharger la sauvegarde ».
  - Prérequis ajouté : Android 8 ou plus récent (`minSdkVersion = 26`), pas d'iPhone.
  - Formulaire (Q10) : « about 2,800 automated tests » (2 770 aujourd'hui).
- Règle Google relue sur l'aide officielle (answer/14151465, 31/10) : 12 testeurs inscrits sans interruption pendant
  au moins 14 jours, toujours inscrits le jour de la demande ; inchangée.
- `IDEES.md` I201 (dont une petite piste code : « Votre avis » directement dans Réglages pendant le test).

## Fichiers
- `journal/INVITATION-TESTEURS.md`, `journal/IDEES.md` (I201), `journal/BACKLOG.md`, `journal/PRODUIT.md`,
  `journal/README.md`.

## Vérifications
- Journal seul ; `npm run test` lancé avant la PR (garde-fou).

## Demandes iOS
- Aucune concernée (rien de visible, pas de note de Nouveautés).

## Suite
- Runs de code : polissage de la version Play (liste BACKLOG par impact) ; POL-PLAY-11 (alpha) après le retest du
  visage par le propriétaire et une journée sans plantage dans Android vitals.
- Prochain run « idées » : relire la page ameli « quand consulter » ; fiche Play à revoir avec I197.
