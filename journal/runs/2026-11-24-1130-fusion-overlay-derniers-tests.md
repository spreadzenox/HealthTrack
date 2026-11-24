# Run 24/11 11:30 — #1236 mergée, derniers tests de l'iPhone sortis d'`overlay/`

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 2aee84e vert (Tests,
émulateurs, Build & Release, Play — AAB) avant le merge de #1236 · **TestFlight** : 1290.1290 chez « Testeurs Halcya »,
examen bêta depuis le 24/11 04:32 UTC (pas relevé de nouveau ce run) · **Parité** : 70 % (33/47)

## État de départ
- #1236 (FUSION-3, images de Pilou et pages publiques de l'iPhone dans `app/public/`) ouverte par le run de 10:30 :
  17 checks verts, dont « Build iOS (simulateur) et captures » (37 min) et les 5 émulateurs Android ; branche à jour
  sur main. Aucun écran touché, pas de capture à relire.
- **#1236 mergée** (squash, titre et texte écrits à la main, sans ligne d'attribution).
- #51 (`cursor/*`) pas touchée.

## FUSION-3 : les 10 derniers tests de l'iPhone quittent `overlay/`
- Déplacés dans `app/src/` : `ios/billingFake`, `iosMinimum`, `privacyManifest`, `snapshotFolder`, `storeName`,
  `textesIphoneSlop`, `usageDescriptions` ; `pages/Onboarding.css.appstore`, `pages/Recommendations.css.appstore` ;
  `settings/onboarding.appstore` (celui-ci ne lisait aucun fichier, oublié au run de 09:30).
- Nouveau `app/src/ios/iphonePaths.js` (pour les tests seulement) : `iosDir()` rend `app/ios` s'il existe (build iOS,
  et après l'étape 3), sinon `iphone/ios` ; `iphoneDir()` et `iosWorkflow()` partent de la racine du dépôt, premier
  parent qui contient `iphone/ios` (vrai depuis `app/` comme depuis `iphone/upstream/app`).
- `storeName.test.js` lit `ios-testflight.yml` sous son vrai nom ; `upstream.sh` ne recopie plus les workflows dans
  `iphone/.github` (plus rien ne les y lisait), il efface seulement l'ancienne copie.
- **`overlay/` ne garde que les 40 notes de Nouveautés `["appstore"]` et leur test** (`changelog.appstore.test.js` a
  besoin de ces notes dans `ALL_CHANGELOG`). Le prompt leur donne ce chemin : elles y restent.

## Vérifications
- Depuis `iphone/upstream/app` (`scripts/upstream.sh` en mode HEAD, comme la build iOS) : 35 fichiers, 248 tests verts ;
  depuis `app/` : 34 fichiers, 236 tests verts.
- `npm run test` dans `app/` : 4 638 tests verts (456 fichiers) ; `npm run lint` : 0 erreur ; `npm run build` vert. Aucun écran ne change : pas de capture à
  comparer, pas de note de Nouveautés.
- PR ouverte prête (travail fini) : un seul build iPhone, merge au run suivant.

## Suite
1. Run suivant : checks de la PR (dont le build iPhone), puis merge.
2. FUSION-3 étape 3 (`ios/` → `app/ios/`, fin d'`upstream.sh`) : bloquée tant que les notes iPhone doivent vivre dans
   `iphone/overlay/` (chemin du prompt). Question pour l'orchestrateur : les ranger dans `app/src/data/changelog/`
   avec `"variants": ["appstore"]` ? En attendant, l'étape peut se préparer sans rien déplacer (workflows qui
   construiraient dans `app/`).
3. `ios/cameraPermission.js` (non branché) : à brancher ou retirer.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.
