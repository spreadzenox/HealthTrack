# 2026-10-13 02:30 Paris (00:30 UTC) — Priorité montre : authentification HiChain (D3 c)

**Type** : ⌚🏗️ (priorité absolue, étape c)  ·  **PR** : #127 (fusionnée → **v111**, APK publié ; CI Vitest, Build APK et émulateur A56 Android 15 / 16 vertes sur la PR)

## Pourquoi
- Démarrage : main vert (eee2f57, v110), aucune PR « [Auto] » ouverte ni rouge (seule #51 cursor/*, non touchée).
- `journal/diagnostics/` : **toujours aucun journal du propriétaire** → on avance sur l'étape (c), qui n'en dépend pas
  pour l'essentiel (le mode d'authentification est lu à l'exécution).

## Ce qui a été fait
- **Recherche** (agent, faits seulement, aucun code rapporté) : Gadgetbridge (AGPL, lecture seule) recoupé avec
  **OpenHarmony `security_device_auth` (Apache-2.0)**, dont HiChain est issu, et huawei-lpv2 (MIT). Résultat consigné
  avec nos mots dans `protocoles/huawei.md` §6 (déroulé, messages JSON, calculs, identifiants, chiffrement, cas connus).
- **Découverte** : l'identifiant de groupe que Gadgetbridge garde en constante = SHA-256 de
  « health_group_name|com.huawei.health » (règle OpenHarmony des groupes pair à pair) → calculé, rien à stocker.
  Seules les 3 constantes « digest secret » (déchiffrement du PIN, **premier appairage seulement**) restent nécessaires.
- **Code** (écrit depuis la spec) :
  - `crypto.js` : SHA-256, HMAC, HKDF, PBKDF2, AES-GCM / CBC sur Web Crypto (vecteurs RFC 4231, 5869, 7914, NIST) ;
  - `protocol.js` : `encodeFrames` (découpage sortant en tranches 1 / 2 / 3) ;
  - `session.js` : requêtes / réponses par service-commande, délais, coupure, chiffrement branchable, ordre préservé ;
  - `hichain.js` : négociation 1/0x33, PIN 1/0x2C, messages 1/0x28, liaison et authentification ISO, clé des trames,
    chiffrement des trames (IV 12 aléatoires + compteur gros-boutiste, ou 16 aléatoires en type 4), lecture des
    constantes au format huawei-lpv2 ou collées ;
  - `pairing.js` : déroulé complet (lien → état → négociation → [PIN + liaison] → authentification → batterie chiffrée,
    identifiant de compte du plan B), clés par montre en local, journal **sans contenu de trame** (en-tête et taille
    seulement : ni clé, ni PIN, ni adresse complète), issues `connected` / `need_secrets` / `key_rejected` /
    `pin_failed` / `unsupported` / `connect_failed` / `failed` et conseils (jamais « dissocier ») ;
  - `testing/fakeWatch.js` : **fausse montre** qui joue le côté montre de la spec (constantes de test aléatoires).
- **UI** `WatchConnect.jsx` (encadré « Connexion à la montre » dans la carte existante, pas de nouvel écran) :
  « Télécharger les paramètres » (fetch du `protocol.py` de huawei-lpv2) ou « Ou les coller », « Se connecter à la
  montre », « Refaire l'appairage », étapes, conclusion, export du journal.
- Captures : `npm run visual -- --routes=/connectors --ble=watch --connect` et `--connect=done` (nouvelles options).

## Vérifications
- Tests : **1050 ✅** (78 fichiers ; +32 : crypto 7, session 4, hichain 9, pairing 8, WatchConnect 4) · Lint : 6 erreurs,
  1 warning (inchangé) · Build ✅
- Visuel : `npm run visual` (8 pages) OK, `--empty` OK ; Connecteurs `--ble=watch --devices --connect` (encadré avant
  import) et `--ble=watch --connect=done` (montre authentifiée, 6 étapes vertes) regardés : lisible, boutons dans la
  largeur, rien ne déborde.
- Après merge : « Build & Release » ✅ → v111 avec `HealthTrack-v111.apk`. Le workflow « émulateur A56 » de main a
  échoué à la compilation des tests Android : `junit:4.13.2` et `hamcrest-core:1.3` introuvables sur Maven Central
  (panne réseau du dépôt, aucun fichier Android modifié ; le même workflow était vert sur la PR, même code, et le même
  échec passager avait touché 5ceed92). Rien à corriger dans le code ; à surveiller s'il se répète.
- Non vérifiable ici : la vraie montre (aucune trame réelle publique de GT 6 Pro) et le Java (inchangé ce run).

## Apprentissages / décisions
- **Constantes du PIN** : téléchargées sur le téléphone d'un geste (source MIT), jamais dans le dépôt ni dans l'APK ;
  décision signalée au propriétaire dans le résumé (il peut demander l'inverse). L'outil de session a d'ailleurs refusé
  de manipuler ces valeurs : elles n'ont été ni lues en clair ni copiées dans ce run.
- Une fausse montre écrite depuis la même spec ne prouve que la cohérence interne : les points ❓ (format du PIN,
  message final, type 1 / 3 / 4) seront tranchés par le journal de connexion du propriétaire.
- Le choix liaison / authentification est local ; une clé refusée en authentification → `key_rejected` (réessayer,
  sinon « Refaire l'appairage »).

## Suite proposée
- D3 (d) : spécifier puis lire les données (minute par minute, sommeil, RR → VFC, séances) → IndexedDB.
- Dès qu'un journal arrive : corriger l'authentification (c bis) en priorité.
