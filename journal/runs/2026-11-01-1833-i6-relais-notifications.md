# Run du 01/11/2026 18:33 (Paris, CET) — Notifications serveur de l'App Store (I6-RELAIS-3)

**Type** : 🍏 code (demande du propriétaire du 01/11 vers 17:10 : abonnements iPhone, priorité des runs de code)

## Constat au démarrage
- Main à `8a655d1` (#606), checks verts, aucune PR « [Auto] » ouverte, aucun « Build & Release » en cours.
- Demande reprise : **I6-RELAIS** (01/11 17:10), étape (3).

## Fait
- `relay/src/appstore.js` :
  - `createAppStoreNotifications({ verifyJws, bundleId, status })` : `handle(signedPayload)` vérifie l'enveloppe
    (même chaîne jusqu'à Apple Root CA - G3, 64 Kio au plus car trois JWS emboîtés), contrôle bundleId et
    environnement, vérifie `signedTransactionInfo` (et `signedRenewalInfo` s'il se vérifie), calcule les droits à la
    date de la notification et écrit l'état de l'abonnement : verrou si plus de droits (remboursé, révoqué, expiré,
    fin de grâce), ouvert sinon (renouvellement, nouvel achat, grâce, changement de formule ou de renouvellement).
    Une notification plus ancienne que l'état connu ne change rien (l'App Store relivre parfois).
  - `lockFor(tx)` : une transaction signée avant un verrou ne vaut plus ; `createAppStoreBilling` l'applique dans
    `verify` (devenu asynchrone) ; registre injoignable → l'abonné n'est jamais bloqué (`lockError`).
  - Registres : mémoire (tests, relais sans Firestore) et Firestore `appstore-status` (clé = empreinte SHA-256 de
    `originalTransactionId`, champs state / premium / at ; aucun identifiant de personne). Droit
    `roles/datastore.user` déjà accordé à relay-runtime (P24).
- `relay/src/billing.js` : `appStoreNotification(body)` → 200 (traitée, TEST, autre app, Xcode), 400 (signature
  fausse), 503 (registre injoignable : relivrée). Journal : type, sous-type, environnement, état, niveau, verrou et
  12 caractères de l'empreinte, rien d'autre.
- `relay/src/server.js` : route `POST /appstore/notifications` (corps ≤ 96 Kio) ; `index.js` : un seul vérificateur
  partagé, registre Firestore selon `CREDITS_STORE`.
- `relay/README.md` : la route et son URL.

## URL pour le propriétaire
`https://halcya-relay-81378799481.europe-west1.run.app/appstore/notifications` (App Store Connect → l'app → Informations
sur l'app → Notifications du serveur App Store, version 2, production et sandbox). À faire quand l'app iPhone existe dans
App Store Connect ; la routine iOS peut la reporter dans ses actions du propriétaire.

## Vérifications
- Relais : **129 tests verts** (+6) : enveloppe forgée, transaction emboîtée forgée, corps sans `signedPayload`,
  autre app, TEST, notification de plus de 16 Kio ; remboursement puis vérification refusée, nouvel achat signé après
  accepté, REVOKE ; grâce, fin de grâce, renouvellement qui lève le verrou, ancienne notification relivrée sans effet,
  passage à Gold, renouvellement coupé ; registre injoignable (503, abonné non bloqué) ; registre Firestore (requêtes
  simulées) ; route HTTP. Aucun identifiant d'installation, de transaction ni `appAccountToken` dans le journal ni le
  registre (testé). Chaîne de test générée à la volée, aucune clé dans le dépôt.
- App : aucun fichier touché (pas de capture ni de note de Nouveautés).

## Limite connue
- Le cache des droits du relais (1 h par installation, en mémoire) peut garder Gold jusqu'à 1 h après un remboursement.

## Suite
- **I6-RELAIS-6** : nom du magasin dans l'app (constante de distribution), liens de gestion App Store, « Passer à
  Gold » sans ancien jeton.
