# Run du 19/11 16:30 — Temps d'écran seulement s'il est possible (POLISH-SIM-105i)

**Type** : 🛠️ code (polish de la refonte, objectif du 22/11) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main 04708db.

## État de départ
- main vert (#1125 : Tests, Build & Release, Play — AAB verts ; émulateur en cours au départ).
- Aucune PR « [Auto] » ouverte (seule #51, brouillon de mai, hors routine).
- iPhone : `upstream.json` à `HEAD` ; rien chez Apple avant l'envoi du soir.

## Ce qui a été fait
- **POLISH-SIM-105i** : `usePhoneUsageSupported()` dans `Onboarding.jsx` (code partagé) lit
  `checkPhoneUsageAccess().supported`. Faux sur iPhone avant iOS 26.4 et sur Android 8 (le plugin Android répond
  `supported: SDK >= 28`) :
  - temps 2 : pas de ligne « Temps d'écran », sauf si elle était déjà allumée (pour pouvoir la couper) ;
  - temps 3 : « temps d'écran » n'est plus dit « Activables dans Réglages › Sources », ni en tuile.
- **Sort des correctifs** : le correctif iPhone 55 (même condition, derrière `FEATURES.iosStore`) est retiré, sa
  condition vit maintenant dans le code partagé. 51 correctifs.
- Tests écrits d'abord (`Onboarding.test.jsx`, 4 cas) : 2 rouges sans le changement, tous verts avec.
- Notes de Nouveautés : `2026-11-19-1630-temps-ecran-pris-en-charge` (play, sideload) et, pour l’iPhone, `iphone/overlay/…/2026-11-19-1630-temps-ecran-iphone` (appstore) : la première note citait « Android » et cassait le test des notes iPhone de la PR.

## iPhone
- `scripts/upstream.sh` (HEAD, dossier de travail) : 51 correctifs appliqués ; tests de `Onboarding*` et
  `PhoneUsageCard*` de l'overlay verts, dont « temps d'écran sous iOS 26.4 : pas de ligne à l'accueil ».
- Parité : 70 % (inchangée).

## Vérifications
- Local : `npm run test` 4 110 verts ; avec les 51 correctifs iPhone 4 477 verts ; build et ESLint propres ; capture
  `/bienvenue --onboarding=auto` relue.
- PR #1126 (65ea4bf2), à 16:18 UTC : Vitest, tests avec correctifs iOS, Build APK, émulateurs (A56 API 35 et 36,
  API 28, 32, 34), relais, montre : verts. **Build iOS (simulateur) et captures : en cours** à la fin du run.

## Suite proposée
1. **Run suivant : finir #1126** : build iPhone verte, captures de l'accueil (temps 2 et 3) regardées, branche à jour,
   merge en squash.
2. POLISH-SIM-108 (petits défauts) ou POLISH-SIM-107 (réponse du propriétaire attendue sur les courbes).
