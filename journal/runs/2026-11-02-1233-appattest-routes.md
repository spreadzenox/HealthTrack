# Run du 02/11/2026 12:33 (Paris, CET) — App Attest 5d-1 : routes défi et enregistrement

**Type** : 🔧 code (relais seul)

## Constat au démarrage
- Main à `23938dd` (#627) ; « Tests », « Build & Release » (v449), « Play — AAB », émulateur verts ; aucune PR
  « [Auto] » ouverte (seule la #51, brouillon Cursor, non touchée).
- Demande reprise : **I6-RELAIS** (01/11 17:10, priorité des runs de code), étape (5) App Attest. 5d découpée en deux
  runs : 5d-1 (routes, ce run) et 5d-2 (vérification de chaque requête iPhone dans la garde d'intégrité, bilan).
  GOLD-a3 attend P37, GOLD-b6 attend P36, le déploiement d'App Attest attend P38.

## Fait
- `relay/src/attestroutes.js` :
  - `createChallengeStore` : défi de 32 octets aléatoires (base64), lié à l'installation, valable 5 min, brûlé à sa
    première présentation (réussie ou non), comparaison de l'installation à temps constant, magasin borné (10 000,
    les plus anciens évincés). En mémoire de l'instance : si Cloud Run sert les deux appels sur deux instances,
    l'enregistrement répond `challenge` et l'iPhone redemande un défi (à dire à la routine iOS en 5e).
  - `createAttestRoutes` : `challenge(installId)` → `{ challenge, expiresInSec: 300 }` ; `register(installId, body)` :
    400 si `keyId` / `attestation` / `challenge` manquent ou dépassent 24 Ko ; 403 `{ error: 'attest', reason:
    'challenge' }` sans appeler le registre ; registre (5c) → 200 `{ ok: true, environment }`, 403 avec la raison
    d'une `AppAttestError`, 503 `unavailable` sur toute autre erreur (Firestore). Journal `event: 'appattest'`
    (op, statut, raison, environnement, catégorie, empreinte ; jamais le défi, la clé ni l'attestation).
- `server.js` : routes `POST /v1/attest/challenge` (sans corps) et `/v1/attest/register`, seulement si `appAttest`
  est fourni ; `X-Install-Id` obligatoire, 405 hors POST, même quota par installation que la vérification
  d'abonnement (`billingQuota`). CORS : `X-AppAttest-Key`, `X-AppAttest-Assertion`, `X-AppAttest-Time` ajoutés.
- `config.js` : `appAttestMode` (`APP_ATTEST_MODE`, `off` par défaut, toute valeur inconnue → `off`) et
  `appleTeamId` (`APPLE_TEAM_ID`, 10 caractères majuscules/chiffres, sinon vide).
- `index.js` : routes créées seulement avec un mode autre que `off` **et** un Team ID ; registre Firestore
  (`appattest`) ou mémoire selon `CREDITS_STORE` ; `appAttest` dans l'événement `start`. Le workflow de déploiement
  ne règle ni l'un ni l'autre : **le relais déployé répond 404 comme avant**.
- Tests : `relay/test/attestroutes.test.js` (10 tests : modes, défi unique / lié / périmé / borné, enregistrement,
  rejeu du défi, 400/403/503, vrai registre avec vérificateur factice, serveur 404 en `off`, 400/405/429, défi sans
  corps, CORS). Vérifié aussi en lançant `src/index.js` avec un Team ID fictif et `CREDITS_STORE=memory`.

## Vérifications
- Relais : `npm test` 181/181. App (non modifiée) : `npm run test`, `npm run build` et `npm run visual` verts en local (captures regardées : onboarding inchangé).
  Pas de note de Nouveautés (rien de visible).

## Suite
- I6-RELAIS-5d-2 : branche iOS de `createIntegrityGuard` avec `registry.check` (corps brut de la requête), statuts
  `attest_passed` / `missing` / `rejected` / `unavailable`, bloquant seulement en `enforce` ; bilan « App Attest »
  dans le résumé du déploiement. Puis 5e (demande à la routine iOS, déploiement avec P38, TTL Firestore sur
  `appattest`).
