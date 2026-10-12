# 2026-10-12 04:30 Paris (02:30 UTC) — Couche Bluetooth, étape 2 : tensiomètres, balances, thermomètres, oxymètres

**Type** : 🏗️ (C7, objets connectés, I8) + 🐛 (test instable sur main)  ·  **PR** : #109

## Pourquoi
- Démarrage : aucune PR [Auto] ouverte ; Build & Release v99 ✅ (APK publié). Mais le workflow **Tests** de main était
  **rouge** après #108 : `Nutrition.test.jsx` (« enregistre le profil saisi… ») a dépassé le délai de 1 s de `findByText`
  sur le runner CI — test sans rapport avec le BLE, vert en local et sur la PR. Réparé en premier.
- Priorité n° 2 : étape suivante naturelle de la couche BLE générique — les profils standard « appareils de mesure »
  couvrent d'un coup des centaines de modèles (Omron, A&D, Beurer, Withings BPM Connect, balances Xiaomi / Renpho au
  profil standard, thermomètres, oxymètres PLX). Zéro saisie : la mesure arrive toute seule.

## Ce qui a été fait
- **Test instable** : `src/test/setup.js` → `configure({ asyncUtilTimeout: 3000 })` (findBy* / waitFor attendent 3 s au
  lieu d'1 s). Aucun test ne change, tous plus robustes sur un runner lent.
- `src/devices/ble/measurements.js` : nombres IEEE-11073 (SFLOAT 16 bits, FLOAT 32 bits, valeurs spéciales NaN / NRes /
  ±INF → null), horodatage de l'appareil (heure locale ; horloge non réglée ou > 24 h dans le futur → heure de réception) ;
  décodeurs 0x2A35 tension (mmHg / kPa, pouls), 0x2A9D poids (5 g ou 0,01 lb, 0xFFFF ignoré), 0x2A9C composition
  (champs optionnels sautés jusqu'au poids), 0x2A1C température (°C / °F, 30–45 °C seulement : pas de thermomètre
  d'ambiance), 0x2A5E / 0x2A5F SpO₂ ; bornes de plausibilité identiques à celles de Health Connect.
  `measurementsToEntries` → mêmes types d'entrée que Health Connect (`blood_pressure` + `pulseBpm`, `weight`,
  `body_composition`, `body_temperature`, `heart_rate`/`oxygenSaturation`), source `ble`, une entrée par type et instant.
  `READERS` : service + caractéristiques par pilote (facultatives : 0x2A9D sur un impédancemètre, PLX ponctuel / continu).
- `bleService.receiveMeasurements` : connexion, abonnement aux indications, fin à la déconnexion de l'appareil (il se
  déconnecte après avoir tout envoyé), après 5 s de silence, 15 s après la 1re mesure (oxymètre continu) ou 60 s ;
  `cancel()` ; caractéristique facultative absente ignorée ; aucune disponible → erreur + déconnexion.
- Pilotes : `mode: 'live'` (cardio) / `'receive'` (5 profils de mesure) + `howTo` (« Montez sur la balance »…). Glycémie,
  vélo, foulée, fitness restent « Bientôt ».
- `BleDevices.jsx` : bouton « Recevoir la mesure » → carte « En attente de … » avec le geste à faire et les mesures qui
  arrivent en direct, rappel d'appairage Android ; résultat « N mesures enregistrées » + rappel « une mesure isolée compte
  peu… pas un diagnostic… professionnel de santé ».
- `npm run visual -- --ble=receive` / `--ble=received` : tensiomètre simulé (mesure horodatée + une ancienne, puis déconnexion).

## Vérifications
- Tests : 856 ✅ (829 avant, +27) · Lint : 6 erreurs + 1 warning (inchangé) · Build ✅
- Visuel : `npm run visual` complet OK (0 erreur JS) ; regardé `--ble` (BP7000 « Compatible » + « Recevoir la mesure »),
  `--ble=receive` (« Tension 127/81 mmHg · pouls 63 » en direct), `--ble=received` (2 mesures enregistrées).

## Apprentissages / décisions
- Les appareils de mesure standard n'annoncent souvent qu'**après** une mesure, puis coupent : le bon geste est « mesurer
  puis Recevoir », ou « Recevoir puis mesurer » si l'appareil est déjà allumé. Les deux sont expliqués à l'écran.
- Beaucoup de tensiomètres (Omron…) exigent un **appairage** : Android le déclenche tout seul à l'abonnement à une
  caractéristique chiffrée. Pas d'appel `createBond` explicite pour l'instant ; à revoir si des retours réels l'exigent.
- Les mesures en mémoire de l'appareil sont renvoyées à chaque connexion : la clé de dédoublonnage `source|at|type` +
  l'horodatage de l'appareil évitent les doublons. Sans horodatage, chaque réception crée une entrée (limite connue).
- Non vérifié sur un appareil réel : trames construites d'après la spécification GATT (Bluetooth SIG).

## Suite proposée
- Propriétaire : si vous avez un tensiomètre / une balance / un thermomètre Bluetooth, essayez « Recevoir la mesure » et
  dites-moi la marque et ce qui s'affiche.
- 🏗️ BLE étape 2 bis : Current Time Service (régler l'horloge de l'appareil → horodatages fiables), Device Information
  Service (marque / modèle), Record Access Control Point (glycémie, mémoire des tensiomètres), export des empreintes inconnues.
- 🏗️ Réception automatique : appareil de mesure mémorisé → reconnexion dès qu'il réapparaît (application ouverte), puis
  Companion Device Manager en arrière-plan.
- 🏗️ C8 météo / pression / pollen.
