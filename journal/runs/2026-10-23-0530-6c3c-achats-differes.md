# 2026-10-23 05:30 Paris (03:30 UTC) — 6c-3c : achats confirmés plus tard

**Type** : 🧭💳 chantier produit, jalon 6 (étape 6c-3c)

## Constat
- Main à `6e0b5a2` (#285) ; Build & Release, Play — AAB, Relais — déploiement, Tests, émulateur, Pages et fiche du
  Store verts. Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée). Run de code (05:30).

## Ce qui a été fait
- `playBilling.js` :
  - `handlePurchasesUpdated(event)` : un achat terminé hors du parcours d'achat (paiement en attente confirmé, code
    promo utilisé dans le Play Store, achat pendant que la page était fermée) → jeton retenu et revérifié par le relais.
  - `startPurchaseWatch()` : écoute l'événement natif `purchasesUpdated` et relit les achats au démarrage puis à chaque
    retour dans l'app (`visibilitychange`, au plus une fois par 15 min), comme Google le recommande (un achat confirmé
    app fermée n'est livré que par `queryPurchases`).
  - Un même jeton n'est vérifié qu'une fois à la fois (l'événement natif et la fin de `purchase()` arrivent ensemble).
- `entitlement.js` : événement `window` `halcya:entitlement` à chaque nouvel état donné par le relais ; hook
  `useEntitlement` utilisé par le paywall, le bloc « Abonnement » des Paramètres et `AiCreditsHint` (compteur relu quand
  le premium s'ouvre ou se ferme). Le paywall efface le message « paiement en attente » quand le premium arrive.
- `Layout.jsx` : `usePurchaseWatch` (variante play seulement, import dynamique : rien dans le fichier principal).
- Faux plugin du visuel : `addListener`.

## Vérifications
- `npm run test` **1 925 verts** (+8) ; `npm run build` OK ; lint 6 erreurs avant / 6 après (préexistantes).
- `npm run visual -- --play --routes=/settings,/premium,/` : captures lues (paywall, accueil), aucune erreur JS ;
  `npm run visual` complet (sideload) : 12 pages, aucune erreur JS.

## Suite
- **6b-2** Play Integrity (contre l'abus des crédits par réinstallation) ; crédits durables (P24, après accord) ;
  6d dès la vérification bancaire ; puis jalon 4 (onboarding court, « aha », paywall soft).
