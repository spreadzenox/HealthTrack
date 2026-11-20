# Run du 20/11 06:30 — Poids de Health Connect dit comme tel (DEM-IOS-10)

**Type** : 🛠️ code (polish, sortie d'un correctif iPhone) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main 48212eb.

## État de départ
- main (#1139) : Tests, Build & Release, Play — AAB, émulateur et Relais — déploiement verts.
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas à nous).
- Captures App Store de la refonte (REFONTE-2-ASC) : à faire de jour (9:00-17:00), pas à 06:30. PI2 : build de la
  refonte à choisir le 21 ou le 22/11.

## Ce qui a été fait
- **DEM-IOS-10** (demande iOS du 29/10, jamais faite côté Android) : dans Nutrition › « Votre profil », un poids lu
  dans Health Connect (`source: 'health_connect'`) avait l'origine `manual` et se disait « (saisi le 28/10) ».
  - `bodyProfile.js` : origine `health` pour une mesure de Health Connect ; `getLatestBodyComposition` prend aussi la
    masse grasse de Health Connect et rend sa source.
  - `BodyProfileCard.jsx` : « (Health Connect, 28/10) » sur Android, « (app Santé, 28/10) » sur iPhone
    (`Capacitor.getPlatform()`), même chose pour la taille et la composition.
- **Correctif iPhone 35 retiré** (« Sort des correctifs ») : son changement vit dans le code partagé, sans
  `FEATURES.iosStore`. Ses deux tests d'overlay sont portés dans `app/src` (`bodyProfile.test.js`, nouveau
  `BodyProfileCard.test.jsx` avec la plateforme simulée) et retirés de `iphone/overlay/`.
- Tests d'abord : 2 rouges dans `bodyProfile.test.js`, 3 rouges dans `BodyProfileCard.test.jsx`, puis verts.
- Notes de Nouveautés : `2026-11-20-0630-poids-health-connect` (play, sideload) et
  `iphone/overlay/…/2026-11-20-0630-poids-app-sante-iphone` (appstore).

## iPhone
- `upstream.sh` (HEAD) : **50 correctifs** s'appliquent en série ; tests du profil et de Nutrition verts dans
  `upstream/app` (21). Parité inchangée : 70 %. TestFlight : 1196.1196 chez les testeurs externes (relevé de 03:30).

## Vérifications
- `npm run test` (app) : 4 133 verts ; `npm run build` vert ; lint des fichiers touchés propre ;
  `npm run visual --routes=/food` vert, capture relue (inchangée : la provenance ne s'affiche qu'au toucher, et le
  poids des données de démo vient de Withings).

## Suite proposée
1. Finir cette PR (checks, build iOS, capture iPhone de Nutrition), merger.
2. Run « idées » de 08:00 : fin du passage UPG-3 des personas.
3. De jour : captures App Store de la refonte (REFONTE-2-ASC), puis PI2 (21 ou 22/11).
