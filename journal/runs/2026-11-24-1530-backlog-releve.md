# Run 24/11 15:30 — #1240 mergée, backlog relu (journal seulement)

**Type** : 📓 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 6b72ff9 vert (Tests,
émulateur A56, Build & Release, Play — AAB) avant le merge de #1240 · **TestFlight** : 1290.1290 chez « Testeurs
Halcya » (pas relevé de nouveau ce run) · **Parité** : 70 % (33/47)

## État de départ
- #1240 (POLISH-SIM-88, run de 14:30) : 15 checks verts, dont « Build iOS (simulateur) et captures » et les
  émulateurs Android ; branche à jour sur main.
- Captures iPhone regardées (branche `captures/pr-1240` : `demo-clair-tendances-jour-veille`, `demo-sombre-tendances`) :
  Jour du 22/11 avec la note (losange), détail « Ce qui a pu jouer ce jour-là » ; Semaine en sombre avec l'attendu.
  Rien de cassé. **#1240 mergée** (squash, titre et texte écrits à la main, sans ligne d'attribution).
- #51 (`cursor/*`) pas touchée. Aucune autre PR ouverte.

## Backlog relu (sans code)
- **POLISH-SIM-75** soldée : déjà réglée par POLISH-SIM-107 (la mesure choisie reste en Jour, test dans
  `Trends.test.jsx`).
- **POLISH-SIM-98** soldée : le compteur « 01/06 » et l'explication de l'IA répétée n'existent plus dans l'accueil de
  la refonte ; la visite guidée ne montre plus de cigarette ; « + 1 cigarette » attend que le compteur soit activé.
- **`ios/cameraPermission.js`** tranché : code mort depuis le retrait de `PermissionsStep.jsx` (08/11). À retirer
  (avec son test, et `requestCamera` natif s'il ne sert plus) dans la prochaine PR qui lance de toute façon un build
  iPhone : pas de build de Mac pour du code mort seul (CI économe, S47 à environ 21 h de Mac par jour).

## Vérifications
- Seul le journal change : `npm run test` passe sur la PR (check « Frontend (Vitest) »).

## Suite
1. Prochain run de code : un correctif visible du backlog, avec le retrait de `cameraPermission.js` dans la même PR.
2. FUSION-3 étape 3 : réponse de l'orchestrateur attendue (notes `["appstore"]` dans `app/src/data/changelog/` ?).

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.
