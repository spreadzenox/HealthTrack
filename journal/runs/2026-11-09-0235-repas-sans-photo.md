# Run 09/11 02:35 — Repas : secours quand l'appareil photo ne s'ouvre pas

**Type** : code (mode polish).
**Étape** : POLISH-SIM-17.

## Contexte
- Aucune PR « [Auto] » ouverte ; main = #851, Build & Release, Tests, Play — AAB, émulateur A56 et Relais — déploiement
  verts (le redéploiement du relais de POLISH-SIM-19 a réussi).
- Gel Alpha jusqu'au 09/11 22:00 : `review-freeze.json` non touché, aucun envoi lancé.

## Constat
Le bouton « Repas » est le libellé d'un champ photo (`capture="environment"`). Quand l'appareil photo se ferme sans
photo (annulé, refusé, absent), rien ne se passait : 2 personas sur 2 sont restées bloquées.

## Fait
- `MealPhotoButton` : écoute l'événement `cancel` du champ (Chromium 113+, WebView Android à jour) et traite aussi un
  `change` sans fichier ; affiche alors un bandeau fixe au-dessus des onglets, « Aucune photo prise. » + lien
  « Décrire le repas » (`/food`) + « Fermer », 8 s. Vaut pour les trois usages (bandeau d'ajout, Repas du jour, tuiles).
- Surface neutre bordée (la première version pêche se fondait dans la carte digestive en sombre).
- `visual-check.mjs` : option `--meal-photo-cancel`.
- Nouveautés : `2026-11-09-0235-repas-sans-photo.json` (toutes variantes).

## Vérifs
- Test d'abord (rouge sans le correctif, vert avec) ; `npm run test`, `npm run lint` (0 erreur), `npm run build`.
- Captures `runs/captures/2026-11-09-0235-repas-sans-photo-{clair,sombre}.png` relues (cible Fermer passée à 44 px
  après l'avertissement du contrôle visuel).

## Suite
- À vérifier sur l'A56 : appareil photo refusé (permission) → le bandeau doit aussi apparaître.
- POLISH-SIM-7 (rejouer « maigrir » et « stressé » avec leur objectif) au prochain run « idées ».
