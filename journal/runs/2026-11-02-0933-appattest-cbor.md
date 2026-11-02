# Run du 02/11/2026 09:33 (Paris, CET) — App Attest 5a : CBOR et authData

**Type** : 🔧 code (relais seul)

## Constat au démarrage
- Main à `837bd88` (#623) ; « Build & Release », « Play — AAB », tests et émulateur verts ; aucune PR « [Auto] »
  ouverte (seule la #51, brouillon Cursor, non touchée).
- Demandes reprises : **I6-RELAIS** (01/11 17:10, priorité des runs de code) : 1, 2, 3, 6, 7 livrés ; l'étape (5),
  App Attest, spécifiée au run de 08:33 et découpée en 5a–5e. Ce run fait **5a**. GOLD-a3 attend P37, GOLD-b6
  attend P36, P38 (Team ID) pas nécessaire avant le déploiement.

## Fait
- `relay/src/cbor.js` : décodeur CBOR réduit à ce qu'Apple envoie (entiers sûrs, octets, textes UTF-8 stricts,
  tableaux, tables en `Map`, false/true/null) ; refuse longueurs indéfinies, étiquettes, flottants, clés en double ou
  non scalaires, troncature, octets en trop ; bornes de profondeur, d'éléments (vérifiées avant allocation) et de
  taille (64 Ko). `decodeCborPrefix` rend la fin de la valeur (clé COSE suivie des extensions).
- `relay/src/authdata.js` : `parseAuthData` (rpIdHash, flags, compteur gros-boutiste, aaguid, credentialId borné,
  clé COSE EC2/ES256/P-256 → point non compressé 65 octets + `KeyObject`, point hors courbe refusé, extensions),
  `aaguidEnvironment` (`appattest` + 7 nuls → production, `appattestdevelop` → development), `appleExtensions`
  (catégorie et version de l'app si présentes).
- Tests : `test/cbor.test.js` (vecteurs de l'annexe A de la RFC 8949, aller-retour d'un objet en forme
  d'attestation, refus), `test/authdata.test.js` (clés P-256 générées à la volée, Team ID fictif) ; encodeur CBOR de
  test dans `test/helpers/`. Aucune clé ni vraie attestation dans le dépôt.
- Rien n'est importé par `server.js` : le redéploiement du relais déclenché par le merge ne change aucun comportement.

## Vérifications
- Relais : `npm test` 146/146. App : `npm run test` (2 860 réussis, 44 ignorés), `npm run build` OK, `npm run visual`
  lancé (app non modifiée). Pas de note de Nouveautés (rien de visible).

## Suite
- I6-RELAIS-5b : `appattest.js`, vérification de l'attestation (chaîne `x5c` → racine App Attest épinglée, nonce de
  l'OID 1.2.840.113635.100.8.2, keyId, rpId, aaguid, compteur 0, catégorie) sur une chaîne `openssl` jetable.
- En alternance : POL-PLAY-12 (audit de l'onboarding play en clair).
