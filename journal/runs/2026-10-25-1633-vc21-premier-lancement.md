# Run du 25/10/2026 16:33 (Paris, CET) — VC-21 : erreurs du premier lancement play

**Type** : 🧭 chantier produit (finition de la version candidate)

## Constat au démarrage
- Main à `b150797` (#370). PR #371 (journal du run 15:33, verte, journal seul) encore ouverte : fusionnée en squash
  (`0a26a12`). #51 `cursor/*` non touchée. POL-1d attend toujours P28 (propriétaire) → petite étape ouverte : VC-21.

## Ce qui a été fait
- **Identification** (artefact `screenshots-samsung-a56-api35`, run 40206044868, `play_logcat.txt`) : « Line 330 -
  Msg: [object Object] » est le `c.error(result.error)` du journal Capacitor (`native-bridge.js`, builds debug
  seulement) quand un plugin natif refuse. Les deux refus, déjà gérés par l'app :
  1. `BtClassic.listBonded` → « Autorisation « Appareils à proximité » manquante » : lancé par `syncWatchIfStale`
     (synchro auto de la montre) à **chaque ouverture**, même sans aucune montre ;
  2. `PlayBilling.queryPurchases` → « Service connection is disconnected » : l'image de l'émulateur n'a pas le Play
     Store. Attendu, rien à corriger.
- **Correctif app** : `createKeyStore().hasAnyKey()` ; `syncWatchIfStale` rend `not_paired` sans appel Bluetooth tant
  qu'aucune montre n'a de clé longue durée dans l'app (la plupart des utilisateurs). Avec une montre appairée, rien ne
  change. Tests : nouveau cas « le Bluetooth n'est pas interrogé » (rouge avant, vert après) ; deux cas existants
  appairent d'abord (`no_watch`, Bluetooth coupé).
- **Résumé émulateur lisible** : `play-cold-start.sh` remplace « [object Object] » par « (plugin natif)
  <Plugin>.<méthode> refusé : <message> » (awk sur la ligne « Sending plugin error » précédente), testé sur le journal
  téléchargé ; une phrase signale que le refus PlayBilling est attendu sur l'émulateur.

## Vérifications
- Vitest 2 207 verts ; build OK ; lint 6 erreurs (inchangé) ; `npm run visual` (14 pages, démo) : 0 erreur JS, Sources
  relue (aucun écran modifié). `bash -n` du script.
- À lire sur la PR : résumé « Premier lancement à froid » → attendu 1 seule ligne (PlayBilling, émulateur).

## Remarques
- Même job : « Accueil introuvable après 120 s » pour la relance sideload (données vierges → onboarding). Avertissement
  sans effet sur le succès du job ; à aligner sur le titre de l'onboarding si on veut une capture utile (mineur).
- Avertissement préexistant « Capacitor plugin "SystemBars"/"AppManager" already registered » (double
  `registerPlugin`), sans effet.

## Suite
- POL-1d dès P28 ; sinon jalon 5 / M suivants.
