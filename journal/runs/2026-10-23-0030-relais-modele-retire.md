# 2026-10-23 00:30 Paris (22:30 UTC) — Relais : modèle retiré par Google, passage à la multi-région UE

**Type** : 🚑 réparation (« Relais — déploiement » rouge sur `main`, analyse des repas de la variante play en panne)

## Constat
- Main à `e40c245` (#280). « Build & Release », « Play — AAB », « Tests », émulateur verts ; **« Relais — déploiement »
  toujours rouge** : `/health` OK, analyse de test en **HTTP 502 en moins d'une seconde**. La lecture des journaux
  ajoutée au run précédent n'a rien renvoyé (5 s d'attente : trop court pour l'indexation de Cloud Logging).
- Appel direct depuis la session : même 502 (2,3 s).
- La relance du workflow depuis la session a été refusée (garde-fou de la session contre les déploiements) : le
  déploiement se fera par le merge sur `main`, comme prévu par la charte.

## Cause
Documentation Vertex AI (« Model versions and lifecycle », consultée le 23/10) :
- `gemini-2.5-flash-lite` : **retiré le 20 octobre 2026** (remplaçants : 3.5 Flash-Lite, 3.8 Flash) → le modèle qui
  répondait à 17:16 n'existe plus.
- `gemini-3.5-flash-lite` (GA, 21/07/2026) et `gemini-3.1-flash-lite` (GA, 07/05/2026) : disponibles seulement en
  `global`, multi-régions `us` / `eu` (et asia-south1) — **pas en europe-west1 ni europe-west4**, où le relais les
  cherchait. Les 4 candidats répondaient donc 404 → 502.

## Ce qui a été fait
- `relay/src/vertex.js` : `endpointUrl` sait viser une multi-région (`eu` → `https://aiplatform.eu.rep.googleapis.com/v1/projects/…/locations/eu/…`).
- Configuration (défaut et workflow) : `VERTEX_LOCATIONS=eu,europe-west1`, `VERTEX_MODELS=gemini-3.5-flash-lite,gemini-3.1-flash-lite`.
  Toujours dans l'UE, jamais `global` (test).
- Workflow : en cas d'échec de l'analyse de test, lecture des événements `error` réessayée toutes les 15 s pendant
  2 min.
- Tests (écrits avant le code, 3 rouges puis verts) : adresse multi-région, configuration UE sans `global` ni modèle
  retiré, variables du workflow. **45 tests relais verts.**

## Vérifications
- `cd relay && npm test` : 45 verts. App inchangée : `npm run test`, `npm run build`, `npm run visual` (voir PR).
- Après merge : résultat de « Relais — déploiement » ci-dessous ou au run suivant.

## Suite
- Si toujours rouge : le résumé du workflow doit maintenant contenir le message exact de Vertex AI (droit
  `aiplatform.user` sur la multi-région, quota…).
- Puis 6c (plugin d'achat, droits, crédits, paywall) avec 6b-2 (Play Integrity).
- Veille : dates de retrait des modèles (la sideload propose 3.8 Flash, 3.5 Flash-Lite, 2.5 Flash via l'API Gemini
  à clé, non concernée par ce retrait Vertex).
