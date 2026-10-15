# 2026-10-15 14:30 Paris (12:30 UTC) — Montre : relue au déverrouillage et toutes les ~2 h (D3 d quater ③ f)

**Type** : ⌚ D3 (priorité absolue)  ·  **PR** : « [Auto] Montre : relue au déverrouillage et toutes les ~2 h »

## Pourquoi
- Démarrage : main à `80f19c0` (#167 fusionnée ; « Build & Release », « Tests » et émulateur A56 verts). Aucune PR
  « [Auto] » ouverte ; seule `cursor/*` #51, hors routine, non touchée. Aucun nouveau journal du propriétaire dans
  `journal/diagnostics/` (dernier : v124), aucune issue.
- 14:30 Paris = run normal → D3. Dernière pièce prévue de la synchro app fermée : ③ f / I75 (le run « idées » de
  08:30 a montré que la présence compagnon ne suffit pas : le lien Bluetooth peut rester ouvert sans nouvelle
  « apparition », Gadgetbridge relit au déverrouillage).

## Ce qui a été fait
- **`BackgroundSync.decide(trigger, …, presence)`** (pur Java) + `presenceOf` : au déverrouillage et au filet, une
  montre que le service compagnon sait partie → « absent » (pas de connexion de 15 s, pas d'échec compté, donc pas de
  recul du délai) ; la reconnexion signalée ignore l'état ; présence inconnue → on essaie.
- **Déverrouillage** : récepteur `ACTION_USER_PRESENT` dynamique dans `WatchPresenceService` (`onCreate` /
  `onDestroy`), car ce broadcast n'est pas livré au manifeste.
- **Filet** : `WatchSyncJob` (JobScheduler du système, 2 h ± 30 min, persistant, batterie pas faible) — choisi plutôt
  que WorkManager pour n'ajouter **aucune dépendance** ; programmé à chaque reprise recopiée par le JS et à chaque
  apparition. `jobFinished` appelé à la fin de la relecture (`onDone` de `maybeStart`).
- **Notification « clé refusée »** (`WatchNotifications`, canal `watch_sync`, ouvre l'app) ; permission
  POST_NOTIFICATIONS déclarée et demandée après « Activer » (`WatchCapture.requestNotifications`,
  `requestWatchNotifications`). Silencieuse si refusée (la carte dit déjà « Synchro en pause »).
- **Diagnostic** : `WatchCapture.background` rend `lastTrigger` et `periodic` ; le journal exporté gagne un bloc
  `background` (`backgroundForJournal` : décision, déclencheur, issue, horodatages ISO ; jamais d'adresse ni de clé).
- Ligne de la carte : « Synchro auto même app fermée (reconnexion, déverrouillage, ~2 h) ».
- Spec `protocoles/huawei.md` §9 (③ f ✅) et §9.1.

## Vérifications
- Java : **36 tests JUnit ✅** (+2 : déclencheurs, présence). Le code Android (service, job, notification, plugin)
  n'est compilé que par « Build APK » (pas de SDK Android ici) — relu à la main (API ≥ 26 ou gardées).
- Vitest : **1253 ✅** (99 fichiers, +5 tests, nouveau `journal.test.js`). Build ✅. Lint : **6 erreurs** (inchangé).
- `npm run visual` (démo, toutes les pages) : aucune erreur JS. `--routes=/connectors --ble=watch --connect=done
  --companion=on` : `connectors-1` relue, nouvelle ligne sur 3 lignes sous « Synchroniser la montre », rien d'autre ne bouge.

## Sécurité / vie privée
- Rien ne sort du téléphone. La notification ne contient que le nom de la montre. Le journal n'exporte ni adresse ni clé.

## Apprentissages / décisions
- JobScheduler suffit (période ≥ 15 min, persistance au redémarrage) : WorkManager aurait ajouté une bibliothèque
  pour rien.
- « absent » plutôt qu'un essai qui échoue : sinon le filet, montre au loin, doublerait le délai jusqu'à 4 h et
  retarderait aussi la relecture à la vraie reconnexion.
- Limite connue : app en arrière-plan **non tuée** → « app » (le JS relit au retour au premier plan) → ③ g au backlog.

## Suite proposée
1. ⌚ Lire le journal v125+ dès qu'il arrive (le bloc `background` dira quels déclencheurs ont tourné).
2. ⌚ Guide One UI (I50) si la synchro de fond ne ramène rien en 24 h ; ③ g (relecture native app en arrière-plan).
3. ⌚ I76 (stress, VFC de journée) une fois la synchro de base confirmée ; I77.
4. ⚡ D2 suite (`WellbeingCharts` par agrégats), 🧹 D1 avec I65, 🔁 D5 avec I70 + I78.
