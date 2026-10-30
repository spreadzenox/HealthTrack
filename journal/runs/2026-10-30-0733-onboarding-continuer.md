# Run du 30/10/2026 07:33 (Paris, CET) — Onboarding : « Continuer » désactivé lisible (POL-PLAY-58)

**Type** : 🎨 Code (polissage de la version play, audit POL-PLAY-12)

## Constat au démarrage
- Main à `cbb8481` (#520), tous les workflows verts ; aucune PR « [Auto] » ouverte (seule #51, non « [Auto] », non touchée).
- Audit prévu : onboarding play à 360 px en sombre. Captures `npm run visual -- --play --dark --size=360x780` :
  premier écran (`--empty --onboarding`), suivis (`--click="Mon ventre > Continuer"`), montre, visage (`--face=on
  --onboarding=face`), premier geste ventre, « aha » et paywall de lancement (`--subscription=launch`).
- Défaut : « Continuer » désactivé (aucun objectif, aucune montre choisie) = `.btn:disabled` (opacité 0,6) sur fond
  émeraude : en sombre comme en clair, il ressemble à un bouton actif, qui ne réagit pas au toucher. C'est la toute
  première action d'un nouvel utilisateur.

## Fait
- `Onboarding.css` : `.onb-continue:disabled` → fond `--surface`, texte `--text-muted`, bordure `--border`,
  opacité 1. Redevient émeraude dès qu'un choix est fait (inchangé).
- Lint : `import process from 'node:process'` dans `nutritionLegend.test.js` (et le nouveau test) → 7 → 6 erreurs.

## Tests
- `onboardingContinue.test.js` (règle CSS du bouton désactivé).

## Vérifications
- `npm run test` (2714 ✔), `npm run build`, `npm run lint` (6 erreurs, 7 avant), `npm run visual` ; captures avant /
  après du premier écran en sombre et en clair (bouton gris neutre, lisible, sans air « actif »).

## Laissé
- Le compteur « 01/05 » devient « 03/07 » quand on choisit une montre Health Connect (étapes ajoutées) : la barre reste
  juste ; noté dans BACKLOG (POL-PLAY-58).

## Données
- Aucune : style seulement.

## Demandes iOS
- Commun aux deux plateformes : note de Nouveautés sans `variants`.

## Suite
- POL-PLAY-12 terminé sur la variante play (toutes les pages vierges et démo relues). Ensuite : POL-PLAY-11 quand
  Android vitals le permet ; reste du BACKLOG par impact.
