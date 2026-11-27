# Run 27/11 03:30 — Tendances : un jour avec 1 ou 2 lectures du visage (POLISH-VISAGE-1)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 5d0a349 (#1301) vert
(Tests, Build & Release, Play — AAB, émulateur A56) · **TestFlight** : 1335.1335 chez « Testeurs Halcya » ; build
iPhone du soir (cron de 21:20 Paris), TestFlight et Alpha de 23:45 toujours pas partis à 03:30 (dernières exécutions
programmées le 26/11 entre 02:52 et 04:25 UTC ; retard habituel de GitHub) · **Parité** : 70 % (33/47), inchangée

## État de départ
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée). Pas de nouvelle réponse du propriétaire.
- Les restes du polish attendent tous une réponse (PROP-SIM-19, PROP-SIM-20, « go courbes », rituel du soir).
- Run de code (03:30) : revue de main par `npm run visual -- --now=10:30` (toutes les pages, de jour cette fois).

## Fait
- **POLISH-VISAGE-1** : avec 2 lectures du visage ce matin (3,1 puis 2,7), l'Accueil dit « 3,1/5 D'après 2 lectures
  du visage » et Tendances › Jour « 2,7/5 d'après le visage ». Cause : sous `FACE_MOOD_MIN_READINGS` (3) lectures,
  le modèle à espace d'états n'observe pas le jour (`faceMoodDays`) ; son chiffre vient des jours voisins, mais
  `detailSource` (`services/trendsData.js`) écrivait « d'après le visage » dès une lecture, et « estimé avec le
  visage » à côté d'une note. Maintenant : « estimé avec les jours voisins (il faut 3 lectures) », et « vous avez noté
  3 · estimé avec les jours voisins » sous 3 lectures. L'Accueil (médiane pondérée des lectures du jour) ne change pas.
- Tests d'abord (`trendsData.test.js`) : rouges, puis verts ; 3 attentes anciennes supposaient le visage compté à 1
  ou 2 lectures, corrigées à 3 lectures et plus.
- Note de Nouveautés `2026-11-27-0330-tendances-deux-lectures.json` (deux magasins). BACKLOG, PRODUIT.md § 5, PARITE.md.

## Vérifications
- `npm run test` complet (4 727 tests verts), `npm run build`, ESLint des fichiers touchés : sans erreur.
- Captures `npm run visual -- --routes=/bien-etre --now=10:30`, clair et sombre, relues :
  [`captures/2026-11-27-0330-tendances-jour-2-lectures-sombre.png`](captures/2026-11-27-0330-tendances-jour-2-lectures-sombre.png).
- Autres pages relues sans défaut nouveau : Accueil, Ma journée, Nutrition, Réintroduction, Confort digestif.
- iPhone : code partagé, aucun correctif ; un build iPhone de PR (PR ouverte en brouillon, passée « prête »).

## Suite proposée
1. Finir la PR si le run s'arrête avant le merge (build iPhone, capture de Tendances côté iPhone si le build la prend).
2. Build iPhone du soir, TestFlight et Alpha du 26/11 : vérifier qu'ils sont partis ; soumission bêta de la build du
   soir au premier run qui la voit traitée par Apple, puis expiration des anciennes (sauf 1244.1244 de la version 893).
3. À juger : un même chiffre sur l'Accueil et dans Tendances le jour où il n'y a qu'une ou deux lectures.

## Pour le propriétaire
Rien de nouveau à faire. Toujours : recruter des testeurs (4 sur 12), PI2, P51 ; le 29 ou le 30/11, le message E.
Réponses attendues : PROP-SIM-20, PROP-SIM-19, « go courbes », rituel du soir.
