# Run 24/11 12:30 — #1237 mergée, « Poids · dès 3 pesées » dans Tendances

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 7836f4e vert (Tests,
émulateurs, Build & Release, Play — AAB) avant le merge de #1237 · **TestFlight** : 1290.1290 chez « Testeurs Halcya »
(pas relevé de nouveau ce run) · **Parité** : 70 % (33/47)

## État de départ
- #1237 (FUSION-3, 10 derniers tests de l'iPhone hors d'`overlay/`) ouverte par le run de 11:30 : 15 checks verts,
  dont « Build iOS (simulateur) et captures » et les 5 émulateurs Android ; branche à jour sur main ; aucun écran
  touché. **#1237 mergée** (squash, titre et texte écrits à la main, sans ligne d'attribution).
- #51 (`cursor/*`) pas touchée. FUSION-3 étape 3 toujours en attente de la réponse de l'orchestrateur (notes
  `["appstore"]` dans `app/src/data/changelog/` ?).

## POLISH-SIM-94 : une mesure sans sa courbe reste visible
- Constat (persona « Maigrir » J1) : après une première pesée, Tendances ne montrait le poids nulle part. Pire qu'au
  constat : avec les seuls Pas comme courbe, le « + » n'apparaissait même pas.
- `TrendsViewer.jsx` : les mesures qui ont au moins une valeur ce mois-ci sans leurs 3 points sont listées grisées,
  sans effet (`aria-disabled`), dans « + » et sous « Choisissez une courbe » : « Poids · dès 3 pesées », sinon
  « · dès 3 jours » ; leur nom complet pour le lecteur d'écran (« Poids, la courbe arrive à 3 pesées »). « + »
  s'affiche aussi quand seule une mesure en attente peut s'y ajouter. Sans aucune courbe, une seule pesée dit
  « Poids : la courbe arrive à 3 pesées. » au lieu de « Vos courbes apparaîtront… ». La série du mois est calculée
  une fois au lieu de deux.
- 4 tests dans `Trends.test.jsx` (écrits d'abord, rouges, puis verts).
- **POLISH-SIM-95** (point du jour des pas qui fait plonger la courbe) : déjà fait par POLISH-SIM-127 (`cumulative`),
  cochée.

## Vérifications
- `npm run test` : 4 642 verts ; `npm run lint` : 0 erreur ; `npm run build` vert.
- Captures `npm run visual -- --routes=/tendances --history-days=4 --weigh-in --click="Ajouter une mesure"`, en clair
  et en sombre, regardées : la puce grise « Poids · dès 3 pesées » à la suite des mesures ajoutables, lisible dans
  les deux thèmes. Le build iPhone de la PR fait la capture iPhone ; à relire avant le merge.
- Note de Nouveautés `2026-11-24-1230-poids-des-3-pesees.json` (code partagé, Android et iPhone).

## Suite
1. Run suivant : checks de la PR (dont le build iPhone, capture de Tendances), puis merge.
2. FUSION-3 étape 3 : réponse de l'orchestrateur attendue (voir run de 11:30).
3. `ios/cameraPermission.js` (non branché) : à brancher ou retirer.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.
