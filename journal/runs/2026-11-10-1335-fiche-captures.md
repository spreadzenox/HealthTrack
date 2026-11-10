# Run 10/11 13:35 — Fiche du Store : captures à jour (LISTING-CAPTURES)

**Type** : code (mode polish ; fiche du Store).

## Contexte
- Main vert (6273c26 : Tests, Build & Release, Play — AAB, fiche, abonnements, émulateur A56). Aucune PR « [Auto] » ouverte.
- LISTING-CAPTURES (relevé au run de 12:35) : captures de la fiche du 03/11, avant Aujourd'hui, Tendances, Agir (07/11).
  `04-bien-etre` capturait `/bien-etre`, devenu une redirection vers Tendances.

## Fait
- `scripts/store/screenshots.mjs` : 7 captures (Play en accepte 2 à 8) : 01 Aujourd'hui, 02 Tendances, 03 Analyses,
  04 Agir (`--trial=8` : un essai « Dormir au moins 7 h 30 » au jour 8 plutôt que « Rien en cours »), 05 Repas,
  06 Réintroduction, 07 Journal. Quatrième champ facultatif : options de `npm run visual` propres à une capture.
- `build-store-assets.mjs` : une passe de `visual-check` par jeu d'options.
- Tests (`build-store-assets.test.mjs`) : aucune route capturée n'est une redirection (rouge sur l'ancienne liste à
  cause de `/bien-etre`, vert ensuite) ; options bien formées.
- Image de présentation : régénérée identique à l'œil, fichier d'origine gardé (pas de renvoi inutile).
- Planche : `runs/captures/2026-11-10-1335-fiche-captures.png` (relue : aucune donnée réelle, variante play, Gold factice).
- Analyses « Pistes à tester » dit « Aucun lien assez net » sur les données de démo (y compris `--pistes-summary` et
  `--gut-links`) : gardé tel quel, c'est l'écran honnête ; la liste « Ce qui va avec » remplit la capture.

## Vérifs
- `npm run test` : 3 374 verts ; `npm run lint` : aucune erreur ; `npm run build` OK ; captures produites par `npm run visual` (variante play), relues.

## Reste
- Ce soir 23:23 : le workflow « Play — fiche du Store » doit envoyer 7 captures (images remplacées en bloc). Vérifier
  demain le bilan ; si Google refuse : erreur exacte en tête du résumé.
