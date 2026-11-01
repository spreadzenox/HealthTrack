# Run du 01/11/2026 19:33 (Paris, CET) — Nom du magasin dans l'app (I6-RELAIS-6)

**Type** : 🍏 code (demande du propriétaire du 01/11 vers 17:10 : abonnements iPhone, priorité des runs de code)

## Constat au démarrage
- Main à `2657875` (#608), derniers workflows verts, aucune PR « [Auto] » ouverte, aucun « Build & Release » en cours.
- Demande reprise : **I6-RELAIS** (01/11 17:10), étape (6).

## Fait
- `app/src/config/distribution.js` : `STORES`, `resolveStore`, `storeFor`, `storeOfPurchase`, `STORE`
  (`VITE_STORE`, `play` par défaut). Champs : `name` (« Google Play » / « l’App Store »), `Name` (début de phrase),
  `inStore`, `fromStore`, `account` (« ce compte Google Play » / « ce compte Apple »), `at` (« chez Google Play » /
  « chez Apple »), `manageUrl(productId)`.
- `services/entitlement.js` : `source: 'appstore'` gardé ; `manageSubscriptionUrl(productId, source)` ; textes de
  grâce et de suspension (Paramètres, carte de l'Accueil) selon le magasin de l'achat.
- `services/playBilling.js` : messages d'erreur, d'attente et `ALREADY_GOLD_MESSAGE` tirés du magasin ;
  `purchasePlan(plan, { store })` : sur l'App Store, aucun `oldPurchaseToken` ni `replacementMode`.
- `pages/Premium.jsx`, `pages/Settings.jsx` : les textes en dur remplacés ; « Gérer mon abonnement » et « Passer à
  Gold » aussi pour un achat `appstore`.

## Vérifications
- `npm run test` : 2 847 verts (+6 : constante, liens, grâce App Store, source gardée, passage sans ancien jeton,
  page d'abonnement d'un abonné Silver App Store). `npm run build` OK. `npm run lint` : 6 erreurs, comme avant.
- `npm run visual` (aucune erreur JS) ; `--play --routes=/premium` : « Annulable à tout moment dans Google Play »
  inchangé ; même capture avec `VITE_STORE=appstore` : « … dans l’App Store ».
- Aucune note de Nouveautés : rien ne change à l'écran sur Android.

## Demandes reprises
- I6-RELAIS (01/11 17:10) : (1), (2), (3), (4) et (6) livrées ; (5) App Attest reste pour plus tard (exemption iOS
  inchangée).

## Pour la routine iOS
- Construire avec `VITE_STORE=appstore`.
- Le garde « déjà Gold » compare les `products` rendus par le plugin à `halcya_premium` / `halcya_gold` : le plugin
  StoreKit doit les rendre sous ces noms (ou `OWN_PRODUCTS` doit apprendre les produits iPhone).
- Le rappel de fin d'essai reste réservé aux achats Play.

## Suite
- GOLD-a2 (vérifier Gold en production), GOLD-a3, puis le polissage de la version Play.
