# Run 11/11 06:35 — Compter ses cigarettes (POLISH-SIM-42)

**Type** : code (mode polish).

## Contexte
- Main vert (428c0d7, #908). Aucune PR « [Auto] » ouverte (seule la #51, hors routine). Alpha 100984 en examen chez Google.

## Fait
- **POLISH-SIM-42** (Endométriose J1) : « Autre chose » montrait « + 1 cigarette » à tout le monde, et un toucher
  notait une cigarette. La ligne devient « Je fume : compter mes cigarettes » (même apparence que « Décrire un repas ») :
  elle active le compteur (`setCigaretteCounterPinned`), ferme la fenêtre, et « + 1 cigarette » apparaît dans le
  bandeau. Le retrait se fait dans Réglages › Paramètres › Cigarettes (bloc déjà affiché en play quand le compteur est
  actif). Aucun objectif tabac ajouté (mode polish : ce serait une fonction).
- Nouveautés : `2026-11-11-0635-compter-cigarettes.json`.

## Vérifs
- TDD : test `AddStrip.test.jsx` rouge puis vert ; ancien test ajusté (la fenêtre ne contient plus le bouton direct).
- `npm run test` complet vert (3418), lint 0 erreur, build, `npm run visual` complet.
- Captures relues (`--empty --play --click="Autre chose"`, clair et sombre) :
  `captures/2026-11-11-0635-cigarettes-clair.png`, `…-sombre.png`.

## Suite
- POLISH-SIM-40 (à reproduire), 41, 45, 37, 39.
- CYCLE-3 attend P48 (propriétaire).
