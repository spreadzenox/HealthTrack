# Run du 21/11 17:30 — Piste verrouillée d'Objectifs visible, correctif iPhone 50 fondu (DEM-IOS-15)

**Type** : 🛠️ (petit correctif visible sur Android) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…),
origin/main 93c4626 au départ.

## État de départ
- main vert sur 93c4626 (#1175) : Tests, émulateur, « Fiche App Store — contrôle » verts.
- Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, pas à nous).
- Rien de neuf du propriétaire dans le prompt. Build iPhone et TestFlight du soir à 21:20, Alpha à 23:45.

## Ce qui a été fait
- **DEM-IOS-15** : dans Objectifs › Votre bien-être / confort digestif, sans abonnement, une piste verrouillée pose
  une barre floutée (`.pistes-first-blur`, `flex: 1`) dans `.reco-piste-title`, un span ordinaire : mesurée dans
  Chromium avec les vraies feuilles de style, **0 × 0** ; la carte n'avait que « Débloquer ». `.reco-piste-title.is-locked`
  devient un conteneur flexible : **324 × 12 px** dans une carte de 360 px, barre lilas floutée visible.
- C'est la règle exacte du **correctif iPhone 50** (`50-piste-verrouillee.patch`) : correctif supprimé, **47
  correctifs** (« Sort des correctifs »). Rien ne change sur iPhone ; Android rattrape l'iPhone.
- **DEM-IOS-19** classée sans objet : `LeverCard` et `reco-advice-text` n'existent plus.
- Test `src/pages/lockedPisteBlur.test.js` écrit d'abord (rouge, puis vert), dans le style de `dayDotsFill.test.js`.
- Note de Nouveautés `2026-11-21-1730-piste-verrouillee.json` (`["play", "sideload"]`).

## Vérifications
- Suite complète Vitest, eslint sur les fichiers touchés, build Vite (résultats dans la PR).
- Visuel : la démo n'a pas de piste verrouillée sur ces pages (bien-être : aucune piste nette ; digestion : avant
  le premier score), donc mesure par Playwright sur le HTML de `PisteCard` verrouillée avec `tokens.css`,
  `TodayCards.css` et `Recommendations.css` ; captures `/recommendations`, `/recommendations/bien-etre` et
  `/recommendations/ventre` (`--play`) relues, inchangées.
- Build iPhone de la PR : un seul, PR passée « prête » une fois finie (CI économe).

## Suite proposée
1. Ce soir : build iPhone et TestFlight à 21:20, examen bêta, Alpha à 23:45.
2. Demain matin : rattacher la build du soir validée (`ios-store-submission.yml --preparer --build <N>`), puis
   « 👉 PI2 prête » en tête du résumé (objectif du 22/11).

## Pour le propriétaire
Rien à faire.
