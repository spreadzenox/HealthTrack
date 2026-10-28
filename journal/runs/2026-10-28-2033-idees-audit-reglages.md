# Run du 28/10/2026 20:33 (Paris, CET) — Idées : audit Paramètres, Données, Onboarding, Premium (POL-PLAY-12, suite)

**Type** : 💡 Idées (run de 20 h : pas de code produit)

## Constat au démarrage
- Main à `e1f97d4` (#483), v345 verte (Build & Release, Play — AAB, Tests, émulateur A56). Aucune PR « [Auto] » ouverte
  (PR #51 `cursor/*` non touchée).
- File de polissage vide (POL-PLAY-21 à 29 livrés aujourd'hui) : sujet choisi, la suite proposée par le run de 19:33,
  l'audit des écrans pas encore relus (Paramètres, Données, Réglages, Onboarding en sombre, Premium, Réintroduction),
  aussi dans l'état réel des testeurs (période de lancement).

## Fait
- `npm ci`, `npm run visual -- --play --dark` (démo, 29 captures, aucune erreur JS) et
  `npm run visual -- --play --subscription=launch --routes=/settings,/data,/recommendations,/reintroduction,/` (clair).
- Captures relues : Paramètres, Données, Réglages, Onboarding, Premium, Réintroduction, Analyses, Accueil. « Premium
  offert pendant le test, jusqu'au … : vous n'avez rien à payer » bien affiché dans Paramètres.
- Vérifié dans le code : `relay/src/credits.js` (`createFirestoreStore`, collection `credits`, aucun champ
  d'expiration), `app/public/privacypolicy.html` (« en mémoire »), `Data.jsx:314`, `Settings.jsx:43`,
  `permissionDisclosures.js:100` (« ne garde rien »), `app/store/data-safety/answers.mjs` (déjà prudent).
- `IDEES.md` : I189 (compteurs durables à dire et faire expirer), I190 (petits défauts). `BACKLOG.md` :
  **POL-PLAY-30 à 33**. `PRODUIT.md` : entrée du jour + action **P33** (politique TTL Firestore, après POL-PLAY-30).

## Défauts rangés (par impact)
30 textes publics « le serveur ne garde rien / en mémoire » inexacts depuis Firestore (P24), compteurs sans
expiration · 31 « Supprimer toutes mes données » pareil qu'« Importer » · 32 pistes titrées à l'impératif (« Dormir
un peu plus longtemps », règle 6) · 33 réintroduction (« pas testé » ×6, groupes sans chevron) et « 39 liens incertains ».

## Vérifications
- Journal seul : `npm run test` vert (2 627).

## Suite
- Runs de code : POL-PLAY-30 (avant les testeurs), puis 32, 31, 33 ; POL-PLAY-11 (alpha) quand Android vitals le permet.
