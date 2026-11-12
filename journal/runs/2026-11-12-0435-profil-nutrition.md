# Run 12/11 04:35 — Nutrition : la carte du profil sans redite (POLISH-AUDIT-1)

**Type** : code (mode polish).

## Contexte
- Main 1871697 (#927) : « Build & Release », « Tests », émulateur A56, « Play — AAB », fiche et abonnements verts.
  Aucune PR « [Auto] » ouverte.
- « Play — Alpha (livraison continue) » du 11/11 au soir : parti à **03:24 UTC (04:24 Paris)** au lieu de 22:45 UTC
  (cron de GitHub en retard de 4 h 40) ; versionCode **101006** (commit 1871697) placé sur l'alpha, en examen chez
  Google ; il remplace 100984.
- File du mode polish vide côté code (POLISH-SIM-* tous faits ; PROP-SIM-* attendent maquette et accord ; CYCLE-3
  attend P48). Run consacré à un audit visuel : `npm run visual` en sombre (démo, sideload), `--empty --play --dark`,
  `--play` sur Premium et Réglages.

## Constat
- Journal › Nutrition, premier lancement : la carte « Votre profil » avait le bouton « Compléter mon profil » et juste
  dessous « Complétez votre profil pour des repères ajustés à vous. » (deux fois le même appel, rien sur l'usage).
- Vus sans défaut à corriger : Réintroduction, Premium (play : la liste suit Silver ou Gold), Réglages, Analyses ›
  Digestion vide, Tendances vide. À noter : `/settings` sideload signale une cible de 40 px (« Clé API Gemini »,
  sideload seulement).

## Fait
- `BodyProfileCard.jsx` : « Sexe, âge, taille, poids : vos repères d'apports en tiennent compte. » Test d'abord
  (`Nutrition.test.jsx` : nouvelle phrase, plus de « Complétez votre profil »), rouge puis vert.
- Nouveautés : `2026-11-12-0435-profil-nutrition.json`.

## Vérifs
- `npm run test` (3461 verts), `npm run lint` (0 erreur), `npm run build`, `npm run visual` (toutes les pages ok).
- Captures : [clair](captures/2026-11-12-0435-profil-nutrition-clair.png) · [sombre](captures/2026-11-12-0435-profil-nutrition-sombre.png).

## Suite
- Cible de 40 px « Clé API Gemini » (sideload) à porter à 44 px ; simulations du run « idées » de 08:35 ;
  PROP-SIM-11, 12, 13 (maquettes) ; CYCLE-3 attend P48.
