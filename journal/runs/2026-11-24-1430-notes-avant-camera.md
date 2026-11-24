# Run 24/11 14:30 — #1239 mergée, notes d'avant la caméra dans Tendances › Jour

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 14df195 vert (Tests,
émulateur A56, Build & Release, Play — AAB) avant le merge de #1239 · **TestFlight** : 1290.1290 chez « Testeurs
Halcya » (pas relevé de nouveau ce run) · **Parité** : 70 % (33/47)

## État de départ
- #1239 (retouche de POLISH-SIM-94) ouverte par le run de 13:30 : 15 checks verts, dont « Build iOS (simulateur) et
  captures » et les 5 émulateurs Android ; branche à jour sur main.
- Captures iPhone regardées (branche `captures/pr-1239`, Tendances en clair et en sombre, données de démo) : rien de
  cassé. **#1239 mergée** (squash, titre et texte écrits à la main, sans ligne d'attribution).
- #51 (`cursor/*`) pas touchée.

## POLISH-SIM-88 soldée
- « Tendances › Jour dit « Aucune lecture du visage ce jour-là » alors qu'une note existe » : le cas sans caméra
  était réglé par POLISH-SIM-117 (19/11). Restait un trou : dès qu'une lecture du visage existe,
  `loadFaceMoodEntries` ne lisait les notes que depuis le jour de la première lecture. Une note donnée avant
  d'activer la caméra n'apparaissait donc plus dans Tendances (Jour, détail du jour, jour ouvert par défaut).
- `faceMoodData.js` : avec `notesAlways` (Tendances seulement), toutes les notes de bien-être et digestives sont lues,
  sans borne ; l'Accueil garde sa lecture bornée (budget de lectures inchangé).
- Test écrit d'abord dans `faceMoodData.test.js` (rouge, puis vert).
- Les trois autres points (« + » de la carte Pas d'Aujourd'hui, « repas incomplets ? » du Journal, « Dépense
  2 352 kcal ») portaient sur des écrans retirés par la refonte : rien à faire.

## Vérifications
- `npm run test` : 4 643 verts ; `npm run lint` : 0 erreur ; `npm run build` vert.
- Capture `npm run visual -- --routes=/tendances --click="Jour"` regardée : vue Jour d'aujourd'hui, 3 lectures, rien
  de changé. Le build iPhone de la PR fait la capture iPhone ; à relire avant le merge.
- Note de Nouveautés `2026-11-24-1430-notes-avant-camera.json` (code partagé, Android et iPhone).

## Suite
1. Run suivant : checks de la PR (dont le build iPhone), puis merge.
2. FUSION-3 étape 3 : réponse de l'orchestrateur attendue (notes `["appstore"]` dans `app/src/data/changelog/` ?).
3. `ios/cameraPermission.js` (non branché) : à brancher ou retirer.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.
