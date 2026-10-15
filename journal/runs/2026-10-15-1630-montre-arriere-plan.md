# 2026-10-15 16:30 Paris (14:30 UTC) — Montre : relue aussi app en arrière-plan (D3 d quater ③ g)

**Type** : ⌚ D3 (priorité absolue)  ·  **PR** : « [Auto] Montre : relue aussi app en arrière-plan »

## Pourquoi
- Démarrage : main à `d5674aa` (#168 fusionnée, v135 publiée ; « Build & Release », « Tests » et émulateur A56
  verts). Aucune PR « [Auto] » ouverte ; seule `cursor/*` #51, hors routine, non touchée. Aucun nouveau journal du
  propriétaire dans `journal/diagnostics/` (dernier : v124), aucune issue.
- 16:30 Paris = run normal → D3. Trou identifié au run précédent (③ g) : app **en arrière-plan mais pas tuée**
  (téléphone en poche, cas le plus fréquent) → décision « app » côté natif, alors que la page peut être gelée par
  Android → rien relu avant le retour à l'écran. Le guide One UI (I50) attend, lui, un journal montrant 24 h sans rien.

## Ce qui a été fait
- **`huawei/LinkLock`** (pur Java, testé) : liaison unique à la montre, titulaire « app » ou « native » ; on ne rend
  jamais celle de l'autre.
- **`BtClassicPlugin.connect`** prend la liaison (sinon rejet code `busy`) ; la rend à `disconnect`, à l'échec de
  connexion, à la destruction et à la coupure par la montre (fil de lecture, seulement s'il lit le socket courant).
- **`BackgroundWatchSync`** : l'`AtomicBoolean` busy devient la liaison partagée (« busy » si la page la tient).
- **`CompanionPlugin.isAppInForeground()`** (plugin chargé + activité entre `onStart` et `onStop`) remplace
  `isAppAlive()` dans le service compagnon, le récepteur de déverrouillage et le job ~2 h : app pas à l'écran → natif.
- JS : issue `busy` dans `connectAndAuthenticate` (« Montre occupée : relecture en arrière-plan… »), non consignée
  par `connectBondedWatch` (ni échec compté, ni délai doublé) ; `listenWatchPresence` ne relit plus page cachée
  (le natif s'en charge, la capture est rangée au `visibilitychange`). Ligne de carte : « relue en arrière-plan il y a … ».
- Spec `protocoles/huawei.md` §9 (ligne ③ g) et §9.1.

## Vérifications
- Java : **38 tests JUnit ✅** (+2 `LinkLockTest`), via `javac` + JUnit 4 de Gradle (pas de SDK Android ici : le
  code Android — plugins, service, job — n'est compilé que par « Build APK », relu à la main).
- Vitest : **1256 ✅** (+3 : `busy` côté pairing, non consigné, présence page cachée). Build ✅. Lint : **6 erreurs** (inchangé).
- `npm run visual -- --routes=/connectors --ble=watch --connect=done --companion=on` : `connectors-1` relue, seule la
  ligne change (« relue en arrière-plan il y a moins d'une heure »). `npm run visual` complet : 8 pages ok, aucune erreur JS.

## Sécurité / vie privée
- Rien ne sort du téléphone ; aucune donnée nouvelle gardée (le verrou est en mémoire).

## Apprentissages / décisions
- « App vivante » ≠ « app qui peut synchroniser » : une WebView en arrière-plan peut être gelée (freezer des apps en
  cache, Android 14+). Le bon critère est l'écran, comme `visibilitychange` côté page.
- Verrou au niveau du plugin RFCOMM plutôt qu'un aller-retour JS → natif : il couvre aussi les connexions manuelles
  et le diagnostic, sans course entre deux processus de décision.
- Limite connue : une page gelée qui garde sa connexion ouverte bloque le natif jusqu'à la coupure par la montre.

## Suite proposée
1. ⌚ Lire le journal v136+ dès qu'il arrive (bloc `background` : déclencheurs, décisions « busy » éventuelles).
2. ⌚ Guide One UI (I50) si la synchro de fond ne ramène rien en 24 h ; ③ h si la présence se perd au redémarrage.
3. ⌚ I76 (stress, VFC de journée), séances automatiques (#5784) ; I77.
4. ⚡ D2 suite (`WellbeingCharts` par agrégats), 🧹 D1 avec I65, 🔁 D5 avec I70 + I78.
