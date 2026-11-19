# Run du 19/11 05:30 — Bien-être : des chiffres qui se répondent (UPG-6, POLISH-SIM-103)

**Type** : 🛠️ code (polish de la refonte, objectif du 22/11) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main 61fd3c8.

## État de départ
- main vert (#1114 : Tests, Build & Release, Play — AAB, émulateur verts).
- Alpha de la nuit partie (« Play — Alpha (livraison continue) » 03:51 UTC, succès, sur 9a6750d).
- Aucune PR « [Auto] » ouverte (seule #51, brouillon de mai, hors routine).

## Ce qui a été fait
- **UPG-6** : `Objectives.jsx`, sous les 7 barres : « Moyenne de vos 7 derniers jours » (au lieu de « Vos 7 derniers
  jours »), pour que 3,1 / 5 d'Objectifs ne se lise plus comme une contradiction du 3/5 du jour de l'Accueil.
- **UPG-6 et POLISH-SIM-103**, fiche d'un jour de Tendances : `dayFaceDetail` donne `noteText` = `formatNote(score)`,
  exactement ce qu'écrit « Vos saisies » ; `detailSource` le cite (« vous avez noté 2,6 · estimé avec le visage »). Avant,
  la note d'ancienne échelle était arrondie (« vous avez noté 3 ») sous « 2,6 / 5 » dans les saisies. Un choix de 1 à 5
  reste écrit « 3 » (POLISH-SIM-90 tient). `scoreToChoice` n'est plus importé par `trendsDay.js`.
- **POLISH-SIM-103 (2)** : « Ce qui a pu peser ce jour-là » devient « Ce qui a pu jouer ce jour-là » (titre et
  région), demandé par trois simulations (08/11, 16/11 ×2) : la liste montre aussi des effets positifs.
- Note de Nouveautés `2026-11-19-0530-bien-etre-memes-chiffres` (Android et iPhone).
- Tests d'abord : 3 rouges (Objectifs, `detailSource`, `dayFaceDetail`), puis 6 rouges pour le titre, puis verts.

## iPhone
- Code partagé. Correctifs 56 et 64 (`trendsData.js`, `trendsDay.js`) : `git apply --check` OK sur la branche.
- Parité : 70 % (inchangée). Build iPhone sur la PR (non brouillon, une seule build).

## Vérifications
- `npm run test` : **4 090 verts** ; `npm run build` vert ; ESLint propre sur les fichiers touchés.
- Captures relues : `--routes=/recommendations --onboarding=gut` (carte Bien-être 3,1 / 5, « Moyenne de vos 7 derniers
  jours ») ; `--routes=/tendances --legacy --click="Jour > Jour précédent"` (18/11 : 3,3 /5, « vous avez noté 3,4 ·
  estimé avec le visage », saisie « 3,4 / 5 », titre « Ce qui a pu jouer ce jour-là »).

## Suite proposée
1. Merger cette PR après ses checks (build iPhone compris).
2. Polish du 22/11 : POLISH-SIM-104 (« Pas de lien net » au-dessus de lignes chiffrées), POLISH-SIM-105, POLISH-SIM-100.
3. Expiration des anciennes builds TestFlight après validation de la 1173.1173.
