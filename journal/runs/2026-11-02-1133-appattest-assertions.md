# Run du 02/11/2026 11:33 (Paris, CET) — App Attest 5c : assertions et registre

**Type** : 🔧 code (relais seul)

## Constat au démarrage
- Main à `57eddec` (#625) ; « Build & Release », « Play — AAB », tests, émulateur et déploiement du relais verts ;
  aucune PR « [Auto] » ouverte (seule la #51, brouillon Cursor, non touchée).
- Demandes reprises : **I6-RELAIS** (01/11 17:10, priorité des runs de code) : étape (5) App Attest, sous-étape **5c**.
  GOLD-a3 attend P37, GOLD-b6 attend P36, P38 (Team ID) nécessaire seulement au déploiement.

## Fait
- `relay/src/appattest.js` : `assertionClientData`, `keyFromPoint`, `createAssertionVerifier({ teamId, now, skewMs })`.
  L'iPhone signera `halcya-assert:<installId>:<heure ms>:<SHA-256 hex du corps>` ; le relais le recompose depuis la
  requête reçue, donc un corps, une installation ou une heure modifiés cassent la signature. Vérifie : heure ±5 min,
  CBOR `{ signature, authenticatorData }` borné à 1 Ko, pas de clé dans l'assertion, signature ECDSA P-256 (DER) sur
  SHA-256(authenticatorData ‖ SHA-256(clientData)), rpIdHash, compteur strictement supérieur au dernier vu.
- `relay/src/attestregistry.js` : `createAttestRegistry({ verifyAttestation, verifyAssertion, store })` avec
  `register` (clé liée à l'empreinte `appattest:<installId>`, jamais l'identifiant ; `key_reused` si déjà liée à une
  autre installation ; idempotent pour la même) et `check` (`unknown_key`, `key_reused`, compteur avancé en mémoire
  avant l'écriture : deux requêtes simultanées avec la même assertion, une seule passe ; instance neuve relit
  Firestore). Lecture Firestore en panne : erreur brute (5d la classera `unavailable`) ; écriture en panne :
  `persisted: false`, compteur gardé en mémoire. Cache LRU borné (5 000). `createFirestoreAttestStore` : collection
  `appattest`, champs install, publicKey, counter, environment, category, createdAt, expireAt (13 mois, `expiryOf`).
- Tests : `relay/test/attestregistry.test.js` (14 tests, clés P-256 jetables via `generateKeyPairSync`) et un test de
  bout en bout dans `appattest.test.js` (attestation sur la chaîne openssl jetable, puis assertion signée par la même
  clé). Aucune clé ni vraie assertion dans le dépôt ; Team ID fictif.
- Rien n'est importé par `server.js` : aucun changement de comportement au redéploiement.

## Vérifications
- Relais : `npm test` 172/172. App (non modifiée) : `npm run test`, `npm run build`, `npm run visual` (voir PR).
  Pas de note de Nouveautés (rien de visible).

## Merge
- PR #626 mergée (squash, `73dfd88`) après Frontend, Build APK et Relais verts ; « Build & Release » a publié
  **v448** (APK 34 526 668 octets), « Relais — déploiement » vert (aucun comportement changé).
- « Tests » sur main : `Frontend (Vitest)` rouge une fois, sur `Premium.test.jsx` (« Gold remplace Silver… » lu par
  `getByText` avant que les formules soient chargées) : course du test, pas du code (vert sur la PR et en local).
  Job relancé ; assertion passée en `findByText` dans une seconde PR « [Auto] » de ce run.

## À noter pour la suite
- Une politique TTL Firestore sur `appattest` (comme P33 pour `credits`) sera à demander au propriétaire au moment du
  déploiement (5d/5e), sans quoi `expireAt` est écrit mais rien n'est effacé.

## Suite
- I6-RELAIS-5d : `POST /v1/attest/challenge` (défi 32 octets, 5 min, usage unique) et `/v1/attest/register`, branche
  iOS de `createIntegrityGuard` (`attest_passed` / `missing` / `rejected` / `unavailable`), `APP_ATTEST_MODE`
  (défaut `off`), en-têtes CORS `X-AppAttest-*`, ligne « iPhone » du bilan du déploiement.
