# Run du 02/11/2026 10:33 (Paris, CET) — App Attest 5b : attestation

**Type** : 🔧 code (relais seul)

## Constat au démarrage
- Main à `a62aad6` (#624) ; « Build & Release », « Play — AAB », tests, émulateur et déploiement du relais verts ;
  aucune PR « [Auto] » ouverte (seule la #51, brouillon Cursor, non touchée).
- Demandes reprises : **I6-RELAIS** (01/11 17:10, priorité des runs de code) : étape (5) App Attest, sous-étape **5b**.
  GOLD-a3 attend P37, GOLD-b6 attend P36, P38 (Team ID) nécessaire seulement au déploiement.

## Fait
- `relay/src/appattest.js` : `createAppAttestVerifier({ teamId, bundleId, roots, now, allowDevelopment })`.
  Racine « Apple App Attestation Root CA » embarquée (téléchargée ce run, empreinte SHA-256 identique à celle notée au
  run idées de 08:33). Vérifie : forme CBOR (`fmt`, `x5c` à deux certificats, `authData`), chaîne et dates, nonce de
  l'extension 1.2.840.113635.100.8.2 (lecteur DER minimal ; forme `SEQUENCE { [1] { OCTET STRING } }` d'Apple et
  forme sans étiquette), keyId = SHA-256 du point P-256 = credentialId, clé COSE = clé du certificat, rpIdHash,
  compteur 0, aaguid (développement refusé par défaut), catégorie de validation 2/4 si présente (3 seulement en
  développement). Erreur `AppAttestError` avec une raison courte, prête pour les journaux de 5d. Le reçu est ignoré.
- `relay/test/appattest.test.js` : 11 tests, chaîne `openssl` jetable (racine et intermédiaire P-384, certificat de
  clé P-256 avec l'extension posée en `DER:`), Team ID fictif `TEAMID1234`. Aucune clé ni vraie attestation dans le
  dépôt.
- Rien n'est importé par `server.js` : le redéploiement du relais au merge ne change aucun comportement.

## Vérifications
- Relais : `npm test` 157/157. App (non modifiée) : `npm run test`, `npm run build`, `npm run visual` (voir PR).
  Pas de note de Nouveautés (rien de visible).

## Suite
- I6-RELAIS-5c : assertions (signature sur le nonce, rpId, compteur croissant, `clientData` avec installId, heure
  ±5 min et empreinte du corps) + registre Firestore `appattest` (clé déjà liée refusée, `expireAt` 13 mois, cache).
- En alternance : POL-PLAY-12 (audit de l'onboarding play en clair).
