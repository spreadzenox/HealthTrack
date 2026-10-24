# 2026-10-24 05:30 Paris (03:30 UTC) — VC-5 : Nouveautés par variante

**Type** : 🧭 chantier produit — passe « version candidate », critère C2

## Constat
- Main à `ae965eb` (#309) : tous les workflows verts (Tests, Build & Release, Play — AAB, Pages, émulateur).
- Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- VC-5 : en play, la page Nouveautés listait 158 entrées d'historique (36 avec « HealthTrack », clé Gemini, bouton de
  mise à jour) et une installation neuve voyait le bandeau « Nouveau : … et N autres changements ».

## Ce qui a été fait
- `data/changelog.js` : `ALL_CHANGELOG`, champ facultatif `variants` (`["play"]` / `["sideload"]`),
  `changelogFor(entries, distribution)` ; en play, seulement les entrées `id >= PLAY_CHANGELOG_SINCE`
  (`2026-10-24-0000`). `CHANGELOG` = la liste de la variante du build (page, bandeau, pastille, Réglages inchangés).
- `pages/Onboarding.jsx` : à l'ouverture de l'onboarding, si aucune nouveauté n'a jamais été vue, tout l'historique
  est marqué « lu » → pas de bandeau au premier lancement (les deux variantes ; utilisateurs existants non concernés).
- Entrée « Nouveautés » réservée à play (`2026-10-24-0530-nouveautes-play.json`).

## Vérifications
- Tests : 4 (`data/changelog.test.js`, dont le test-garde de vocabulaire sur les entrées play réelles), 2
  (`Onboarding.test.jsx`), validation de `variants` dans `WhatsNew.test.jsx`.
- `npm run test` : 170 fichiers, 2 097 tests verts. `npm run build` OK. `npm run lint` : 6 erreurs, identiques à main.
- `npm run visual` complet : 0 erreur JS ; `npm run visual -- --play --routes=/nouveautes` relu : 4 entrées du 24/10,
  aucune mention HealthTrack / Gemini.

## Suite
- VC-15 (émojis, apostrophes, titre « Alimentation »), VC-9 (premier lancement à froid, C4), VC-19.
- Règle pour les prochains runs : une entrée qui ne concerne qu'une variante porte `"variants"`.
