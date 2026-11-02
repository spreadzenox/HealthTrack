# Run du 02/11/2026 08:33 (Paris, CET) — Idées : App Attest pour l'iPhone

**Type** : 💡 idées (journal seul, aucun code produit)

## Constat au démarrage
- Main à `b7b7147` (#622), « Build & Release », « Play — AAB », tests et émulateur verts ; aucune PR « [Auto] »
  ouverte.
- Demandes reprises : I6-RELAIS (01/11 17:10) livré sauf l'étape (5), App Attest, « plus tard » : ce run la
  prépare pour qu'elle tienne en runs de code courts. GOLD-a3 attend P37, GOLD-b6 attend P36 ; montre (21/10) en
  attente de confirmation sur la GT 6 Pro.

## Fait
- Lu la doc d'Apple (« Validating apps that connect to your server », « Assessing fraud risk », par leur JSON public)
  et inspecté la racine « Apple App Attestation Root CA » (P-384, jusqu'en 2045, empreinte notée).
- `IDEES.md` **I208** : étapes de vérification de l'attestation et de l'assertion (dont les nouvelles extensions
  `apple_validation_category_01` / `apple_bundle_version_01`), `clientData` propre à Halcya, défi à usage unique en
  mémoire, registre Firestore `appattest`, interrupteur `APP_ATTEST_MODE` séparé d'`INTEGRITY_MODE`, en-têtes de
  l'app iPhone, tests sur chaîne `openssl` jetable, reçu / « fraud metric » écartés (il faudrait une clé DeviceCheck,
  donc un secret).
- `BACKLOG.md` : I6-RELAIS-5 découpé en 5a–5e. `PRODUIT.md` : **P38** (Team ID Apple, pas urgent).

## Vérifications
- Journal seul ; `npm run test` (app) et `npm test` (relais) lancés avant la PR (garde-fou).

## Demandes iOS
- 5e : demande à la routine iOS (plugin Swift, en-têtes `X-AppAttest-*`) une fois 5d livré. Aucune note de Nouveautés.

## Suite
- Prochain run de code : POL-PLAY-12 (onboarding en clair), puis I6-RELAIS-5a (`cbor.js` + `authData`).
