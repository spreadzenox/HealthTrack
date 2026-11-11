# Run 11/11 18:35 — « Voir un exemple » part de l'écran touché ; export JSON (POLISH-SIM-37)

**Type** : code (mode polish).

## Contexte
- Main 695201e (#919) : Build & Release, Tests, émulateur A56 et Play — AAB verts. Aucune PR « [Auto] » ouverte.
- POLISH-SIM-37 (persona « Tout mesurer ») : Vos données ne disait pas le format de l'export ; Analyses › Digestion,
  « Voir un exemple » relançait la visite générale depuis Aujourd'hui au lieu d'un exemple digestion.

## Fait
- `startTour(from)` : « Voir un exemple » (`SeeExample`) passe l'écran courant ; `TourHost` le transmet à
  `GuidedTour`, qui démarre à la première étape de cet écran (`startIndex`, 0 si la visite n'y passe pas).
- Relancée depuis `/recommendations/ventre`, la visite inclut les étapes digestion même sans l'objectif ventre.
- Vos données : « Un fichier JSON, rangé dans Documents. »
- Banc de captures : `--onboarding=recent` (accueil fini à l'instant, visite déjà vue, objectif stress).
- Tests rouges puis verts : `SeeExample.test.jsx` (nouveau), 2 cas dans `GuidedTour.test.jsx`, 1 dans `Data.test.jsx`.

## Vérifs
- `npm run test` (3449 verts), `npm run lint` (0 problème), `npm run build`, `npm run visual` complet (18 pages ok).
- Captures lues : [exemple digestion au jour 28](captures/2026-11-11-1835-exemple-digestion-jour28.png) (clair, sans
  l'objectif ventre), première étape « Votre digestion » (sombre), [export JSON](captures/2026-11-11-1835-export-json.png).

## Suite
- Petit écart vu sur la capture : sans l'objectif ventre, le bandeau « Le suivi digestif est masqué » reste en haut de
  l'exemple (POLISH-SIM-37b, polish).
- POLISH-SIM-39 (compte fictif de la visite), 31, 32, 34 ; PROP-SIM-11, 12, 13 (maquettes) ; CYCLE-3 attend P48.
