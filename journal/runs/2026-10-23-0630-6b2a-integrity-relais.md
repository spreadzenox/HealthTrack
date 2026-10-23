# 2026-10-23 06:30 Paris (04:30 UTC) — 6b-2a : Play Integrity côté relais

**Type** : 🧭💳 chantier produit, jalon 6 (étape 6b-2a)

## Constat
- Main à `6918818` (#286) ; Build & Release, Play — AAB, Tests, émulateur verts. Aucune PR « [Auto] » ouverte (seule
  #51 `cursor/*`, non touchée). Run de code (06:30).

## Ce qui a été fait
- `relay/src/integrity.js` :
  - `createIntegrityClient` : `POST playintegrity.googleapis.com/v1/fr.jpesquet.sante:decodeIntegrityToken` sous
    relay-runtime (portée `playintegrity`, jeton du serveur de métadonnées) ;
  - `evaluateVerdict` : paquet, `requestHash` = `requestHashFor(installation)` (sha256 de `halcya-integrity:<id>`),
    jeton de moins de 10 min, `PLAY_RECOGNIZED`, `MEETS_DEVICE_INTEGRITY` ; licence journalisée sans être exigée
    (test interne, téléphone sans compte Play) ;
  - `createIntegrityGuard` : modes `off` / `observe` / `enforce` ; verdict accepté gardé 24 h par installation
    (un décodage par jour), refus gardé 10 min (un script ne fait pas décoder sans fin) ; Google injoignable → on laisse
    passer (les plafonds restent) ; journaux sans jeton ni identifiant en clair.
- `server.js` : en-tête `X-Integrity-Token` (CORS) vérifié avant tout quota sur `/v1/meal/analyze` ; en `enforce`, 403
  `integrity` avec un message simple (« installée depuis Google Play, sur un téléphone certifié »).
- `config.js` `INTEGRITY_MODE` (défaut `observe`) ; `relay-deploy.yml` : `INTEGRITY_MODE=observe` ; test du workflow.

## Pourquoi pas l'app dans le même run
- Le plugin natif (`com.google.android.play:integrity`) vit dans `src/play/java` ; aucune vérification de PR ne
  compile la variante play (seul « Play — AAB » sur main) : une erreur Java casserait l'AAB après merge. Étape 6b-2b
  à part, avec une compilation de la variante play vérifiée avant merge.

## Vérifications
- `cd relay && npm test` : **71 verts** (+16 : 13 integrity, 2 serveur, 1 workflow) ; démarrage local OK
  (`"integrity":"observe"` dans le journal de démarrage).
- App non touchée (seul le journal) : `npm run test`, `npm run build`, lint vérifiés avant merge (voir PR).

## Suite
- **6b-2b** : plugin `PlayIntegrityPlugin.java` + `X-Integrity-Token` dans `aiRelay.js` ; puis lecture des journaux
  `event=integrity` et passage à `enforce`. Ensuite crédits durables (P24), 6d dès la vérification bancaire, jalon 4.
