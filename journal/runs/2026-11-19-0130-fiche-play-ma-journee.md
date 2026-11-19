# Run du 19/11 01:30 — captures de la fiche Play refaites pour la refonte (reste de REFONTE-2)

**Type** : 🛠️ code (fiche du Store) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main 81c0bf5.

## État de départ
- main vert (#1110 mergée à 00:18 UTC : Build & Release v795, Tests, Play — AAB verts ; émulateur relancé, en cours).
- Aucune PR « [Auto] » ouverte. Alpha de 23:45 pas encore partie à 01:30 (cron en retard, habituel). La dernière
  Alpha planifiée (18/11 03:53 UTC) avait échoué pendant le blocage de facturation GitHub (déjà noté le 18/11).

## Ce qui a été fait
- `app/scripts/store/screenshots.mjs` : les captures de la fiche Play suivent la barre de la refonte :
  01-accueil (Pilou et l'île), **02-ma-journee** (nouvelle), 03-objectifs, 04-tendances, 05-agir, 06-repas,
  07-reintroduction (7 sur 8 permises). Les noms « aujourdhui » et « analyses » (onglets disparus) sont retirés.
- Horloge fixée à 14:00 (`--now=14:00`) : générées la nuit, les captures montraient « Pilou dort » sur fond nocturne.
- Tests d'abord (rouges, puis verts) : `build-store-assets.test.mjs` (ordre Accueil, Ma journée, Objectifs, Tendances ;
  noms périmés refusés ; horloge de jour).
- Images régénérées (`node scripts/store/build-store-assets.mjs`, données de démo synthétiques, variante play, Gold
  factice) et relues une à une : île de jour avec les bulles Repas et Bien-être, Ma journée (repas, bien-être,
  habitudes), Objectifs, Tendances semaine, Agir (essai au jour 8), Repas, Réintroduction.
- Envoi : le workflow « Play — fiche du Store » part seul au merge (`app/store/**`). Pas de note de Nouveautés : rien ne
  change dans l'app.

## Vérifications
- `npm run test` : **4 083 tests verts** (367 fichiers) ; `npm run build` vert ; ESLint propre sur `scripts/store/`.

## État
- TestFlight : 893 (1170.1170) envoyée le 18/11 vers 23:38 UTC ; 1148.1148 chez « Testeurs Halcya ». Soumission bêta et
  expiration au premier run après l'Alpha où la 1170 est traitée.
- Parité : 70 % (aucun code partagé de l'app touché). Testeurs Play : 4 inscrits sur 12 (pas de nouveau relevé).

## Suite proposée
1. Merger cette PR quand ses checks sont verts, puis vérifier « Play — fiche du Store » sur main.
2. Après l'Alpha : 1170 aux « Testeurs Halcya », soumission bêta, puis expiration.
3. Reste de REFONTE-2 : `/ma-journee` absente du balayage natif ; captures App Store (6,9 pouces) à refaire de même.
