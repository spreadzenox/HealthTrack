# Protocole des montres Huawei / Honor — spécification HealthTrack

> Rédigée **avec nos propres mots** à partir de sources publiques, pour réimplémenter le protocole sans jamais copier
> de code (décision du propriétaire : HealthTrack ne passe pas sous AGPL). Le code de HealthTrack
> (`app/src/devices/huawei/`) est écrit **à partir de ce document**, pas à partir des sources ci-dessous.
> Chaque fait porte son niveau de confiance : ✅ vérifié par un test / une trame de référence, 📖 lu dans une source,
> ❓ supposé, à confirmer par le journal de diagnostic de la GT 6 Pro du propriétaire.

## Sources

| Réf. | Source | Licence | Usage |
|---|---|---|---|
| [L] | `github.com/zyv/huawei-lpv2` (Y. Zaytsev, 2019) — `huawei/protocol.py`, tests | MIT | trame, TLV, entiers variables, trame de référence |
| [G] | `codeberg.org/Freeyourgadget/Gadgetbridge`, commit d4bd8367 (12/10/2026), paquets `devices/huawei` et `service/devices/huawei` | **AGPL — lecture seule** | ordre des étapes, numéros de services / commandes / étiquettes |
| [W] | gadgetbridge.org : « Huawei / Honor pairing », « Huawei / Honor specifics » | CC | contraintes d'appairage, clé invalidée |
| [I] | Gadgetbridge issues #5428 (support GT 6 / GT 6 Pro, 28/09/2025), #6978, #6472 ; PR #3721, #6367 | — | état du support, cas d'échec |

Lecture de [G] faite le 12/10/2026 (run 22:30 Paris) par un agent de recherche qui n'a rapporté que des faits
(numéros, ordre, rôles), jamais de code. Rien ci-dessous n'est une traduction ligne à ligne.

## 1. Transport

- 📖 **Les montres GT 3, GT 4, GT 5, GT 6 (Pro) et GT 7 parlent en Bluetooth « classique »** (socket RFCOMM / SPP),
  pas en BLE GATT [G : coordinateurs « BR »]. Service SDP : `82FF3820-8411-400C-B85A-55BDB32CF060` (Huawei),
  `C9770A18-4C3D-453A-8AAF-D7EC7BBD2785` (Honor). La connexion RFCOMM exige que la montre soit **appairée à Android**.
- 📖 Bracelets et anciens modèles : BLE GATT, service `0xFE86`, écriture sur `0xFE01`, notifications sur `0xFE02`
  [L, G]. Variante Honor en UUID 128 bits propres (non utilisée pour l'instant).
- 📖 Nom annoncé de la GT 6 Pro : « HUAWEI WATCH GT 6 Pro-XXX » (3 caractères hexadécimaux, probablement la fin de
  l'adresse) ; modèle ATM-B29 [I #5428]. Identifiant fabricant Bluetooth SIG de Huawei : `0x027D`.
- ❓ Ce que la GT 6 Pro annonce en BLE (FE86 ? 0x027D ?) : inconnu → le diagnostic essaie RFCOMM puis BLE.
- Le format des trames (§2) est **le même** sur les deux transports.

## 2. Trame

Octets, dans l'ordre :

| Champ | Taille | Contenu |
|---|---|---|
| en-tête | 1 | `0x5A` |
| longueur | 2, gros-boutiste | nombre d'octets entre ce champ et le CRC (exclus) |
| tranche | 1 | `0` = message entier ; `1` début, `2` milieu, `3` fin d'un message découpé |
| index de tranche | 1, seulement si tranche ≠ 0 | 0, 1, 2… |
| charge utile | n | message entier : service (1), commande (1), TLV… ; tranches : morceau du message (seule la 1re porte service et commande) |
| CRC | 2, gros-boutiste | CRC-16 polynôme `0x1021`, valeur initiale `0`, non réfléchi (« XMODEM »), calculé de l'en-tête à la fin de la charge utile |

- ✅ Trame de référence [L] : service 1, commande 2, TLV 3 = « abc » → `5A 00 08 00 01 02 03 03 61 62 63 E1 D3`.
- ✅ Contrôle du CRC : « 123456789 » → `0x31C3`.
- 📖 Taille d'une tranche = paramètre 2 du lien (244 par défaut) ; charge utile par tranche = taille − 7 (5 octets
  d'en-tête + 2 de CRC). Un message qui tient dans une tranche est envoyé entier.
- Une trame peut arriver coupée en plusieurs notifications BLE / lectures RFCOMM : le récepteur accumule jusqu'à la
  longueur annoncée, et ignore les octets parasites avant `0x5A` (✅ `createReassembler`).
- 📖 Quelques réponses ne sont pas des TLV mais des octets bruts (blocs de fichiers : 0x0A/0x05, 0x2C/0x05, 0x1C/0x05,
  0x28/0x06) → à traiter commande par commande.

## 3. TLV

- Étiquette sur 1 octet ; bit `0x80` levé = la valeur contient elle-même des TLV (imbrication).
- Longueur en entier variable **poids forts d'abord** : 7 bits par octet, bit `0x80` = « un octet suit ».
  ✅ 0 → `00`, 127 → `7F`, 128 → `81 00`, 16 383 → `FF 7F`, 16 384 → `81 80 00`.
- Entiers des valeurs : gros-boutistes.
- Étiquette `0x7F` (127) : code de résultat sur 4 octets. `100000` = succès ; 100001 échec, 100002 non pris en
  charge, 100003 permission refusée, 100004 occupé, 100005 format, 100006 paramètre, 100007 mémoire, 100008 délai,
  100009 erreur.
- Chiffrement d'un message : étiquettes `0x7C` (= 1, « chiffré »), `0x7D` (vecteur d'initialisation), `0x7E` (texte
  chiffré = les TLV d'origine sérialisés). AES-128-CBC + PKCS#7 pour les anciens modes ; **AES-GCM** quand la méthode
  de chiffrement (§4, étiquette 0x0C) vaut 1 ou en HiChain 3. IV = 12 octets aléatoires + compteur 32 bits qui part de
  la valeur donnée par la montre (paramètres de liaison) et repasse à 1 au maximum.

## 4. Paramètres du lien — service 1, commande 1 (première trame échangée, en clair)

Demande : étiquettes 1, 2, 3, 4 vides (✅ `linkParamsRequest`). Réponse :

| Étiquette | Sens |
|---|---|
| 1 | version du protocole (2) |
| 2 | taille maximale d'une tranche |
| 3 | taille maximale du lien (MTU) |
| 4 | intervalle de connexion |
| 5 | 18 octets : version d'authentification (2 octets) puis aléa de la montre (16 octets) |
| 7 | type de prise en charge → **mode d'authentification** : 0 classique, 1 ou 3 HiChain, 2 HiChain Lite, 4 HiChain 3 (GCM) |
| 8 | algorithme de dérivation (1 = PBKDF2, sinon HMAC) |
| 9 | état de liaison |
| 0x0C | méthode de chiffrement (1 = GCM) |

❓ Valeurs d'une GT 6 Pro : inconnues (aucun journal public). Hypothèse : type 1 ou 3 (HiChain), chiffrement GCM.
**C'est la première chose que le diagnostic de HealthTrack lit et exporte.**

## 5. Séquence de connexion (vue d'ensemble)

1. Ouvrir le transport (RFCOMM, ou BLE + abonnement à FE02).
2. Paramètres du lien (1/1).
3. Bluetooth classique seulement : état de l'appareil (1/0x16).
4. Authentification, selon le mode (§4, étiquette 7) :
   - **classique** : défi (1/0x13) = HMAC-SHA256 calculé sur les deux aléas avec une constante qui dépend de la version
     d'authentification ; puis paramètres de liaison (1/0x0F : numéro de série client, adresse du téléphone… ; la
     réponse dit « déjà lié » et donne le compteur de chiffrement) ; puis liaison (1/0x0E : clé de session aléatoire,
     chiffrée avec une clé dérivée de constantes et de l'adresse).
   - **HiChain Lite** : code PIN récupéré auprès de la montre (1/0x2C), défi dérivé du PIN, puis 1/0x0F et 1/0x0E.
   - **HiChain** (attendu pour la GT 6 Pro) : négociation de sécurité (1/0x33), PIN (1/0x2C) au premier
     appairage, puis échange HiChain (1/0x28) — §6.
5. Configuration : informations produit (1/7 : version matérielle, logicielle, numéro de série, modèle…), heure (1/5 :
   heure Unix sur 4 octets, fuseau sur 2), batterie (1/8), services et commandes pris en charge (1/2, 1/3).
6. Synchronisation des données (§7).

## 6. HiChain (résumé)

- Il s'agit du protocole d'authentification d'appareils de Huawei / OpenHarmony (« device auth »), variante **ISO** :
  échange symétrique fondé sur une clé pré-partagée, transporté en JSON dans la commande 1/0x28 (étiquette 1 = JSON,
  2 = code d'opération, 3 = identifiant de requête sur 8 octets).
- Deux opérations : **liaison** (première fois, fondée sur le PIN) et **authentification** (avec la clé longue durée
  obtenue à la liaison).
- Déroulé : échange d'aléas et d'un « sel » → clé pré-partagée = HMAC-SHA256 du sel avec (SHA-256 du PIN) ou la clé
  stockée → jetons croisés (HMAC sur aléas et identifiants) → clé de session par HKDF-SHA256 → en liaison, la montre
  renvoie, chiffrée en AES-GCM, la **clé longue durée** que le téléphone garde → clé de chiffrement des trames dérivée
  par HKDF.
- Aucun code n'est affiché sur la montre : le PIN est demandé à la montre (1/0x2C) puis déchiffré avec une constante.
- ⚠️ **Constantes d'application** : les modes classique / Lite / la lecture du PIN utilisent des constantes de 16 octets
  qui viennent de l'app Huawei. Elles sont publiées sous licence MIT dans [L], mais la consigne du propriétaire interdit
  de committer une clé extraite d'une app constructeur. **Décision à prendre à l'étape (c)** : ne pas les committer et
  les faire saisir / importer une fois sur le téléphone (stockage local), ou obtenir l'accord explicite du propriétaire.
  Le diagnostic (étape a) n'en a pas besoin.
- 📖 Une variante PAKE (SPEKE, X25519 / Ed25519) existe pour certaines Honor récentes, pas pour les Huawei GT [I #6472].

## 7. Données santé utiles (étape d)

| Service / commande | Contenu |
|---|---|
| 7/0x0A → 7/0x0B | nombre puis données **minute par minute** : chaque élément (étiquette imbriquée) porte un décalage en minutes et des octets précédés d'un masque de champs (pas, calories, distance, FC ; second masque : SpO₂, FC de repos) |
| 7/0x0C → 7/0x0D | nombre puis périodes de sommeil (version simple) |
| 7/0x03 | totaux du jour |
| 0x17/… | séances : nombre, totaux, données, allure, SpO₂ |
| 0x2C/01 → 07 | **téléchargement de fichiers** (version récente) : sommeil détaillé (TruSleep), intervalles RR (→ VFC, stress), GPS, « séquences » (phases de sommeil, score, VFC, température) |
| 0x0A/… | ancien téléchargement de fichiers |
| 0x37/… | « DataSync » (émotions, apnée, ECG, objectifs) |
| 0x19 | FC / RR en temps réel (test) |

Remarque : le stress n'est pas lu tel quel dans [G], il est recalculé à partir du fichier RR — HealthTrack sait déjà
calculer la VFC (RMSSD) depuis des RR (`src/devices/ble/heartRate.js`).

## 8. Contraintes d'appairage et « libération » de la montre

- Une montre n'accepte **qu'une app liée** à la fois. Si Huawei Santé refait la liaison, la clé gardée par une autre app
  devient invalide → « Authentication key negotiation failed » [W, I].
- Sorties documentées : **réinitialisation d'usine de la montre** puis appairage à la seule app voulue ; ou, pour garder
  Huawei Santé, fournir l'**identifiant de compte Huawei** (17 chiffres, PR #3721 ; envoyé en 0x1A/0x01 ou 0x1A/0x05).
- **Ne jamais dissocier la montre dans Huawei Santé** : ça invalide la clé sans libérer la montre.
- 📖 **Réinitialisation depuis la montre** (assistance Huawei fr-fr00737169) : Paramètres → Système et mises à jour →
  Réinitialiser (« Système → Réinitialiser » sur certains modèles) ; sur l'écran d'appairage, bouton du bas →
  Réinitialiser. Avec eSIM : laisser « Supprimer la configuration eSIM » décoché. Après redémarrage : écran d'appairage
  avec QR code (ne pas le scanner avec Huawei Santé). ❓ Verrou antivol / compte Huawei après réinitialisation : aucune
  source ne le mentionne pour les GT → à vérifier avec la montre du propriétaire.
- 📖 Appairage côté Android (pages d'appairage [W], issue #4941) : ne pas pré-appairer la montre dans les réglages
  Bluetooth ; l'app lance la liaison et l'utilisateur accepte la demande d'Android. Un ancien appairage Android doit être
  oublié d'abord (dans Android, jamais dans Huawei Santé). ❓ Adresse BLE = adresse classique ? Type de boîte Android ?
  Inconnu → l'assistant cherche en Bluetooth classique (`startDiscovery`) puis appelle `createBond`.
- 📖 **Identifiant de compte Huawei** (plan B) : `userId` du compte, 17 chiffres (19 acceptés depuis 2026, issue site
  #226) ; se lit dans le cookie `userId` de cloud.huawei.com (outils de développement du navigateur). Avec lui, la
  montre accepte une autre app sans réinitialisation, mais pas en même temps que Huawei Santé (lui retirer le Bluetooth).
- 📖 Statut Gadgetbridge de la GT 6 Pro (issue #5428, 0.88.0, déc. 2025) : « en grande partie pris en charge » (FC,
  SpO₂, stress, sommeil, séances). Un contributeur (issue #6271, juin 2026) utilise une GT 6 Pro jamais liée à Huawei
  Santé : la clé est négociée localement au premier appairage, sans service en ligne. ❓ Variante HiChain exacte : non
  publiée → le journal du propriétaire la donnera.
- PR #6367 (ouverte) : sessions HiChain en Bluetooth classique bloquées après une séparation montre / téléphone → prévoir
  une reprise propre.

## 9. Ce que HealthTrack implémente (et où)

| Étape | État | Code |
|---|---|---|
| (a) Diagnostic : trame, TLV, CRC, tranches, paramètres du lien, transports RFCOMM + BLE, export du journal | ✅ run 12/10 22:30 | `src/devices/huawei/protocol.js`, `transports.js`, `diagnostic.js`, `BtClassicPlugin.java`, `components/WatchDiagnostic.jsx` |
| (b) Détection et libération (boîte de désinstallation, réglages de l'app, guide de réinitialisation, plan B compte Huawei) + assistant d'appairage Android | ✅ run 13/10 00:30 | `src/devices/huawei/setup.js`, `components/WatchSetup.jsx`, `AppManagerPlugin.java`, `BtClassicPlugin.java` (`discover`, `pair`, `openBluetoothSettings`) |
| (c) Authentification (HiChain d'après le mode lu en (a)) + clés stockées en local | ☐ | — |
| (d) Synchronisation (§7) puis resynchro en arrière-plan | ☐ | — |
