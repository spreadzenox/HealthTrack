# Run du 20/11 07:30 — Notes de Nouveautés sur le bon téléphone (DEM-IOS-5, 11, 12)

**Type** : 🛠️ code (polish, sortie d'un correctif iPhone) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main edd9131.

## État de départ
- main (#1140) : Tests, Build & Release, Play — AAB et émulateur verts.
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas à nous).
- 07:30 : trop tôt pour les captures App Store de jour (REFONTE-2-ASC) ; PI2 attend la build de la refonte (21 ou 22/11).

## Ce qui a été fait
- **DEM-IOS-5** et **DEM-IOS-11** : `2026-11-11-1635-noter-objectif` (« Sans Health Connect… ») et
  `2026-10-29-0533-paywall-lancement` (Premium offert pendant le test, période play) portent `["play", "sideload"]` :
  l'iPhone ne les montre plus.
- **DEM-IOS-12** : `2026-11-07-2150-norme-apres-changement` et `2026-11-07-2200-bien-etre-du-jour-ts1` décrivent du
  code partagé : plus de `variants`, l'iPhone les montre aussi. Elles sont plus anciennes que la dernière note lue :
  aucune ne devient « non lue » (`getUnseenEntries` compare les ids).
- **Correctif iPhone 33 retiré** (« Sort des correctifs ») : le test des Nouveautés de `app/src` admet la variante
  `appstore` (notes propres à l'iPhone dans `iphone/overlay/…/changelog/`), comme le faisait le correctif.
  Commentaire de `changelog.js` mis à jour (plus de dépôt HealthTrack-iOS).
- Tests d'abord : 2 rouges dans `changelog.test.js` (variantes attendues), puis verts ; un 3e test : une note
  `appstore` ne s'affiche ni sur play ni en sideload.
- Pas de note de Nouveautés : rien ne change sur Android, et sur iPhone ce ne sont que des notes anciennes rangées.

## iPhone
- `upstream.sh` (HEAD) : **49 correctifs** s'appliquent en série ; tests des Nouveautés verts dans `upstream/app` (21).
  Parité inchangée : 70 %. TestFlight : 1196.1196 chez les testeurs externes (relevé de 03:30).

## Vérifications
- `npm run test` (app) : 4 136 verts ; `npm run build` vert ; lint des fichiers touchés propre ;
  `npm run visual --routes=/nouveautes` vert, capture relue (inchangée sur Android).

## Suite proposée
1. Finir cette PR (checks, build iOS, capture iPhone de Nouveautés), merger.
2. Run « idées » de 08:00 : fin du passage UPG-3 des personas.
3. De jour : captures App Store de la refonte (REFONTE-2-ASC), puis PI2 (21 ou 22/11).
