# Run 24/11 09:30 — FUSION-3 : les tests de l'iPhone quittent `overlay/`

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main af149d1 (#1234), Tests,
émulateur, Build & Release et Play — AAB verts · **TestFlight** : 1290.1290 chez « Testeurs Halcya », en examen bêta
depuis le 24/11 04:32 UTC (pas relevé de nouveau ce run) · **Parité** : 70 % (33/47)

## État de départ
- main vert. Aucune PR « [Auto] » ouverte ; #51 (`cursor/*`) pas touchée.
- `iphone/patches/` vide depuis #1233 : FUSION-3 passe à l'étape 2, `overlay/` (93 fichiers).

## FUSION-3, étape 2 : 1er sujet, les tests sans lecture de fichier
- 34 fichiers de test de l'iPhone (`*.appstore.test.*`, `*.ios.test.*`, tests de `ios/` qui ne relisent aucun fichier)
  et `ios/cameraPermission.js` passent de `iphone/overlay/app/src/` à `app/src/`, sans changement. Depuis le correctif
  01 (variante `appstore` dans le code commun), ils tournent dans l'arbre d'Android : 97 tests, tous verts du premier
  coup. Ils protègent désormais l'iPhone dès les tests d'une PR Android, sans attendre le job iPhone.
- `cameraPermission.js` n'est importé par aucun écran (seul son test l'appelle) : déplacé tel quel, à brancher ou
  retirer (noté au BACKLOG).
- Restent dans `overlay/` : les 40 notes de Nouveautés `["appstore"]` (le prompt leur donne ce chemin, elles y
  restent), 12 tests qui relisent des fichiers de `iphone/` ou les workflows (à déplacer avec `ios/` → `app/ios/`),
  les pages publiques de l'iPhone (FUSION-4) et 2 images de Pilou.

## Vérifications
- `npm run test` : 4 594 tests verts (4 497 + 97) ; `npm run lint` : 0 erreur ; `npm run build` vert ;
  `npm run visual` : voir la PR. Aucun écran ne change : pas de capture à comparer, pas de note de Nouveautés.
- La PR touche `app/` : un seul build iPhone (PR ouverte prête, travail fini). Merge au run suivant.

## Suite
1. Run suivant : checks de la PR (dont « iOS — build simulateur »), puis merge.
2. FUSION-3 : les 2 images de Pilou (`app/public/companion/`) si elles servent, puis `ios/` → `app/ios/` avec les
   12 tests qui relisent des fichiers.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.
