# 2026-10-13 06:30 Paris (04:30 UTC) — Priorité montre : resynchro automatique (D3 d ter)

**Type** : ⌚🏗️ (priorité absolue, étape d ter)  ·  **PR** : #131 (fusionnée → **v113**, APK publié ; Vitest, Build APK et émulateur A56 Android 15 / 16 verts sur la PR)

## Pourquoi
- Démarrage : main vert (008c913, v112 ; Tests, émulateur A56 et Build & Release verts), aucune PR « [Auto] » ouverte
  (seule #51 cursor/*, non touchée).
- `journal/diagnostics/` : **toujours aucun journal du propriétaire** → étape suivante de la liste : la montre doit
  remonter ses données **sans geste**. Aujourd'hui il faut toucher « Synchroniser la montre ».

## Ce qui a été fait
- `services/watchAutoSync.js` (nouveau) :
  - `connectBondedWatch` : la connexion à la montre appairée (déplacée de `WatchDiagnostic.jsx`, inchangée sur le fond)
    passe désormais par un **verrou** (`withWatchLock`) : une seule connexion RFCOMM à la fois, la manuelle attend
    l'automatique ; chaque issue est retenue (`healthtrack_watch_autosync`).
  - `syncWatchIfStale` : ne tente rien hors app Android, sans montre Huawei appairée à Android ou **sans clé HealthTrack**
    pour elle (donc jamais avant un premier appairage manuel, jamais de constantes ni de réappairage en automatique) ;
    au plus toutes les 30 min (en comptant aussi la dernière synchro manuelle) ; après un échec, 1 h, 2 h puis 4 h au
    plus ; **pause** sur `key_rejected`, `pin_failed`, `need_secrets`, `unsupported` jusqu'à une connexion manuelle
    réussie ; appels simultanés fusionnés ; ne lève jamais (Bluetooth coupé → nouvel essai plus tard).
  - `describeAutoSync` : phrase d'état (dernière synchro et ce qu'elle a ramené / échec et prochain essai / pause),
    rien tant que la montre n'a jamais été connectée.
- `useAutoSync` (Layout, Analyses) : `syncWatchIfStale()` au montage **et au retour dans l'app** (`visibilitychange`).
- `WatchConnect.jsx` : ligne d'état sous l'intro, rafraîchie par l'événement `watch-sync-updated` ; intro complétée.
- `npm run visual -- --routes=/connectors --ble=watch --connect=done` montre aussi la ligne d'état.

## Vérifications
- Tests : **1073 ✅** (80 fichiers ; +12 : watchAutoSync 11 dont 1 de bout en bout avec la fausse montre — premier
  appairage manuel avec constantes, puis connexion automatique 1 h plus tard **sans** constantes —, WatchConnect 1).
  Un test a trouvé un vrai bug avant commit : l'heure retenue ignorait l'horloge injectée (corrigé).
- Lint : 6 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : `npm run visual` (8 pages) OK sans erreur JS, `--empty` OK, Connecteurs `--ble=watch --connect=done` regardé
  (ligne « Synchro automatique à chaque ouverture de l'app (au plus toutes les 30 min). Dernière : il y a moins d'une
  heure, 38 minutes → 9 mesures. ») : lisible, rien ne déborde.
- Non vérifiable ici : la vraie montre ; coût batterie d'une connexion RFCOMM toutes les 30 min d'usage (à mesurer
  sur le téléphone, mais une connexion ne dure que quelques secondes).

## Apprentissages / décisions
- Synchro **à l'ouverture et au retour** plutôt qu'en tâche de fond : sans code natif nouveau, couvre l'usage réel
  (le téléphone est déverrouillé de nombreuses fois par jour). L'arrière-plan app fermée devient (d quater) : la pile
  HiChain + protocole est en JS, il faudra soit réveiller la WebView, soit porter le strict nécessaire en Java.
- Pas de nouvelle donnée stockée hors `localStorage` d'état ; aucun changement de schéma, export / import inchangés.

## Suite proposée
- (d bis) 1/0x03 (commandes prises en charge), fichiers 0x2C : phases du sommeil, RR → VFC / stress ; séances.
- (d quater) arrière-plan app fermée (étude WorkManager / background runner).
- Dès qu'un journal arrive : corriger (c) / (d) en priorité.
