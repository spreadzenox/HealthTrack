# 06/11 21:35 — Premier écran de l'onboarding en très grande police (REVUE-320-VIERGE)

Type : 🎨 run de code (revue C1, variante play, données vierges, petits écrans).

## Constat au démarrage
- main `788b0e2` (#762) : Tests, émulateur A56 et « Play — Alpha (livraison continue) » verts (19:48–20:05 UTC).
  Aucune PR « [Auto] » ouverte (#51 hors routine, non touchée).
- Alpha : 100841 en examen chez Google (16:12 UTC) ; porte de 24 h jusqu'au 07/11 vers 16:12 UTC.
- `iosUntil` = 06/11 23:00 UTC : fin de la période de lancement iPhone ce soir, comme décidé (rien à changer).
- Décision iOS du 06/11 18:20 déjà en tête de `POUR-IOS.md`.

## Revue
`npm run visual -- --play --empty --size=320x700 --font-scale=1.3` : 17 pages ok (1 message console connu sur
Sources). Captures relues (Accueil, Journal, Analyses, Sources, paywall, onboarding) :
- onboarding, premier écran : les trois repères « 0 Mo / 2–48 h / 1 geste » en trois colonnes inégales, le texte du
  premier un mot par ligne (« envoyé / à / Halcya / sans / votre / accord ») ;
- barre du bas : « Aujourd'… » coupé par une ellipse (noté NAV-LIBELLE-320, pas traité) ;
- le reste tient (carte ventre en colonne depuis VENTRE-COLONNE, paywall, Analyses, Sources).

## Fait
- `src/hooks/useNarrowBox.js` : `isNarrowBox(largeur, police racine, minRem)` et `useNarrowBox(minRem)`
  (ResizeObserver) ; la largeur se compte en rem, donc la grande police d'Android rend la boîte « plus étroite ».
- `Onboarding.jsx` / `.css` : sous 16 rem, `onb-tiles--stacked` (un repère par ligne, chiffre à gauche sur 4,6 em).
- Tests : 2 pour `isNarrowBox`, 2 dans `Onboarding.test.jsx` (empilé à 280 px / racine 20,8 px ; trois colonnes sinon).
- Note de Nouveautés `2026-11-06-2135-onboarding-reperes.json`.

## Vérifications
- Captures : 320 px ×1,3 (un repère par ligne, lisible) ; taille A56 par défaut (trois colonnes, inchangé).
- `npm run test` : 3 209 verts. `npm run lint` : 0 erreur. `npm run build` OK.

## Suite
- TEST-ALPHA-1 (07–08/11) ; NAV-LIBELLE-320 (idée) ; GOLD-a3-2 dès P37.
