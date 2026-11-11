# Run 11/11 16:35 — CI « Tests » sans apt ; « Ce que vous noterez » suit l'objectif (POLISH-SIM-51)

**Type** : code (CI d'abord, puis mode polish).

## Contexte
- Main 56b519a (#917) : « Tests » rouge sur le job « Budget de lectures (perf) » pour la 2e fois de suite, même panne
  DNS du runner (`Temporary failure resolving 'azure.archive.ubuntu.com'` pendant `playwright install --with-deps`).
  L'envoi Alpha de 23:45 exige « Tests » vert : réparer passait avant tout.
- Aucune PR « [Auto] » ouverte, aucun workflow en cours sur main.

## Fait
- `.github/workflows/tests.yml` (perf-budget) : `playwright install chromium` sans `--with-deps` ; l'installation des
  bibliothèques par apt est tentée à part, bornée à 4 min (`timeout 240 sudo env PATH=… playwright install-deps`), et
  son échec n'est plus qu'un avertissement. Le budget échoue toujours si Chromium ne démarre pas.
- POLISH-SIM-51 (Maigrir J1) : `handNotes(goals)` dans `settings/onboarding.js` ; l'écran « Votre téléphone suffit pour
  commencer » liste bien-être, digestion (ventre, cycle, tout ou aucun objectif), règles (cycle), repas en photo, poids
  (« Prendre soin de moi »). Sans objectif ou « Tout mesurer » : inchangé. Rien de promis qui demande une source (pas de
  « pas » : sans Health Connect, le téléphone ne les donne pas à l'app).
- `visual-check.mjs` : `--onboarding=found-none-care`.
- Tests rouges puis verts (4 unitaires, 1 page).

## Vérifs
- `npm run test` (3443 verts), `npm run lint` (aucune erreur), `npm run build`, `npm run visual` complet ;
  `--play --onboarding=found-none-care` clair et sombre lus ([clair](captures/2026-11-11-1635-noter-objectif-clair.png) ·
  [sombre](captures/2026-11-11-1635-noter-objectif-sombre.png)).

## Suite
- Vérifier que « Budget de lectures (perf) » passe sur main après le merge (sinon « Tests » bloque l'Alpha du soir).
- POLISH-SIM-45 ; PROP-SIM-11 et 12 (maquettes) ; CYCLE-3 attend P48.
