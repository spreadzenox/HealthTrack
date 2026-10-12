# 2026-10-12 22:30 Paris (20:30 UTC) — Priorité montre : test de connexion directe (D3 a)

**Type** : ⌚🏗️ (priorité absolue, étape a)  ·  **PR** : #123 (fusionnée → v109, APK publié ; CI Vitest + Build APK vertes)

## Pourquoi
- Démarrage : main vert (37a9c36, v108), aucune PR « [Auto] » ouverte ou rouge.
- Le prompt de la routine contient une **PRIORITÉ ABSOLUE** nouvelle (12/10 au soir) : HealthTrack doit devenir l'app
  principale de communication avec la montre, sans Gadgetbridge ni app constructeur, avant tout autre chantier hors
  runs « idées ». Premier run qui la lit → report dans la charte (§000) et le backlog, « Prochaines étapes » réordonnées,
  puis étape (a) : écran de diagnostic exportable.

## Ce qui a été fait
- **Charte** : nouveau §000 (priorité absolue : parcours visé, méthode, licence, étapes a → d) ; §00 et D3 renvoient à
  lui ; fichiers `protocoles/` et `diagnostics/` ajoutés à la table ; protocole de démarrage : lire `journal/diagnostics/`.
- **Recherche** (agent en lecture seule, faits seulement) : Gadgetbridge (commit d4bd8367), `zyv/huawei-lpv2` (MIT),
  pages d'appairage Gadgetbridge, issues #5428 / #6978 / #6472, PR #3721 / #6367. **Découverte : les GT 3 → GT 7, dont
  la GT 6 Pro, utilisent le Bluetooth classique (RFCOMM, service SDP `82FF3820-…`), pas le BLE GATT.**
- **Spécification** `journal/protocoles/huawei.md`, avec nos mots et niveaux de confiance : transport, trame, CRC,
  tranches, TLV, codes de résultat, chiffrement, paramètres du lien (dont l'étiquette 7 → mode d'authentification),
  séquence de connexion, HiChain, commandes santé, contraintes d'appairage, état d'avancement (a → d).
- **Code** (écrit depuis la spec, aucun code Gadgetbridge) :
  - `src/devices/huawei/protocol.js` : CRC-16 XMODEM, entiers variables, TLV, trames, réassemblage (morceaux +
    tranches 1/2/3), demande et lecture des paramètres du lien (`authMode` : classique / HiChain / Lite / HiChain 3).
  - `src/devices/huawei/transports.js` : transport RFCOMM (plugin natif) et BLE FE86/FE01/FE02, même interface.
  - `src/devices/huawei/diagnostic.js` : 7 étapes (Bluetooth, apps concurrentes, recherche appairés + annonces,
    connexion, services / SDP / Device Information Service, canal, paramètres du lien), classique d'abord puis BLE,
    meilleure tentative retenue, verdict à code stable (`link_ok`, `no_answer`, `connect_failed`, `not_found`,
    `no_huawei_service`, `refused`, `no_bluetooth`) ; aucune écriture sur la montre au-delà de la 1re trame en clair ;
    MAC réduite à ses 2 derniers octets ; ne propose jamais de dissocier la montre dans Huawei Santé.
  - `android/…/BtClassicPlugin.java` (2e plugin natif maison, ~200 lignes) : appareils appairés (type, UUID SDP),
    connexion RFCOMM avec délai, lecture en tâche de fond → événements `data` / `disconnected`, écriture, déconnexion.
  - `src/components/WatchDiagnostic.jsx` : carte « Montre Huawei en direct » dans Connecteurs (sous « Mes appareils »),
    étapes, verdict, dernier rapport gardé, « Enregistrer le journal » (Documents) / « Copier le journal ».
  - `src/devices/phoneApps.js` : détection / ouverture des apps sortie de `MyDevices.jsx` (partagée).
  - Captures : `npm run visual -- --routes=/connectors --ble=watch --devices` (montre qui répond en RFCOMM) et
    `--ble=watch-silent` (montre muette).
- `journal/diagnostics/README.md` : où déposer les journaux exportés.
- Nouveautés : `2026-10-12-2030-montre-diagnostic.json`.

## Vérifications
- Tests : 1000 ✅ (71 fichiers ; +29 : protocole 13, diagnostic 12, écran 4) · Lint : 6 erreurs, 1 warning (inchangé) ·
  Build ✅
- Visuel : `npm run visual` (8 pages) OK ; Connecteurs regardé avec `--ble=watch` (verdict vert « La montre répond »,
  méthode « HiChain »), `--ble=watch-silent` (verdict « ne répond pas », conseils, rappel « ne dissociez pas ») et
  `--empty` (texte « Dans l'app Android… », pas de bouton). Aucun débordement.
- Java : non compilable dans la session (pas de SDK Android) → vérifié par le job CI « Build APK ».

## Apprentissages / décisions
- Le BLE seul n'aurait jamais suffi pour la GT 6 Pro : le diagnostic essaie d'abord RFCOMM (montre appairée à Android).
- Valeurs réelles des paramètres du lien d'une GT 6 : introuvables publiquement → c'est précisément ce que le journal
  du propriétaire apportera.
- **Constantes d'authentification** (classique / Lite / PIN HiChain) : issues de l'app Huawei, publiées en MIT par
  huawei-lpv2. La consigne interdit de committer une clé extraite d'une app constructeur → à l'étape (c), demander
  l'accord du propriétaire ou les faire saisir une fois sur le téléphone. Le diagnostic n'en utilise aucune.
- Pas de nouvelle permission Android : BLUETOOTH_CONNECT vient déjà du plugin BLE, demandé par `ready()` avant le test.

## Suite proposée
- Lire le journal du propriétaire dès qu'il arrive (`journal/diagnostics/`).
- D3 (b) : libération (désinstallation / réglages de l'app concurrente, guide de réinitialisation, plan B compte
  Huawei) + assistant d'appairage Android (`createBond`) ; puis (c) authentification, (d) synchronisation.
