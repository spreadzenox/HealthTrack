# Run du 02/11/2026 13:46 (Paris, CET) — App Attest 5d-2 : vérification de chaque requête iPhone

**Type** : 🔧 code (relais seul)

## Constat au démarrage
- Main à `2c366bb` (#628) ; « Tests », « Build & Release » (v450), « Play — AAB », « Relais — déploiement » et
  émulateur verts ; aucune PR « [Auto] » ouverte (seule la #51, brouillon Cursor, non touchée).
- Demande reprise : **I6-RELAIS** (01/11 17:10, priorité des runs de code), étape (5) App Attest, sous-étape 5d-2.
  GOLD-a3 attend P37, GOLD-b6 attend P36, le déploiement d'App Attest attend P38.

## Fait
- `relay/src/attestroutes.js` : `verify(installId, { attest, body })` : en-têtes `X-AppAttest-Key` (≤ 64),
  `X-AppAttest-Assertion` (≤ 4 096), `X-AppAttest-Time` (≤ 16) ; absent ou mal formé → `attest_missing` sans appeler
  le registre ; `registry.check` → `attest_passed` (environnement, persisted) ; `AppAttestError` →
  `attest_rejected` (`reasons: [raison]`) ; autre erreur → `attest_unavailable` (jamais bloquant). `ok` faux
  seulement en `enforce` pour missing / rejected. Journal `event: 'integrity'`, `platform: 'ios'`, `ci`, empreinte ;
  jamais la clé, l'assertion ni le corps.
- `relay/src/integrity.js` : option `appAttest` ; une requête iOS (même règle `requestPlatform`) part vers
  `appAttest.verify` **avant** le court-circuit `INTEGRITY_MODE=off` : les deux interrupteurs sont indépendants.
  Sans App Attest ou en `off` : `not_android` comme avant.
- `relay/src/server.js` : l'analyse lit le corps brut (`readBody`) puis le parse (même 400 `bad_json`), transmet
  `attest` et `body` à la garde ; 403 avec `INTEGRITY_MESSAGE_IOS` (« … installée depuis l'App Store … ») si le refus
  vient d'App Attest. `index.js` passe `appAttest` à la garde.
- `.github/workflows/relay-deploy.yml` : commentaire du bilan Play Integrity (statuts iPhone), ligne « App Attest
  (clés de l'iPhone) » par statut et raison des événements `appattest`.
- Tests : `relay/test/attestguard.test.js` (7 : passage avec corps brut, observe, enforce, champs invalides,
  indépendance d'INTEGRITY_MODE et Android jamais concerné, mode off, serveur de bout en bout avec le corps exact).

## Vérifications
- Relais : `npm test` 188/188 ; workflow YAML valide, jq de la ligne App Attest essayé sur un exemple.
- App non modifiée : `npm run test` et `npm run build` relancés en local (voir PR). Pas de note de Nouveautés (rien
  de visible), pas de capture à regarder.

## Suite
- I6-RELAIS-5e : demande à la routine iOS (journal/DEMANDES.md de HealthTrack-iOS ou note dans le résumé) : plugin
  Swift (`DCAppAttestService`), défi → `attestKey` → `/v1/attest/register`, puis sur chaque analyse
  `generateAssertion(SHA-256("halcya-assert:<installId>:<time>:<sha256 hex du corps>"))` et les trois en-têtes ;
  redemander un défi si `register` répond `challenge` ; réattester si `unknown_key`. Déploiement : `APP_ATTEST_MODE=
  observe` + `APPLE_TEAM_ID` dès P38, TTL Firestore sur `appattest`, puis `enforce` après quelques jours propres.
