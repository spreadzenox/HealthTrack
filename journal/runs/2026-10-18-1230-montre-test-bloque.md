# 2026-10-18 12:30 Paris (10:30 UTC) — Montre : test jamais bloqué, assistant cohérent

**Type** : 🔴 régression (consigne du propriétaire du 18/10, point A)  ·  **PR** : #207

## Pourquoi
- Démarrage : main à `7f9beac` (#206). Aucune PR « [Auto] » ouverte. Nouvelle consigne du propriétaire (18/10) :
  capture de l'écran montre à 11:06, « Ça ça ne marche pas ». Reportée dans la charte (§0000) et le BACKLOG ;
  « Prochaines étapes » réordonnées : régression montre → estimation automatique du bien-être → D1 → D2.

## Diagnostic (à partir du code et de la capture)
1. **Test bloqué** : seule « Bluetooth du téléphone » était cochée, donc `runHuaweiDiagnostic` attendait
   `detectApps()` (ou un appel natif suivant) sans fin. Aucun appel natif du test n'avait de délai
   (`detectPhoneApps` → `AppLauncher.canOpenUrl` × ~19 paquets, `getBondedDevices`, `requestLEScan`,
   `listBonded`, `connect`, `getServices`, `startNotifications`, `write`, `disconnect`).
2. **Carte incohérente** : `WatchSetup.refresh` lisait les apps et l'appairage dans un même `Promise.all` : la
   détection d'apps bloquée laissait `installed = null` (→ « Libérer » coché, aucune app vue) et `bonded = null`
   (→ « Appairer » proposé). Même cause que (1). De plus l'assistant ignorait qu'une synchro avait réussi.
3. **Conflit avec la synchro** (trouvé en lisant `BtClassicPlugin.connect`) : le plugin ferme la connexion ouverte
   avant d'en ouvrir une ; le test ne prenait pas le verrou `withWatchLock` → lancé pendant une synchro, il pouvait
   couper celle-ci. Et un refus du verrou natif (relecture en arrière-plan) était présenté comme « montre occupée
   par Huawei Health ».
4. **« 14 pas → 2 mesures »** : « 360 minutes » = les 6 h de recouvrement relues ; « 2 mesures » = mesures
   *nouvelles* (`inserted`), le reste étant déjà en base. Rien d'incomplet dans le code ; les 14 pas sont le total
   annoncé par la montre (7/0x03). Non vérifiable sans journal → contrôle ajouté.

## Ce qui a été fait
- `utils/withTimeout.js` (+ tests) : `withTimeout`, `TimeoutError`, `isTimeout`.
- `devices/huawei/diagnostic.js` : `STEP_TIMEOUTS` par appel natif, option `timeouts` ; étape « apps » en `skip`
  « délai dépassé » (non bloquante) ; échec d'étape sinon, `report.timedOut` ; connexion à moitié ouverte refermée ;
  verdicts `timeout` (« Le test a calé à l'étape … »), `busy` (verrou natif) et `in_use` (échec de connexion alors
  que HealthTrack a synchronisé : pas d'accusation d'une autre app) ; `context.connectedAt` ; « link_ok » ne propose
  plus « Se connecter » si la montre est déjà synchronisée.
- `devices/phoneApps.js` : `detectWithLauncher` (2 s par paquet, 6 s en tout → null = inconnu).
- `components/WatchDiagnostic.jsx` : test sous `withWatchLock`, message d'attente si une synchro tourne, filet
  `TEST_MAX_MS` = 150 s, message d'erreur qui dit quoi faire.
- `devices/huawei/setup.js` : `isWatchBonded` borné (5 s), `lastConnectedAt`, `setupPlan({ connectedAt })` → toutes
  les étapes faites si synchro réussie après la dernière réinitialisation et montre non désappairée.
  `WatchSetup.jsx` : apps et appairage lus séparément ; écoute `watch-sync-updated` ; « Rien à faire ici … ».
- `services/watchAutoSync.js` : `lastConnectedAt` gardé dans l'état (repris des anciens états).
- `services/watchSync.js` + `sync.js` : libellé « N nouvelles mesures » / « déjà à jour » ; `stepsCheck` et ligne
  « pas du jour : total de la montre X, minutes lues depuis minuit Y » dans le journal ; `report.sync.steps`.
- `scripts/visual/visual-check.mjs` : le scénario `--ble=watch-silent --setup` (cassé avant ce run : carte montre
  repliée sous « Brancher une autre source ») ouvre aussi ce volet et accepte « Relancer le test ».
- Nouveautés : `2026-10-18-1230-montre-test-bloque.json`.

## Retiré / simplifié (D1)
- Carte « Libérer et appairer » : sélecteur « HealthTrack seule / Garder Huawei Santé » masqué quand la montre
  synchronise déjà (inutile).

## Vérifications
- `npm run test` : **1 400 tests verts** (106 fichiers ; +28 : délais par étape, apps / appairés / scan / connexion /
  abonnement qui ne répondent jamais, verrou natif, montre déjà synchronisée, assistant coché, test interrompu au
  délai maximal, attente de la synchro, détection d'apps bornée, `lastConnectedAt`, `stepsCheck`).
- Lint : 6 erreurs (inchangé). Build ✅.
- `npm run visual` (8 pages) ✅ ; `--routes=/connectors --ble=watch --connect=done --setup` ✅ (capture : étapes
  cochées, « Rien à faire ici ») ; `--ble=watch-silent --devices --setup` ✅ (parcours de libération inchangé).

## Ce que le propriétaire doit faire (si un souci persiste)
Après la mise à jour : Plus → montre → Diagnostic → « Relancer le test », puis « Copier le journal » et l'envoyer.
Le journal dit quelle étape a calé (délai dépassé) et contient la ligne « pas du jour ».

## Suite
1. 🔴 Lire le journal du propriétaire s'il en envoie un (étape qui calait ; cohérence des pas du jour).
2. 🙂 Consigne B : estimation automatique du bien-être — D4 (I100 ① moteur du visage + I106, I110) et D5.
3. 🧹 D1 restes, puis ⚡ D2.
