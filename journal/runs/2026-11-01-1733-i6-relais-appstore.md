# Run du 01/11/2026 17:33 (Paris, CET) — Achats App Store vérifiés par le relais (I6-RELAIS-1+2)

**Type** : 🍏 code (demande du propriétaire du 01/11 vers 17:10 : abonnements iPhone, priorité des runs de code)

## Constat au démarrage
- Main à `d2089b6` (#603). PR #604 (journal du run précédent, GOLD-b5) ouverte depuis 15 min, checks en cours :
  run précédent encore actif → je n'ai touché ni au journal ni à l'app avant son merge (fait pendant ce run, `2f88568`),
  seulement au relais.
- Demande reprise : **I6-RELAIS** (01/11 17:10), étapes (1) et (2).

## Fait
- `relay/src/appstore.js` (nouveau) :
  - racine publique **Apple Root CA - G3** embarquée (téléchargée sur apple.com, empreinte SHA-256
    `63:34:3A:BF…:91:79` vérifiée et testée) ;
  - `createAppStoreVerifier` : JWS ES256, `x5c` de trois certificats, racine égale octet pour octet à une racine de
    confiance, intermédiaire CA émis et signé par la racine, feuille non CA émise et signée par l'intermédiaire,
    marqueurs OID de l'App Store (feuille 1.2.840.113635.100.6.11.1, intermédiaire 1.2.840.113635.100.6.2.1),
    signature P1363 sur 64 octets, validité des certificats à `signedDate` (comme la bibliothèque d'Apple) ;
  - `createAppStoreBilling` : bundleId (`APPSTORE_BUNDLE_ID`, défaut `fr.jpesquet.sante`), environnement Sandbox ou
    Production (Xcode refusé), type « Auto-Renewable Subscription » ; `renewalInfo` facultatif vérifié pareil, ignoré
    s'il ne se vérifie pas ou concerne un autre abonnement ;
  - `entitlementFromTransaction` : `active` / `canceled` (renouvellement coupé, premium jusqu'à l'échéance) / `grace`
    / `expired` / `revoked` ; `halcya_gold…` → Gold, `halcya_premium…` → Silver, autre → rien ; essai ; `test` =
    Sandbox ; `appAccountTokenFor(installation)` = 32 premiers chiffres de `accountIdFor` au format UUID.
- `relay/src/billing.js` : `createBillingRoutes({ appStore })` ; un jeton en forme de JWS va à l'App Store (aucun
  appel à Google), sinon chemin Play inchangé ; refus → 400 `invalid_purchase` (journal : code d'erreur et empreinte
  du jeton seulement) ; `verifyResponse` garde la source de l'achat (`appstore`, `data.transaction.type:
  'ios-appstore'`) ; `isTokenShape` accepte un JWS jusqu'à 16 Kio (`purchaseTokenFrom` et `X-Purchase-Token` de
  l'analyse, donc crédits Silver 10 / Gold 20 inchangés).
- `relay/src/index.js`, `config.js` : vérificateur branché sur la vraie racine d'Apple.

## Vérifications
- Relais : **123 tests verts** (+10 dans `test/appstore.test.js`) : racine d'Apple, forme JWS vs jeton Play,
  `appAccountToken`, niveaux, refus (racine inconnue, racine de confiance collée sur une chaîne étrangère, feuille
  étrangère, OID absents, autre clé, contenu modifié, `alg: none`, chaîne courte, certificats hors validité, chaîne de
  test refusée par la vraie racine), droits (actif, Gold, essai, expiré, remboursé, grâce, renouvellement coupé),
  contrôles (autre app, Xcode, non-abonnement, autre installation), route complète (iPhone sans appel à Google,
  Play inchangé, période de lancement). Chaîne de test générée par openssl dans un dossier temporaire effacé : aucune
  clé ni vraie transaction dans le dépôt.
- App : aucun fichier touché (pas de capture, pas de note de Nouveautés) ; checks CI de la PR.

## Demandes iOS
- I6-RELAIS (1) et (2) faits. `accountMatch` rapporté sans bloquer, comme pour Play (une réinstallation change
  l'identifiant d'installation ; la restauration doit rester possible). Question notée au BACKLOG : la période de
  lancement s'applique aussi aux requêtes iPhone sans jeton.

## Suite
- **I6-RELAIS-3** : route des notifications serveur V2 (`/appstore/notifications`) et son URL pour le propriétaire.
- **I6-RELAIS-6** : nom du magasin dans l'app (constante de distribution), liens de gestion App Store.
