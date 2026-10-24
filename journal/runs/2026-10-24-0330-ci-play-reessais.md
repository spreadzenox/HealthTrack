# 2026-10-24 03:30 Paris (01:30 UTC) — CI : réessais de l'envoi Google Play sur les pannes passagères

**Type** : 🔧 réparation de la CI (priorité : workflow de publication rouge sur main)

## Constat
- Main à `3bd68e7` (#307) : Tests, Build & Release, émulateur A56 et Pages verts, mais **« Play — AAB » rouge**
  (run 40046889978) : `Lecture de la fiche : HTTP 503 — The service is currently unavailable.` dès le premier appel
  après l'ouverture de l'edit. L'AAB (versionCode 394, 17,8 Mo) était construit et signé ; panne passagère côté Google.
- Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).

## Ce qui a été fait
- Job en échec relancé une fois (rerun_failed_jobs) : **vert**, la 394 est envoyée en test interne.
- `app/scripts/play/publish.mjs` : `withRetry(fetchImpl, { delays, sleep })` réessaie les réponses 429/500/502/503/504
  (délais 5, 10, 20 s ; 4 essais au plus), jamais les 4xx ; utilisé par `publishBundle` et `publishListing`
  (`listing.mjs`). Un « 503 » ne fait donc plus perdre une version.
- Tests : 4 nouveaux dans `publish.test.mjs` (réessai puis succès, abandon après le dernier délai, pas de réessai sur
  403, envoi complet qui survit à un 503 sur la lecture de la fiche) ; `sleep` neutralisé dans les tests existants.

## Vérifications
- `npm run test` : 168 fichiers, 2 081 tests verts ; `npm run build` OK ; `npm run lint` : 6 erreurs, identiques à main ;
  `npm run visual` vert (aucun écran touché, 0 erreur JS ; accueil relu).

## Suite
- VC-18b : rappel local J−2 de fin d'essai, puis VC-15, VC-5, VC-9, VC-19.
