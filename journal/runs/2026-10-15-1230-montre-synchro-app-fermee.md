# 2026-10-15 12:30 Paris (10:30 UTC) — Montre : relue app fermée quand elle se reconnecte (D3 d quater ③ e)

**Type** : ⌚ D3 (priorité absolue)  ·  **PR** : « [Auto] Montre : relue app fermée quand elle se reconnecte »

## Pourquoi
- Démarrage : main à `4cd6314` (#166 fusionnée, v133 publiée avec son APK, « Build & Release » vert). Aucune PR
  « [Auto] » ouverte ; seule `cursor/*` #51, hors routine, non touchée. Aucun nouveau journal du propriétaire dans
  `journal/diagnostics/` (dernier : v124).
- 12:30 Paris = run normal → priorité absolue D3. Dernière pièce de la synchro app fermée (§9.1) : (③ e) **lancer le
  client Java tout seul**. Les morceaux étaient prêts (RFCOMM, coffre, authentification, lectures, dépôt) ; manquaient
  la décision, la fenêtre de lecture côté natif, l'orchestration et l'entente avec le JS.

## Ce qui a été fait
- **`huawei/BackgroundSync.java`** (pur Java) : `decide` (app vivante / en cours / pause / sans clé / récent / à
  faire), `interval` (30 min × 2^échecs, 4 h au plus, comme `autoSyncInterval`), `window` (= `syncWindow` du JS),
  `shareFromApp` (reprise du JS, jamais de recul, efface échecs et pause), `run` (ouvre, authentifie, batterie, lit,
  dépose la capture ; ne lève jamais ; connexion toujours fermée), `record` (reprise avancée seulement si la montre a
  rendu des blocs ; `key_rejected` → pause).
- **`BackgroundWatchSync.java`** : état dans les préférences `healthtrack_watch_background` (jamais de clé), permission
  BLUETOOTH_CONNECT vérifiée, un seul fil `huawei-background-sync`, clé refusée → retirée du coffre
  (`WatchVaultPlugin.forget`), dernière décision gardée pour le diagnostic.
- **`WatchPresenceService`** : à « montre apparue » (API 33–35 et 36), si aucune page de l'app ne tourne
  (`CompanionPlugin.recordPresence` rend maintenant ce booléen), lance `BackgroundWatchSync.maybeStart` ; adresse
  retrouvée par l'identifiant d'association sous Android 16.
- **`WatchCapturePlugin`** : `background` (état, jamais de clé) et `shareResume` (reprise du JS).
- **JS** : `watchCaptures.js` (`getBackgroundSync`, `shareResumeWithNative`) ; `connectBondedWatch` recopie la reprise
  après chaque connexion réussie ; `syncWatchIfStale` : relecture native en cours → `busy`, clé refusée en arrière-plan
  (plus récente que la dernière connexion de l'app) → automatique en pause, relecture native réussie comptée dans les
  30 min ; `watchPresence.js` : « relue app fermée il y a … » sur la ligne de présence.
- Vecteurs communs : nouveau bloc `windows` (6 fenêtres `syncWindow`) ; capture visuelle `--companion=on` avec un faux
  état natif. Spec `protocoles/huawei.md` §9 (③ e ✅, ③ f ajouté) et §9.1.

## Vérifications
- Java : **34 tests JUnit ✅** (+8 : fenêtre identique au JS, décisions, reprise partagée, relecture complète rejouée
  sur la transcription du pilote JS, injoignable, sans clé, clé refusée, reprise conditionnelle). Le code Android
  (`BackgroundWatchSync`, service, plugin) n'est compilé que par « Build APK » (pas de SDK Android ici).
- Vitest : **1248 ✅** (98 fichiers, +9). Build ✅. Lint : **6 erreurs** (baseline inchangée).
- `npm run visual` (démo, toutes les pages) : aucune erreur JS. `--routes=/connectors --ble=watch --connect=done
  --companion=on` : `connectors-1` relue, ligne « … reconnectée il y a moins d'une heure · relue app fermée il y a
  moins d'une heure » sous « Synchroniser la montre », rien d'autre ne bouge.

## Sécurité / vie privée
- Rien ne sort du téléphone. La clé ne quitte le coffre que dans le fil de relecture ; l'état natif et ce que lit le JS
  ne contiennent ni clé ni mesure. Jamais de PIN ni de réappairage en arrière-plan.

## Apprentissages / décisions
- « App vivante » = une page Capacitor chargée (`CompanionPlugin.active`) : dans ce cas le JS garde la main (pas de
  double connexion) ; le natif ne prend le relais qu'app tuée, comme le prévoyait §9.1.
- Les deux côtés partagent un seul compteur de 30 min (le JS recopie son heure, lit celle du natif) : pas de
  reconnexion en rafale (PR GB 6367), même quand l'utilisateur rouvre l'app juste après une relecture de fond.
- Pas de service de premier plan pour l'instant : le service compagnon est lié par Android tant que la montre est
  connectée, ce qui garde le process. À revoir si le journal de l'A56 montre des relectures coupées.

## Suite proposée
1. ⌚ Lire le journal v125+ dès qu'il arrive ; test demandé au propriétaire : app fermée, montre reconnectée → la ligne
   « relue app fermée » doit apparaître.
2. ⌚ D3 (③ f, I75) : déverrouillage + filet ~2 h (WorkManager) via `BackgroundWatchSync.maybeStart` ; notification
   « clé refusée » ; dernière décision native dans le journal de diagnostic.
3. ⌚ I76 (stress, VFC de journée) une fois la synchro de base confirmée ; I77 ; guide One UI (I50).
4. ⚡ D2 suite (`WellbeingCharts` par agrégats), 🧹 D1 avec I65, 🔁 D5 avec I70 + I78.
