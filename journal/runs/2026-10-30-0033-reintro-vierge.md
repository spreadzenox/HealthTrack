# Run du 30/10/2026 00:33 (Paris, CET) — Réintroduction : préparation relue (POL-PLAY-51)

**Type** : 🎨 Code (polissage de la version play, suite de l'audit POL-PLAY-12)

## Constat au démarrage
- Main à `c89269f` (#512), tous les workflows verts (Tests, Build & Release, Play — AAB, émulateur) ; aucune PR
  « [Auto] » ouverte (PR #51 `cursor/*` non touchée).
- Audit `npm run visual -- --play --empty --subscription=launch --routes=/montre,/reintroduction` (clair et sombre,
  puis `--click="Blé"` et `--click="Oignon"`) :
  - Réintroduction, préparation : « repère général, à adapter avec votre diététicienne » en mono dans une étiquette
    (DESIGN : mono pour les chiffres, jamais pour des phrases ; même défaut que POL-PLAY-47).
  - Choix des groupes, mise en garde du bas : rien à redire.
  - Montre vierge : « Aucune montre connectée pour l'instant… » + « Connecter une montre » : clair, rien à redire.

## Fait
- `pages/Reintroduction.jsx` / `.css` : `.fodmap-plan-note` (phrase Figtree, 0,85 rem) au lieu de `fodmap-tag mono`.

## Tests
- `Reintroduction.test.jsx` : la note n'a pas la classe `mono` (rouge avant le correctif, vert après).

## Vérifications
- `npm run test` (2 700 verts), `npm run build`, `npm run lint` (6 erreurs, inchangé), `npm run visual` (démo,
  toutes les pages, aucune erreur JS) ; captures relues : préparation Blé (clair) et Oignon (sombre).

## Données
- Aucune : affichage seulement.

## Demandes iOS
- Page commune aux deux plateformes : note de Nouveautés sans `variants`.

## Suite
- POL-PLAY-12 : audit de la Réintroduction en cours de test (`--fodmap=day2`, `=question`, `=result`) en démo,
  clair et sombre ; POL-PLAY-11 quand Android vitals le permet.
