# 2026-10-12 02:30 Paris (00:30 UTC) — Couche Bluetooth générique, étape 1 : capteurs cardio et VFC

**Type** : 🏗️ (C7, objets connectés, I8)  ·  **PR** : #108

## Pourquoi
- Priorité n° 2 du propriétaire : connexion **directe** aux appareils, approche générique (profils BLE standard d'abord,
  registre de pilotes, empreinte des inconnus). Étape 4 de « Prochaines étapes » ; la météo (étape 3) attendra : elle ajoute
  un service distant, alors que le BLE est 100 % local et répond à la demande la plus insistante.
- Démarrage : aucune PR [Auto] ouverte, Build & Release v98 ✅ (PR #107).

## Ce qui a été fait
- Dépendance `@capacitor-community/bluetooth-le` **8.3.0** (MIT, Capacitor ≥ 8, publiée le 13/08/2026). Les fichiers Gradle
  Capacitor sont générés par `npx cap sync` en CI (ignorés par Git) : rien d'autre à brancher.
- Manifeste : `BLUETOOTH_SCAN` avec `neverForLocation`, position limitée à Android ≤ 11 (`maxSdkVersion=30`) →
  `BleClient.initialize({ androidNeverForLocation: true })`, seule l'autorisation « Appareils à proximité » est demandée.
- `src/devices/ble/heartRate.js` : décodage 0x2A37 (FC 8/16 bits, contact, énergie, RR en 1/1024 s), filtre RR
  (300–2000 ms, saut ≤ 20 % du dernier battement retenu), RMSSD sur battements retenus **réellement consécutifs**,
  qualité `good / short (< 1 min ou < 50 RR propres) / noisy (> 20 % d'artefacts) / no_rr` ; entrées `heart_rate`
  (FC moyennée par 10 s, VFC `subtype: heartRateVariability`, `method: 'rmssd'`) source **`ble`**, même forme que Health
  Connect → baselines, Radar, analyses les lisent sans changement. Horodatage VFC décalé d'1 ms (clé de dédoublonnage
  `source|at|type`).
- `src/devices/ble/drivers.js` : empreinte (nom, services, identifiants fabricant, clés service data — **jamais l'adresse
  MAC**), registre ordonné de pilotes au score : 11 profils standard (FC 0x180D **lu** ; tensiomètre, balance,
  impédancemètre, thermomètre, oxymètre, glycémie, vélo puissance / vitesse, foulée, fitness machine **reconnus**), puis
  « montre propriétaire » par famille (13 marques) avec guide associé, sinon « inconnu ».
- `src/devices/ble/bleService.js` : scan 8 s + appareils déjà appairés (`getBondedDevices` : seuls les reconnus sont
  affichés — pas la voiture ni les écouteurs), mesure en direct, empreintes des inconnus en `localStorage` (50 max,
  dédoublonnées par famille, compteur).
- `BleDevices.jsx` (Connecteurs, après Health Connect / Withings) : « Rechercher autour de moi », cartes Compatible /
  Bientôt / Via son app (+ « Voir le guide »), inconnus regroupés en une ligne ; mesure 5 min (auto-stop) avec pouls en
  direct, « Terminer et enregistrer » / « Annuler », résultat FC moyenne / min / max + VFC ou raison de son absence,
  rappel « comparez à votre norme, une estimation, pas un diagnostic ». `openGuide` factorisé dans `utils/openGuide.js`.
- `npm run visual -- --ble` / `--ble=measure` : faux client BLE dans le navigateur (`window.__healthtrackFakeBle`).

## Vérifications
- Tests : 829 ✅ (793 avant, +36) · Lint : 6 erreurs + 1 warning (inchangé) · Build ✅
- Visuel : `npm run visual` complet OK ; regardé `--ble` (liste), `--ble=measure` (63 bpm en direct), `--empty`.
  **Bug trouvé grâce aux captures** : une TV Samsung (identifiant fabricant 0x0075) était classée « Montre Samsung » →
  pour Samsung / Huawei / Xiaomi / Google il faut un nom de montre ou de bracelet ; l'identifiant seul ne suffit que
  pour les marques 100 % objets sport / santé (Garmin, Polar, Amazfit). Test ajouté (TV, téléphone, écouteurs Huawei).

## Apprentissages / décisions
- Les montres Huawei récentes (et Garmin, Polar, COROS…) savent **diffuser leur FC en BLE standard** pendant une séance :
  c'est la première voie de données *brutes* de la GT 6 Pro vers HealthTrack sans app tierce. Astuce affichée dans l'app ;
  à vérifier sur la vraie montre (nom exact du réglage).
- Une montre propriétaire n'est jamais connectée directement : appairée à son app officielle, une seule app à la fois.
- Identifiants fabricant Bluetooth SIG utilisés : Huawei 0x027D, Samsung 0x0075, Xiaomi 0x038F, Huami 0x0157, Garmin
  0x0087, Polar 0x006B, Google 0x00E0 (assigned numbers). Fitbit / Withings / Oura reconnus par le nom seulement.
- Non vérifié sur appareil réel (pas de capteur en CI) : le parsing est couvert par des trames d'octets, l'APK par la CI.

## Suite proposée
- Propriétaire : avec la GT 6 Pro, activer la diffusion de la FC (séance) puis « Rechercher » ; dire ce qui s'affiche.
- 🏗️ Couche BLE étape 2 : tensiomètre 0x1810 / balance 0x181D / thermomètre / oxymètre (indications + SFLOAT/FLOAT
  IEEE-11073), puis exporter les empreintes inconnues depuis l'app.
- 🏗️ C8 météo / pression / pollen ; « Mes appareils » étape 2 (la montre appairée y apparaît aussi, via `getBondedDevices`).
