# 2026-10-13 00:30 Paris (22:30 UTC) — Priorité montre : libérer et appairer (D3 b)

**Type** : ⌚🏗️ (priorité absolue, étape b)  ·  **PR** : #125 (fusionnée → v110, APK publié ; CI Vitest, Build APK et émulateur A56 Android 15 / 16 vertes)

## Pourquoi
- Démarrage : main vert (bf809a6, v109, Build & Release ✅), aucune PR « [Auto] » ouverte (seule #51 cursor/*, non touchée).
- `journal/diagnostics/` : **aucun journal du propriétaire** pour l'instant → on avance sur ce qui n'en dépend pas :
  étape (b) détection / libération + assistant d'appairage Android.

## Ce qui a été fait
- **Recherche** (agent, faits seulement, sources citées dans `protocoles/huawei.md` §8) : menu officiel de
  réinitialisation (Paramètres → Système et mises à jour → Réinitialiser), procédure d'appairage (ne pas pré-appairer
  dans Android, accepter la demande), identifiant de compte Huawei (17–19 chiffres, cookie `userId` de
  cloud.huawei.com), statut GT 6 Pro dans Gadgetbridge (0.88.0, « en grande partie », clé négociée localement sans
  compte). Inconnus notés ❓ : verrou antivol après reset, adresse BLE = classique ?, type de boîte d'appairage.
- **Logique** `src/devices/huawei/setup.js` (pure, 15 tests) : plan d'étapes `release → reset → pair → test` (chemin
  « HealthTrack seule ») ou `account → pair → test` (plan B « Garder Huawei Santé ») ; Health Sync n'est pas compté
  comme app qui tient la montre ; un appairage Android antérieur à la réinitialisation ne compte plus (`stalePairing`),
  un ré-appairage fait à la main dans Android est reconnu (`observeBond`) ; option « jamais liée à une autre app »
  (saute la réinitialisation si aucune app concurrente n'est installée) ; `pairWatch` (recherche classique → `pair`).
- **Natif** : `AppManagerPlugin.java` (nouveau, `uninstall` = `ACTION_DELETE`, `openSettings` = page de l'app ;
  permission `REQUEST_DELETE_PACKAGES`) ; `BtClassicPlugin.java` + `discover` (startDiscovery, ≈ 12 s), `pair`
  (`createBond` + attente de `ACTION_BOND_STATE_CHANGED`, 60 s), `openBluetoothSettings`.
- **UI** `WatchSetup.jsx` dans la carte « Montre Huawei en direct » (pas de nouvel écran) : choix du chemin, étapes
  avec l'étape courante dépliée et son geste ; re-détection au retour dans l'app (`visibilitychange`). Conseils du
  verdict mis à jour pour renvoyer vers l'encadré.
- Captures : `npm run visual -- --routes=/connectors --ble=watch-silent --devices --setup` (faux plugins AppManager /
  discover / pair) ; clic sur « Tester » recentré (cliquable sous la barre d'onglets).
- Spécification `protocoles/huawei.md` §8 et §9 complétées. Nouveautés : `2026-10-13-0030-montre-liberer-appairer.json`.

## Vérifications
- Tests : 1018 ✅ (73 fichiers ; +18 : setup 15, WatchSetup 3) · Lint : 6 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : `npm run visual` (8 pages) OK ; `--empty` OK ; Connecteurs `--ble=watch-silent --devices --setup` en sombre
  et `--light` regardés : encadré lisible, boutons « Désinstaller / Réglages de Huawei Health », étapes à venir grisées.
- **Bug trouvé par la capture** : boucle de rendu infinie (fonction `now` par défaut recréée à chaque rendu → effet
  relancé sans fin), invisible dans les tests unitaires. Corrigé + test qui compte les détections d'apps.
- Java : non compilable dans la session (pas de SDK Android) → vérifié par le job CI « Build APK ».

## Apprentissages / décisions
- **Ne pas pousser à réinitialiser trop tôt** : HealthTrack ne lit pas encore les données (étapes c, d). Le résumé
  hebdo le dit clairement au propriétaire ; le plan B permet d'attendre sans rien casser.
- `removeBond` n'est pas une API publique : l'app envoie l'utilisateur oublier l'ancien appairage dans les réglages
  Android (jamais dans Huawei Santé).
- Le diagnostic ne peut pas prouver qu'une montre est encore liée une fois l'app désinstallée : l'échec
  d'authentification de l'étape (c) le prouvera (backlog).

## Suite proposée
- Lire le journal du propriétaire dès qu'il arrive.
- D3 (c) : authentification HiChain (spec §6), constantes saisies sur le téléphone sauf accord du propriétaire.
