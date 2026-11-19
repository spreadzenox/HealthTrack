# Run du 19/11 15:30 — Balance à l'accueil (POLISH-SIM-115)

**Type** : 🛠️ code (polish de la refonte, objectif du 22/11) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main b72fef6.

## État de départ
- main vert (#1124 : Tests, Build & Release, Play — AAB, émulateur Galaxy A56 verts).
- Aucune PR « [Auto] » ouverte (seule #51, brouillon de mai, hors routine).
- iPhone : `upstream.json` à `HEAD`, rien à avancer ; rien chez Apple avant l'envoi du soir.

## Ce qui a été fait
- **POLISH-SIM-115** (temps 2 de l'accueil, `WatchStep` d'`Onboarding.jsx`) :
  - titre « Avez-vous une montre, un bracelet ou une balance ? », sous-titre « On les branche une seule fois. » ;
  - à « Oui », sous les cartes de sources : « Une balance connectée ? Votre poids arrive aussi par Health Connect,
    à voir dans Tendances. » (le nom de la source vient de `healthStoreName()` : « Santé » sur iPhone). Le poids est
    déjà importé (`HealthConnectConnector`, type `weight`) et déjà une mesure de Tendances.
  - Rien à « Non » ; pas d'objectif « maigrir » (brief § 3.1) ; le temps 3 ne change pas.
- Tests écrits d'abord (`Onboarding.test.jsx`, `Onboarding.sources.test.jsx` : titre, sous-titre, phrase à « Oui »,
  absente à « Non » et sans choix), rouges puis verts.
- Note de Nouveautés `2026-11-19-1530-balance-accueil` (code partagé, Android et iPhone).

## iPhone
- Aucun correctif ne touche les lignes modifiées ; les 52 correctifs de `iphone/patches/` s'appliquent en série sur la
  branche (vérifié dans un worktree, `git apply --3way`, aucun conflit). Le test de l'overlay
  (`Onboarding.appstore.test.jsx`) ne cherche pas le titre. Parité : 70 % (inchangée).

## Vérifications
- `npm run test` : 4 106 verts ; `npm run build` vert ; ESLint propre sur les fichiers touchés.
- Capture relue (`--routes=/bienvenue --onboarding=watch-yes`) : titre sur deux lignes, phrase de la balance entre la
  carte Health Connect et « Une seule fois… », rien ne déborde.

## Suite proposée
1. Merger cette PR après ses checks (build iPhone compris).
2. POLISH-SIM-105i (iPhone avant iOS 26.4, temps d'écran dans « Activables »).
