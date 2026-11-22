# Run du 22/11 14:30 — FUSION-3, correctifs 11, 12, 22 et 23 (copie de secours)

**Type** : 🛠️ code (en coulisses) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main bf9ca81 au départ.

## État de départ
- main sur bf9ca81 (#1196, correctif 09) : Build & Release, Tests, Play — AAB verts ; émulateur Galaxy A56 en cours.
  Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, pas à la routine). Rien de neuf du propriétaire dans le prompt.

## Ce qui a été fait
**FUSION-3** : la copie de secours de l'iPhone (IndexedDB n'est pas durable dans WKWebView) passe dans le code partagé,
quatre correctifs d'un coup parce qu'ils forment un seul sujet :
- `snapshot.js`, `SnapshotRestore.jsx`, `SnapshotWelcome.jsx` et leurs tests (`snapshot.test.js`,
  `snapshotHiddenLinks.test.js`, `SnapshotRestore.test.jsx`, `SnapshotWelcome.test.jsx`) : `iphone/overlay/app/src/ios/` → `app/src/ios/`.
- 11 : `main.jsx` lance `startSnapshots()` si `VITE_DISTRIBUTION === 'appstore'` (code mort ailleurs, comme avant).
  La phrase de Sauvegarde sur la copie (« Une copie de secours est tenue à jour dans l’app Fichiers… ») rejoint le
  correctif 06, qui porte déjà le texte iPhone de cette phrase.
- 12 : `Data.jsx` monte « Restaurer la copie de secours » si `window.Capacitor` est sur iOS.
- 22 : `deleteAllData.js` appelle `deleteDeviceSnapshot()` (rend `false` sans rien toucher hors iPhone).
- 23 : `Onboarding.jsx` monte l'encart « Reprendre mes données » au premier écran, sur iOS seulement (monté partout, il
  cassait 6 tests d'accueil qui simulent la base sans `parseBackup`).
- Nouveau test `app/src/ios/snapshot.android.test.jsx` : sur Android, aucune lecture ni effacement, rien d'affiché.
- `overlay/…/Data.ios.test.jsx` : `window.Capacitor` iOS posé pour le test de restauration (comme dans l'app réelle).
- `snapshotFolder.test.js` (nom du dossier côté Swift) reste dans `overlay/` : il lit le projet iOS.
- Correctifs 11, 12, 22, 23 supprimés : **33 restent**. Rien de visible sur Android : pas de note de Nouveautés.

## Vérifications
- Android : Vitest complet 4 303 tests verts (44 sautés), lint sans erreur, build OK, `npm run visual` (voir PR).
- iPhone : `scripts/upstream.sh` applique les 33 correctifs (v1257) ; dans `iphone/upstream/app`, Vitest complet
  4 596 tests verts, ESLint sans erreur. Build iPhone de la PR (simulateur) au passage en « prête ».

## Suite proposée
1. FUSION-3 : correctif 06 (textes de l'iPhone, `FEATURES.iosStore` partout : gros, à découper) ou 13 (divulgation Santé).
2. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45 ; demain lundi, archive de S47.

## Pour le propriétaire
« 👉 PI2 prête » (inchangé). Parité iPhone : 70 %. TestFlight : 1244.1244 chez « Testeurs Halcya ». Testeurs Play :
4 inscrits sur 12 (dernier relevé connu).
