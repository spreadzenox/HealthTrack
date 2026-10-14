# 2026-10-15 00:30 Paris (22:30 UTC) — Montre : synchro à la reconnexion (appareil compagnon, I72 ①②)

**Type** : ⌚ D3 (priorité absolue)  ·  **PR** : « [Auto] Montre : synchro dès qu'elle se reconnecte au téléphone »

## Pourquoi
- Démarrage : main à `c629896` (#161), **v129 publiée** avec son APK (Build & Release, Tests et émulateur A56 verts).
  Aucune PR « [Auto] » rouge ou en conflit (seule PR ouverte : `cursor/*` #51, non touchée). Aucune issue, aucun
  nouveau journal du propriétaire depuis v124 (`journal/diagnostics/` inchangé).
- Sans journal, rien de neuf à décoder. Étape suivante de D3 : (d quater), la resynchro sans ouvrir l'app. Le plan
  I72 (run idées 14/10 20:30) la découpe en ① association compagnon, ② présence, ③ client Java « synchro seule ».
  ① et ② sont livrables seuls, testables, et réutilisent tout le protocole JS existant.

## Ce qui a été fait
- **Natif** :
  - `CompanionPlugin.java` (« Companion ») : `status` (Android 13+, associations de l'app, dernière présence),
    `associate` (filtre `BluetoothDeviceFilter` sur l'adresse de la montre appairée, `setSingleDevice`, boîte
    Android lancée depuis `onAssociationPending`, puis `startObservingDevicePresence`), `disassociate`. Une
    association existante est réutilisée (pas de seconde boîte).
  - `WatchPresenceService extends CompanionDeviceService` : `onDeviceAppeared` / `onDeviceDisappeared`
    (API 33–35) et `onDevicePresenceEvent` (API 36, `EVENT_BT_CONNECTED` / `DISCONNECTED`). Il garde l'heure et le
    type d'événement en `SharedPreferences` (rien d'autre) et émet `watchPresence` vers le JS si l'app est vivante.
  - Manifeste : service lié par `BIND_COMPANION_DEVICE_SERVICE`, permission normale
    `REQUEST_OBSERVE_COMPANION_DEVICE_PRESENCE`, `uses-feature companion_device_setup` facultatif.
- **JS** : `services/watchPresence.js` (`getWatchPresence`, `enableWatchPresence`, `describePresence`,
  `listenWatchPresence`). Une montre reconnectée lance `syncWatchIfStale`, donc mêmes garde-fous qu'à l'ouverture :
  clé connue, 30 min au plus, pause après un refus, aucune reconnexion en rafale (PR GB 6367). L'écoute est démarrée
  une seule fois par `useAutoSync`.
- **UI** : `components/WatchPresence.jsx`, une ligne sous « Synchroniser la montre » (affichée seulement une fois la
  montre connectée et sur Android 13+) : « Synchro dès que la montre se reconnecte au téléphone… » + « Activer », puis
  « … · reconnectée il y a … ». Rien de plus dans la carte.
- `npm run visual -- --companion` / `--companion=on` (faux plugin).

## Vérifications
- Tests : **1219 ✅** (94 fichiers ; +19 : service 16, composant 3). Build ✅. Lint : **6 erreurs** (baseline inchangée).
- Pas de SDK Android dans la session : la compilation Java est vérifiée par le check « Build APK » de la PR.
- `npm run visual` (démo, 8 pages) : aucune erreur JS. `--routes=/connectors --ble=watch --connect=done --companion`
  puis `--companion=on` : captures relues, la ligne et le bouton « Activer » sont à leur place, sans autre changement
  de la carte.

## Apprentissages / décisions
- Capacitor ne met pas la WebView en pause en arrière-plan (`KeepRunning` vrai par défaut) : tant que le processus
  vit, un événement natif fait tourner la synchro JS (Bluetooth classique, Web Crypto, IndexedDB). Le lien du
  système au `CompanionDeviceService` garde justement le processus prioritaire pendant que la montre est connectée.
- App tuée (balayée des récentes, One UI agressif) : Android relance le processus pour le service, mais sans activité
  ni WebView. Seul l'horodatage est gardé, et la synchro se fait à l'ouverture. Ce cas-là demande ③ (client Java).
- Le service de découverte CDM d'AOSP inclut les appareils déjà liés qui passent le filtre. La montre n'a donc pas
  besoin d'être en mode visible. Reste à confirmer sur One UI.

## Suite proposée
1. ⌚ Lire le prochain journal (v129+) : mesures reçues ou non (`sync.services`) ; présence vue ou non.
2. ⌚ D3 (d quater ③) : client Java « synchro seule » écrit depuis la spec, lancé par `WatchPresenceService` quand le
   JS n'est pas là ; ajouter la présence au journal exporté.
3. ⚡ D2 : `WellbeingCharts` par agrégats ; 🧹 D1 avec I65 ; 🔁 D5 avec I70.
