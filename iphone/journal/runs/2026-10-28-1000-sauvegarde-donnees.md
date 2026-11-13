# 2026-10-28 10:00 UTC — Aller-retour des données (PR #29, mergée), sauvegarde du téléphone (PR #30)

**Étape** : I3  ·  **PR** : #29 (mergée), #30  ·  **Android suivi** : v548 (inchangé)  ·  **iOS** : 548 (simulateur)  ·  **Parité** : 30 % (14/47)

## Déclenchement
- Tâche planifiée de 10:00 UTC, à l'heure. `main` : 1697b08 (#28), CI de push en cours (run 99). PR #29 : CI en
  cours (run 101, relancée à 09:46 par le journal des demandes). `scripts/upstream.sh --latest` : toujours v548.

## Messages du propriétaire depuis le run précédent
- « c'est quoi les demandes pour la routine android ? » → les 4 demandes en attente expliquées, texte prêt à coller.
- « j'ai transmis le tout » (≈ 09:45 UTC) → `DEMANDES.md` mis à jour (transmises), résumé de la semaine aussi.
- « ok, c'est quoi A1 exactement ? comment je fais ? » → pas à pas d'A1 redonné (compte Apple avec validation en deux
  étapes, nom légal, sa propre carte, « Individu », 99 USD par an, attendre la validation puis le dire ici).

## Ce qui a été fait (pendant la CI de #29)
- Préparé (branche `claude/ios-i3-sauvegarde`, empilée sur #29, poussée sans PR) : **sonde de la sauvegarde du
  téléphone** — plugin `CaptureProbe` (build Debug seulement) qui relève, pour Documents (copie de secours),
  Library/WebKit et chaque dossier IndexedDB sous Library, la marque « exclu de la sauvegarde » (ou Library/Caches)
  et la taille ; `probeBackup` l'écrit dans la console. 2 tests écrits d'abord ; suite : 2694 ✅ ; build ✅.
  Répond à la question laissée ouverte le 27/10 (`RECHERCHE.md` : « où WKWebView range IndexedDB et si iCloud
  l'inclut »).

- **CI de #29 verte** (run 101, 10:25) : sur les deux iPhone simulés, `[données] aller-retour {"count":1924,
  "exported":1924,"reread":1924,"imported":0,"skipped":1924,"after":1924,"bytes":773564}` — tout exporté, relu,
  reconnu comme déjà là, rien perdu ni doublé. Bilan du ventre et note du soir toujours importés (`inserted 1`,
  boîte vide), rappel de portion → `/reintroduction` ; 68 captures, 0 erreur JavaScript. Branche à jour de `main`
  vérifiée, **#29 mergée** (f66bc5c) ; CI de `main` partie (run 102). CI de `main` de #28 (run 99) : verte.
- Ajouté à la branche de la sauvegarde (avant la PR) : **`BackupMarker` en Swift**, le repère propre au téléphone
  que `restoreGuard.js` lit au démarrage (`missingOnIos('BackupMarker')` devient faux sans toucher au code partagé) :
  identifiant dans `Library/Application Support/Halcya/device_marker`, marqué exclu de la sauvegarde. Après une
  restauration iCloud, il est neuf alors que le localStorage restauré garde l'ancien : les secrets propres à l'ancien
  téléphone (jeton Withings, jeton d'achat…) sont retirés, comme sur Android. Règle `DeviceMarker` dans
  `HalcyaRules` (3 tests XCTest écrits d'abord : création unique, fichier absent après restauration → neuf, fichier
  vide remplacé ; exclusion relue). La sonde relève aussi le repère et la réponse de `restoreGuard.js`. Suite :
  2694 ✅ (24 tests de `captureMode`) ; build `appstore` ✅. `main` fusionnée dans la branche (conflits du journal et
  de `captureMode` : `main` = contenu de #29, version de la branche gardée après vérification), PR #30 ouverte.
- Prochaine étape notée (BACKLOG) : I6 StoreKit 2 testé sans compte Apple (`.storekit` + `SKTestSession`) ; avant,
  le geste réel d'import par le sélecteur de fichiers.

## Suite
- CI de #30 : `[sauvegarde]` attendu : Documents et dossiers IndexedDB `excluded:false`, `device_marker`
  `excluded:true`, `repère {"restored":false}` (sans `unavailable`) ; `swift test` (DeviceMarker) et build Xcode
  verts → merger, « Sauvegarde du téléphone » ✅, et « Persistance » revue (la base suit la sauvegarde iCloud).
- CI de `main` (run 102) à vérifier.
