# Run du 27/10/2026 22:33 (Paris, CET) — CI bord à bord réparée + une seule piste « mouvement »

**Type** : 🔧 réparation de la CI de main + 🎨 polissage play (POL-PLAY-12, premier point)

## Constat au démarrage
- Main à `c7e9819` (#444). « Tests », « Build & Release » et « Play — AAB » verts ; **« Test — émulateur Samsung
  Galaxy A56 » rouge** : seul le nouveau job « Bord à bord sous Android 14 (API 34) » échoue (code 13,
  « unsettled top-level await » sur `readInsets()`). Aucune PR « [Auto] » ouverte.

## Cause et correction (CI)
- `check.mjs` attendait sans limite la réponse de `Runtime.evaluate` : quand la WebView recharge sa page (ou que la
  connexion DevTools se ferme) la réponse ne vient jamais et Node sort en code 13. Ce n'était pas un défaut de l'app
  (le même job était vert sur la PR #444).
- Correction : délai de 10 s par évaluation, attentes libérées à la fermeture du WebSocket, reconnexion et jusqu'à
  3 essais. Un vrai défaut d'encarts reste détecté (seuils inchangés).

## Polissage (POL-PLAY-12, point « Marcher / Bouger davantage »)
- `selectLevers` : `steps` et `activityCalories` forment une même famille ; un seul levier par famille, le plus
  solide (q le plus bas). Sur les données de démo, « Pistes à tester » passe de 3 à 2 cartes (Dormir, Marcher).
- Test ajouté (`analysisEngine.test.js`). Captures `recommendations-1/2` relues.

## Vérifications
- `npm run test` : 2 575 tests verts ; `npm run build` OK ; lint : 6 erreurs, comme avant ; `npm run visual` OK.

## Suite
- Vérifier sur la PR que le job API 34 passe. Puis la suite de POL-PLAY-12 (audit écran par écran `--play --empty`
  puis démo), puis POL-PLAY-10 (R8a).
