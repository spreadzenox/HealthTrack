# 2026-10-24 13:30 Paris (11:30 UTC) — M6a : fichiers de la montre relus en arrière-plan

**Type** : ⌚ chantier montre (M6, 1re partie)

## Constat au démarrage
- Main à `0f6116c` (#318) : Tests, Build & Release (v249), Play — AAB et émulateur verts.
- Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée), aucun Build & Release en cours.
- Ordre décidé : après M4 → **M6** (relecture en arrière-plan + rattrapage). Trop gros pour un run : découpé en
  M6a (fichiers 0x2C : sommeil détaillé + stress) et M6b (P2P : VFC de journée, température).

## Ce qui a été fait
- `WatchReader.java` : `FileRequest` / `FileData`, `downloadFile` (ouverture, infos, blocs poussés 0x2C/0x05, fin
  toujours envoyée), lectures `sleepFile` / `stress` consignées ; capture : `files` (octets bruts en hex), `bedTime`.
- `BackgroundSync.java` : `sleepFileUntil`, `stressFileUntil`, `bedTime` dans l'état ; `fileRequests` (seulement les
  fichiers déjà lus une fois par l'app, depuis la veille de la dernière lecture) ; `recordFiles` (reprise si ok / vide).
- `BackgroundWatchSync.java` (préférences), `WatchCapturePlugin.shareResume` (champs facultatifs).
- JS : `dataFromCapture` décode `files` (`parseSleepSequence`, `parseStressFile`) ; `readWatchData` rend
  `sleepBedTime` ; `writeWatchData` le garde ; `shareResumeWithNative` recopie les reprises des fichiers.
- Spécification : `protocoles/huawei.md` §10.15. Nouveautés : `2026-10-24-1330-montre-arriere-plan.json`.

## Vérifications
- `npm run test:java` : 124 tests JUnit verts (+5, `WatchFilesTest`).
- Vitest ciblé (huawei + services montre) : 271 verts ; suite complète, build, lint et visual : voir ci-dessous.

## Suite
- M6b : P2P (classes 500044, 400012) dans le lecteur Java ; issue des lectures des captures dans l'écran Montre.
- Puis M7 (courbe FC et allure des séances), M4 bis (étages).
- À tester par le propriétaire : nuit détaillée présente le matin sans synchro manuelle (voir résumé).
