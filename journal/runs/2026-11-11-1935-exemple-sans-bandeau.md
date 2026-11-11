# Run 11/11 19:35 — Exemple digestion sans bandeau « masqué » (POLISH-SIM-37b)

**Type** : code (mode polish).

## Contexte
- Main a51c47e (#920) : Build & Release, Tests, Play — AAB et émulateur A56 verts. Aucune PR « [Auto] » ouverte.
- POLISH-SIM-37b (vu sur la capture du run de 18:35) : sans l'objectif ventre, « Voir un exemple » depuis Analyses ›
  Digestion montrait « Le suivi digestif est masqué » au-dessus des données fictives.

## Fait
- `Recommendations` : le bandeau `gut-off` ne s'affiche pas en mode exemple (`isExampleMode()`) ; la page se relit
  déjà à l'entrée et à la sortie de l'exemple (`health-entries-updated`), le bandeau revient donc après.
- La première étape de la visite (« Votre digestion », encore sur les vraies données) garde le bandeau : c'est l'état réel.
- Test rouge puis vert : `Recommendations.test.jsx` (entrée puis sortie du mode exemple).

## Vérifs
- `npm run test` (3450 verts), `npm run lint` (0 problème), `npm run build`, `npm run visual` complet (18 pages ok ;
  cible < 44 px de Paramètres et message console de Sources déjà présents avant).
- Capture lue : [exemple au jour 28, sans bandeau](captures/2026-11-11-1935-exemple-sans-bandeau.png)
  (`--onboarding=recent --routes=/recommendations/ventre --click="Voir un exemple > Voir au jour 28"`).

## Suite
- Vu sur la capture : le badge « Exemple · données fictives » recouvre le nom « Halcya » de l'en-tête (POLISH-SIM-37c, à
  vérifier sur l'émulateur A56).
- POLISH-SIM-39 (compte fictif de la visite), 31, 32, 34 ; PROP-SIM-11, 12, 13 (maquettes) ; CYCLE-3 attend P48.
