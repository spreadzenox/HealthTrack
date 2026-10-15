# 2026-10-15 10:30 Paris (08:30 UTC) — Montre : lectures en Java, captures importées à l'ouverture (D3 d quater ③ d)

**Type** : ⌚ D3 (priorité absolue)  ·  **PR** : « [Auto] Montre : lectures santé en Java, captures importées à l'ouverture »

## Pourquoi
- Démarrage : main à `a5381cb` (#165, run idées 08:30). Aucune PR « [Auto] » ouverte ou rouge ; seule `cursor/*` #51,
  hors routine, non touchée. Aucun nouveau journal du propriétaire dans `journal/diagnostics/` (dernier : v124).
- 10:30 Paris = run normal → priorité absolue D3. Étape suivante de la synchro app fermée (§9.1) : (③ d) le client
  Java doit savoir **lire les mesures**, sans dupliquer le décodage santé du JS.

## Ce qui a été fait
- **`huawei/WatchReader.java`** (pur Java) : sur la session authentifiée, sommeil (7/0x0C puis 0x0D), minutes
  (7/0x0A puis 0x0B), totaux (7/0x03), mêmes demandes, même ordre et même tolérance que `readWatchData` (bloc refusé
  sauté, bloc muet = fin du service, une lecture qui cale n'arrête pas la suivante ; ne lève jamais). Rien n'est
  décodé : chaque réponse est gardée comme ses TLV déchiffrés → **capture JSON v1** (format en §9.1).
- **`huawei/CaptureInbox.java`** (pur Java) : boîte de dépôt `files/watch-captures`, écriture atomique, 48 captures
  au plus, ne touche jamais un fichier qui n'a pas le nom d'une capture (noms formatés en `Locale.ROOT`).
- **`WatchCapturePlugin.java`** (plugin « WatchCapture » : `list`, `remove`), enregistré dans `MainActivity`.
- **JS** : `devices/huawei/capture.js` (`isValidCapture`, `dataFromCapture` : mêmes analyseurs et filtres de période
  que la synchro en direct) ; `watchSync.js` découpé : `writeWatchData` (chemin d'écriture commun) +
  `importWatchCapture` (une capture plus ancienne que la dernière synchro ne recule pas la reprise et n'écrit pas son
  total du jour) ; `services/watchCaptures.js` (`importPendingCaptures` : capture illisible retirée, écriture ratée
  gardée) ; appelé au début de `syncWatchIfStale`, sous le verrou montre, avant toute connexion.
- **Vecteurs** : `handshakeVector` refactoré en `reconnectTranscript` (vecteur `handshake` inchangé à l'octet) +
  nouveau vecteur `read` (reconnexion puis lectures face à la fausse GT 6 Pro type 4 / GCM / IV aléatoire) ; données
  d'exemple partagées dans `testing/sampleBlocks.js`.
- Spec `protocoles/huawei.md` §9 (tableau : ③ d ✅, ③ e détaillé) et §9.1 (lectures, format, dépôt, import).

## Vérifications
- Java : **26 tests JUnit ✅** (+5 : lecture identique au pilote JS — trames **et** capture —, bloc refusé / muet,
  demandes conformes, échappement du nom, boîte des captures). `WatchCapturePlugin` compilé seulement par « Build APK ».
- Vitest : **1239 ✅** (98 fichiers, +11) dont « la capture du Java donne exactement les mesures de la synchro en
  direct » (minutes, sommeil, totaux, entrées écrites). Build ✅. Lint : **6 erreurs** (baseline inchangée).
- `npm run visual` (démo, 8 pages) : aucune erreur JS ; `dashboard-1` relue, inchangée. Rien de visible → pas
  d'entrée « Nouveautés ».

## Sécurité / vie privée
- Les captures contiennent des mesures de santé déchiffrées : stockage **privé** de l'app (non lisible par d'autres
  apps), retirées dès l'import. Rien ne sort du téléphone. Aucune clé dans la capture.

## Apprentissages / décisions
- Garder le Java « bête » (réponses brutes) évite deux décodeurs santé à maintenir en parallèle ; le prix est un
  import à l'ouverture, ce qui suffit puisque l'utilisateur ne voit ses données qu'app ouverte.
- Heure (1/5), séances et fichiers 0x2C restent à la synchro en direct : en arrière-plan, le strict minimum.

## Suite proposée
1. ⌚ Lire le journal v125+ dès qu'il arrive.
2. ⌚ D3 (③ e) avec I75 : orchestrer dans `WatchPresenceService` (présence) + déverrouillage + filet ~2 h :
   `RfcommTransport` → `WatchHandshake.authenticate` (clé du coffre) → `WatchReader.read` → `CaptureInbox.put` ;
   fenêtre recopiée par le JS vers le natif après chaque synchro ; 30 min mini ; `key_rejected` → notification.
3. ⌚ I76 (stress, VFC de journée) une fois la synchro de base confirmée ; I77.
4. ⚡ D2 suite (`WellbeingCharts` par agrégats), 🧹 D1 avec I65, 🔁 D5 avec I70 + I78.
