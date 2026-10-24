# 2026-10-24 10:30 Paris (08:30 UTC) — 6e : paiement à régulariser sur l'Accueil, scénario P27

**Type** : 🧭💳 chantier produit — jalon 6, étape 6e (critère C3 de la version candidate)

## Constat au démarrage
- Main à `622ebe3` (#315), tous les workflows verts ; aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- 6d livré à 09:30 (abonnements actifs chez Google). 6e spécifié par I159, avec une question ouverte : carte Accueil
  « paiement à régulariser » en grâce / suspension → décidé : oui (recommandation Google, petit, testable).

## Ce qui a été fait
- `services/entitlement.js` : `paymentIssue(ent)` (pur) → `{ title, text, url }` pour `grace` et `on_hold`, sinon
  `null` (rien pour `paused`, `expired`, `active`).
- `components/PaymentIssueCard.jsx` : carte en haut de l'Accueil, variante play seulement (`FEATURES.billing`), suit
  `useEntitlement` (apparaît / disparaît avec chaque état donné par le relais) ; bouton « Mettre à jour mon
  paiement » → `manageSubscriptionUrl(productId)`. Style : surface neutre, bordure orange `--color-alert`.
- `scripts/visual/visual-check.mjs` : `--subscription=grace` et `--subscription=on_hold`.
- `PRODUIT.md` : **P27**, le scénario testeur de licence en 7 cases (I159), pas à pas, avec les durées accélérées.
- Nouveautés : `2026-10-24-1030-paiement-a-regulariser.json` (`variants: ["play"]`).
- Tests : 3 dans `entitlement.test.js`, 3 dans `PaymentIssueCard.test.jsx`.

## Vérifications
- `npm run test` : 174 fichiers, 2 122 tests verts. `npm run build` OK. `npm run lint` : 6 erreurs, identiques à main.
- `npm run visual` (13 pages, sideload) : 0 erreur JS, aucun débordement. `--play --billing --subscription=grace` et
  `=on_hold` (clair) et `grace --dark` : captures de l'Accueil relues (1er passage : bouton qui chevauchait le texte,
  corrigé en `display: block`).

## Suite
- **P27** (propriétaire) : seule preuve qui manque à C3.
- Prochain run de code : 6b-2c (journaux `event=integrity`, puis `enforce`) s'il y a des analyses IA journalisées
  depuis la version play, sinon M4.
