# Run 11/11 05:35 — « Réglages › Paramètres » (POLISH-SIM-44)

**Type** : code (mode polish).

## Contexte
- Main vert (e5415fd, #907). Aucune PR « [Auto] » ouverte. Alpha 100984 en examen chez Google (envoyé le 11/11 à 03:16).

## Fait
- **POLISH-SIM-44** (Stressé J1) : l'accueil disait « Vous pourrez le changer dans Paramètres », la roue ouvre une page
  « Réglages » (où « Paramètres » est la 2e ligne). Plutôt que de renommer une page (la navigation et les réglages ne
  se ressemblent pas, leçon 18), chaque renvoi donne le chemin depuis la roue :
  - Accueil › objectif : « Vous pourrez le changer dans Réglages › Paramètres (roue en haut à droite). »
  - Accueil › visage, « Comment l'arrêter » : « à tout moment, dans Réglages › Paramètres ».
  - Rappel du soir : « Réglable dans Paramètres » → « À changer dans Réglages › Paramètres ».
  - Agir, suivi digestif masqué : « Réglages › Paramètres › Ce qui vous amène ».
  - Les textes sur la clé Gemini (sideload) disaient déjà « Réglages (roue en haut à droite) → Paramètres ».
- `journal/maquettes/accueil/TEXTES.md` annoté. Nouveautés : `2026-11-11-0535-reglages-parametres.json`.

## Vérifs
- TDD : 2 tests de `Onboarding.test.jsx` rouges puis verts (le 2e lit la source : l'écran du visage n'existe pas en jsdom).
- `npm run test` complet vert (3417), lint 0 erreur, build, `npm run visual` complet (aucune erreur JS).
- Captures relues : `--play --onboarding=goal` et `--play --face=on --onboarding=face` :
  `captures/2026-11-11-0535-reglages-objectif.png`, `…-visage.png`.

## Suite
- POLISH-SIM-40 (à reproduire), 41, 42, 45, 37, 39.
- CYCLE-3 attend P48 (propriétaire).
