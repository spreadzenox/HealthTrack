# Protocole des montres Huawei / Honor — spécification HealthTrack

> Rédigée **avec nos propres mots** à partir de sources publiques, pour réimplémenter le protocole sans jamais copier
> de code (décision du propriétaire : HealthTrack ne passe pas sous AGPL). Le code de HealthTrack
> (`app/src/devices/huawei/`) est écrit **à partir de ce document**, pas à partir des sources ci-dessous.
> Chaque fait porte son niveau de confiance : ✅ vérifié par un test / une trame de référence, 📖 lu dans une source,
> ❓ supposé, à confirmer par le journal de diagnostic de la GT 6 Pro du propriétaire, 🩺 **confirmé par le journal de
> la vraie GT 6 Pro du propriétaire** (`journal/diagnostics/`).

## Sources

| Réf. | Source | Licence | Usage |
|---|---|---|---|
| [L] | `github.com/zyv/huawei-lpv2` (Y. Zaytsev, 2019) — `huawei/protocol.py`, tests | MIT | trame, TLV, entiers variables, trame de référence |
| [G] | `codeberg.org/Freeyourgadget/Gadgetbridge`, commit d4bd8367 (12/10/2026), paquets `devices/huawei` et `service/devices/huawei` | **AGPL — lecture seule** | ordre des étapes, numéros de services / commandes / étiquettes |
| [OH] | `github.com/openharmony/security_device_auth` — protocole ISO (`services/protocol/src/iso_protocol/`, `services/legacy/authenticators/`) | Apache-2.0 | dérivations HiChain, codes de messages, identifiant de groupe |
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

🩺 **Valeurs réelles de la GT 6 Pro du propriétaire** (journal `2026-10-13-0904-gt6pro.json`, logiciel app 114) :
`protocolVersion` 2, `maxFrameSize` 1022, `maxLinkSize` 1011, `authVersion` **1**, `serverNonceLength` 16 (aléa de la
montre de 16 octets), `deviceSupportType` **4** → `authMode` « hichain3 » (**HiChain 3, chiffrement GCM**),
`authAlgo` absent, `bondState` **0** (non liée côté lien), `encryptMethod` **absent (null)**, `result` absent.
Étiquettes supplémentaires renvoyées : 13 = `00`, 15 = `01`, 16 = `00` (rôle à confirmer ; probablement des options de
lien HarmonyOS 6 — 15 pourrait être un drapeau de capacité). À noter : **le type vaut 4 mais l'étiquette 0x0C
(méthode de chiffrement) est absente** → c'est le type 4 qui impose GCM, pas l'étiquette 0x0C (voir §6.7, point ouvert
sur le PIN). C'est la première chose que le diagnostic de HealthTrack lit et exporte.

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

## 6. HiChain (authentification des GT 3 → GT 7)

Lecture du 13/10/2026 (run 02:30 Paris) : [G] (commit de master du 13/10, lecture seule, faits seulement) recoupé avec
**[OH]** `github.com/openharmony/security_device_auth` (Apache-2.0), protocole « ISO » (`iso_protocol_common.c`,
`iso_task_common.c`, `das_module_defines.h`). Les deux concordent sur chaque point ci-dessous.

### 6.1 Déroulé (téléphone = client)

1. Paramètres du lien (1/1), puis **état de l'appareil** (1/0x16, étiquette 1 vide ; réponse étiquette 1 : absente, 0
   ou 1 = on continue).
2. **Négociation de sécurité** (1/0x33, en clair). Mode demandé : 2 si le type de prise en charge (§4, étiquette 7)
   vaut 1, 2 ou 3 ; 4 s'il vaut 4. Étiquettes envoyées, dans l'ordre : 1 = mode ; 2 = `01` (« pas une reconnexion ») ;
   5 = identifiant du téléphone (32 caractères ASCII, §6.4) ; 3 = `01` ; 4 = `00` ; en mode 4 seulement 6 vide et
   7 = modèle du téléphone ; 0x0D = `01` si la méthode de chiffrement vaut 1. Réponse : étiquette 1 = 1 → type
   « 100000 » (HiChain) ; étiquette 2 = type (xor 4 si l'étiquette 1 valait 4) ; 0x7F = erreur. HiChain si type =
   100000 ou si type xor 1 ou type xor 2 vaut 4 ; HiChain Lite si type = 1 ou 2 (non pris en charge par HealthTrack).
3. **Premier appairage seulement** (aucune clé gardée pour cette montre) : **PIN** (1/0x2C, §6.3), puis échange
   **LIAISON** (code d'opération 1) qui donne la clé longue durée, puis aussitôt une **AUTHENTIFICATION** (code 2).
4. **Connexions suivantes** : AUTHENTIFICATION seule, avec la clé gardée. Pas de 1/0x13, 1/0x0F, 1/0x0E en HiChain.
5. Le choix liaison / authentification est **local** (la montre ne le dit pas). Si la montre refuse la clé gardée
   (jeton faux), c'est soit qu'une autre app l'a liée depuis (clé remplacée), soit un raté passager après une perte de
   portée ([G] PR #6367 : fermer la connexion, attendre ≈ 6 s, réessayer avec la même clé). HealthTrack réessaie une
   fois, puis propose de refaire l'appairage (PIN + liaison).
6. Délais : 30 s pour la 1re étape de la liaison (la montre peut demander une confirmation), 5–8 s sinon.

### 6.2 Messages 1/0x28 (en clair, découpables en tranches)

- Téléphone → montre : étiquette 1 = JSON (UTF-8), 2 = code d'opération (1 octet), 3 = identifiant de requête (8 octets
  gros-boutistes ; HealthTrack : l'heure en millisecondes, un nouveau par opération).
- Montre → téléphone : étiquette 1 = JSON, étiquette 4 = type (0 = JSON ; autre = message final de l'opération, texte
  non utilisé). `errorCode` non nul dans la charge utile = échec de l'étape.
- Enveloppe de chaque message du téléphone : `authForm` 0, `groupAndModuleVersion` "2.0.1", `message` (code ci-dessous),
  `payload` (objet, toujours avec `version` = {`minVersion` "1.0.0", `currentVersion` "2.0.16"}).
  - Liaison, en plus : `requestId` (décimal, en texte), `groupId`, `groupName` "health_group_name", `groupOp` 2,
    `groupType` 256, `peerDeviceId` et `connDeviceId` (identifiant du téléphone en clair), `appId`
    "com.huawei.health", `ownerName` "".
  - Authentification, étapes 1 et 2 : `isDeviceLevel` false.
- ✅ **`groupId`** = SHA-256 de « health_group_name|com.huawei.health » en hexadécimal majuscule (règle OpenHarmony
  des groupes pair à pair : nom du groupe, barre verticale, identifiant d'app) — vérifié égal à la valeur de [G] :
  **aucune constante à stocker**.
- Codes `message` : liaison 0x0001 → 0x8001, 0x0002 → 0x8002, 0x0003 → 0x8003, 0x0004 → message final ;
  authentification 0x0011 → 0x8011, 0x0012 → 0x8012, 0x0013 → message final (pas d'échange de clé).
- Charges utiles (octets toujours en **hexadécimal majuscule**, lecture insensible à la casse) :

| Message | Champs |
|---|---|
| téléphone, début | `isoSalt` (16 octets aléatoires = aléaTél), `peerAuthId` (§6.4), `operationCode`, `seed` (32 octets aléatoires), `peerUserType` 0 ; authentification : `pkgName` "com.huawei.devicegroupmanage", `serviceType` = groupId, `keyLength` 32 |
| montre, début | `isoSalt` (aléaMontre, 16 octets), `peerAuthId` (identifiant de la montre), `peerUserType`, `token` (32) |
| téléphone, jeton | `peerAuthId`, `token` (32) |
| montre, jeton | `returnCodeMac` (32) |
| téléphone, échange (liaison) | `nonce` (12), `encData` (défi de 16 octets chiffré + étiquette 16) |
| montre, échange (liaison) | `nonce` (12), `encAuthToken` (clé longue durée 32 octets chiffrée + étiquette 16) |
| téléphone, confirmation | `nonce` (12), `encResult` (4 + 16), `operationCode` |

### 6.3 Calculs (HMAC = HMAC-SHA256 ; HKDF = RFC 5869 SHA-256 ; GCM = AES-256-GCM, étiquette 16 octets en fin)

1. **Clé de base** : liaison = SHA-256 du texte « PIN en hexadécimal majuscule » (les octets du PIN déchiffré, écrits
   en hexadécimal, pris comme caractères ASCII) ; authentification = la clé longue durée (32 octets).
2. **PSK** = HMAC(clé de base, `seed`).
3. Jeton attendu de la montre = HMAC(PSK, aléaMontre ‖ aléaTél ‖ idTél ‖ idMontre). Différent → PIN ou clé faux.
4. Jeton du téléphone = HMAC(PSK, aléaTél ‖ aléaMontre ‖ idMontre ‖ idTél).
5. `returnCodeMac` attendu = HMAC(PSK, 4 octets nuls).
6. **Clé de session** = HKDF(PSK, sel = aléaTél ‖ aléaMontre, info = « hichain_iso_session_key », 32 octets).
7. Liaison : `encData` = GCM(clé de session, nonce aléatoire 12, AAD = « hichain_iso_exchange », défi aléatoire 16) ;
   la réponse `encAuthToken` se déchiffre en GCM avec la clé de session, le nonce de la montre et **AAD = le défi** →
   **clé longue durée** (32 octets), gardée sur le téléphone.
8. Confirmation : `encResult` = GCM(clé de session, nouveau nonce 12, AAD = « hichain_iso_result », 4 octets nuls).
9. **Clé des trames** (après l'authentification seulement) = HKDF(clé de session, sel = aléaTél ‖ aléaMontre, info =
   « hichain_return_key », 32 octets). Valable pour cette connexion, jamais gardée.

**PIN (1/0x2C, premier appairage)** : demande = étiquette 1 vide ; réponse : 1 = PIN chiffré, 2 = IV. Déchiffrement
AES-GCM (sans AAD) si la méthode de chiffrement vaut 1, sinon AES-CBC + PKCS#7, **avec une constante de 16 octets de
l'app Huawei** choisie selon la version d'authentification (§4) : v1 pour 1 et 4, v2 pour 2, v3 pour 3 et plus.

⚠️ **Constantes « digest secret » v1 / v2 / v3** : publiées sous licence MIT par [L] (`DIGEST_SECRETS` de
`huawei/protocol.py`), mais extraites à l'origine de l'app Huawei → **jamais dans le dépôt**. HealthTrack les
télécharge **sur le téléphone, d'un geste de l'utilisateur**, depuis le fichier de [L] (ou les fait coller), et les
garde en local. Elles ne servent qu'au premier appairage ; la connexion de tous les jours n'utilise que la clé longue
durée obtenue alors.

### 6.4 Identifiants

- **Identifiant du téléphone** : 16 octets aléatoires écrits en 32 caractères hexadécimaux majuscules, tiré une fois
  par montre et **gardé** (la confiance de la montre y est attachée). Octets bruts (HMAC, 1/0x33 étiquette 5) = les 32
  caractères ASCII ; champ JSON `peerAuthId` = hexadécimal majuscule de ces 32 octets (64 caractères) ;
  `peerDeviceId` / `connDeviceId` = les 32 caractères tels quels. Ni l'Android ID ni une adresse réelle.
- **Identifiant de la montre** = octets obtenus en décodant son `peerAuthId` (contenu ❓).

### 6.5 Chiffrement des trames ensuite (§3)

- AES-**GCM** (sans AAD) si la méthode de chiffrement vaut 1 **ou** le type de prise en charge vaut 4 ; sinon AES-CBC
  + PKCS#7. Clé = clé des trames (32 octets → AES-256).
- IV de 16 octets : type 4 → 16 octets aléatoires ; sinon 12 aléatoires + compteur 32 bits gros-boutiste, incrémenté
  avant chaque envoi, qui part de 0 en HiChain (1er IV = 1) et repasse à 1 après 0xFFFFFFFF.
- Restent en clair : 1/0x01, 0x16, 0x33, 0x2C, 0x28, 0x13, 0x0F, 0x0E. Une réponse est déchiffrée dès que 0x7C vaut 1.

### 6.6 Compte Huawei (plan B) et cas connus

- Après l'authentification, l'identifiant de compte se donne en 0x1A/0x05 : étiquette 1 = identifiant (texte, ou un
  octet nul si aucun), étiquette 3 = `01` si la montre annonce l'« optimisation d'appairage multi-comptes » (❓ comment
  le savoir : à lire à l'étape d).
- GT 6 Pro (ATM-B29, logiciel 6.00.165) : même chemin que la GT 5, rien de spécifique à l'authentification [I #5428].
- Après une mise à jour majeure de la montre, la clé gardée peut être refusée : refaire PIN + liaison [I #6978].
- La variante PAKE (SPEKE / STS) ne concerne que des Honor [I #6472].

### 6.7 HiChain 3 (authMode 4) et diagnostic du journal GT 6 Pro (13/10)

Relecture du 13/10/2026 (run 11:04 Paris) à partir du **journal de la vraie GT 6 Pro** du propriétaire
(`journal/diagnostics/2026-10-13-0904-gt6pro.json`, expurgé : ni clé, ni PIN, ni adresse complète ; seules les tailles
et en-têtes des trames y figurent).

**Déroulé observé, trame par trame** (tout en clair jusqu'à l'échec ; service 1 partout) :

| # | Sens | Taille | Service / cmd | Rôle (§5–6) | Résultat |
|---|---|---|---|---|---|
| 1 | → | 16 | 1/0x01 | demande des paramètres du lien | ok |
| 2 | ← | 58 | 1/0x01 | paramètres du lien (→ §4, hichain3) | ok |
| 3 | → | 10 | 1/0x16 | demande d'état de l'appareil | ok |
| 4 | ← | 11 | 1/0x16 | état = 1 (continuer) | ok |
| 5 | → | 65 | 1/0x33 | négociation de sécurité (mode 4) | ok |
| 6 | ← | 137 | 1/0x33 | réponse : HiChain accepté | ok |
| 7 | → | 10 | 1/0x2C | demande du PIN | ok |
| 8 | ← | 108 | 1/0x2C | PIN chiffré + IV (déchiffré : 64 octets) | ok |
| 9 | → | 695 | 1/0x28 | **liaison, message de début** (§6.2) | envoyé |
| 10 | ← | 835 | 1/0x28 | réponse de la montre | **illisible côté HealthTrack** |

🩺 **Ce que le journal établit** : la montre parle bien **HiChain 3** (`deviceSupportType` 4, GCM), **authVersion 1**,
`serverNonceLength` 16. La négociation (0x33) réussit, le PIN (0x2C) est reçu. L'appairage échoue au **traitement de
la réponse 0x28 reçue (835 octets)** après l'envoi du message de début (695 octets) : HealthTrack n'a pas su décoder
cette réponse (« Réponse HiChain illisible »), **sans code de résultat 0x7F** (d'où le « code ? »).

**Rôle des frames d'authentification** (consolidé, §6.1–6.2) :
- **1/0x01** paramètres du lien : annonce `authMode`, `authVersion`, l'aléa de la montre, la taille des trames.
- **1/0x16** état de l'appareil : la montre dit si on peut poursuivre (étiquette 1 = 0 ou 1).
- **1/0x33** négociation de sécurité : le téléphone propose le mode (4 pour hichain3) et son identifiant ; la montre
  confirme le schéma.
- **1/0x2C** PIN : au premier appairage, la montre renvoie un PIN chiffré (clé = constante « digest secret », §6.3).
- **1/0x28** HiChain proprement dit : suite de messages JSON (début → jeton → échange → confirmation), chacun avec
  étiquette 1 = JSON, 2 = code d'opération, 3 = identifiant de requête (§6.2).

**Pourquoi la réponse 0x28 est-elle illisible ? (diagnostic)** — Ce qu'on peut écarter avec le journal seul :
- **Pas un découpage en tranches** : 835 < `maxLinkSize` (1011), la réponse tient dans une trame entière (en-tête
  « 1/0x28 », pas de tranche). Le réassembleur n'est pas en cause.
- **Pas un corps chiffré** : les messages 0x28 sont en clair (pas d'étiquette 0x7C) ; ce n'est pas un problème de clé
  de trame (la clé de trame n'existe qu'après l'authentification).
- **Pas un code d'erreur 0x7F** : il n'y en avait pas (« code ? »), donc la montre n'a pas répondu « refusé N ».

Hypothèses restantes, par ordre de vraisemblance :
1. 📖❓ **Format « New Auth Protocol » (HiChain 3) plus riche que l'ISO** que HealthTrack implémente (§6.2). Une réponse
   de début ISO (isoSalt 16 + peerAuthId + peerUserType + token 32, en JSON hexadécimal) pèse ~250–350 octets ; **835
   octets, c'est beaucoup plus**. HiChain 3 peut transporter en plus du matériel signé (certificat / clé publique de la
   montre, signature), ce qui gonflerait la réponse et changerait sa structure (étiquette 1 pas forcément du JSON, ou
   JSON avec d'autres champs). C'est l'hypothèse la plus probable vu la taille.
2. ❓ **Étiquette 1 présente mais pas du JSON attendu** (autre sérialisation, préfixe binaire, ou JSON tronqué par un
   champ non prévu). L'analyseur amélioré (ci-dessous) dira lequel.
3. ❓ **Étiquette 1 absente**, l'information étant portée par d'autres étiquettes propres à HiChain 3.

**Point tranché (run 13/10 14:30) — le PIN se déchiffre bien en CBC pour cette montre.** On avait noté un doute : la
montre est type 4 mais n'a pas renvoyé l'étiquette 0x0C (`encryptMethod` null) et `decryptPin` déchiffre alors en CBC.
La relecture de la logique de référence (recherche du 13/10 14:30, [G] `HuaweiCrypto.decryptPinCode`) lève le doute :
📖 **le choix GCM / CBC du PIN dépend uniquement de `encryptMethod` (0x0C) — GCM si 1, CBC sinon —, jamais du type de
prise en charge.** Comme la GT 6 Pro ne renvoie pas 0x0C, c'est **CBC**, exactement ce que fait déjà `decryptPin`.
Rien à changer de ce côté : la clé du PIN reste la constante « digest secret » v1 (v1 pour authVersion 1 et 4). Le
chiffrement des **trames** (§6.5) a sa propre règle (GCM si type 4), sans rapport avec le PIN. L'échec actuel est bien
**en aval**, au décodage de la réponse de début (§6.8), pas au PIN.

**Ce que le prochain journal apportera** (analyseur amélioré, §9 étape a bis) : chaque réponse 0x28 est désormais
**analysée sans secret** et consignée dans le journal exporté, sous `report.hichain` : classification
(`json_ok` / `json_unparsable` / `no_payload` / `result_error` / `final` / `empty`), `message` (code hexadécimal),
`errorCode`, `resultCode`, `type`, liste des étiquettes et de leur taille, **noms** des champs JSON (`payloadKeys`,
jamais leurs valeurs) et, si l'étiquette 1 n'est pas du JSON, ses **premiers octets** en hexadécimal. Pour la trame de
835 octets, cela dira immédiatement si c'est le cas 1, 2 ou 3 ci-dessus. L'écran nomme aussi l'étape et la raison
exacte (« l'étiquette 1 (835 octets, débute par …) n'est pas du JSON »).

**Instrument renforcé (run 13/10 14:30) — révéler les champs de la réponse HiChain 3.** Comme le journal a établi que
l'étiquette 1 de la réponse de 835 octets **n'est pas du JSON** (le code v114 ne pouvait lever « illisible » qu'au
`JSON.parse` de l'étiquette 1, sans code de résultat), `inspectHichainReply` **sonde maintenant la structure** d'une
réponse non-JSON, sans jamais rendre de valeur (champ `structure`) :
- **JSON intégré** : si un objet JSON est noyé derrière un préfixe binaire ou dans une autre étiquette, on en rend
  l'`offset`, le `message` (code hexadécimal) et les **noms** des champs (`keys`, `payloadKeys`) — jamais les valeurs.
  C'est ce qui révèlera au prochain journal les champs SPEKE de la réponse (`challenge`, `salt`, `epk`, `kcfData`,
  `exAuthInfo`… voir §6.8).
- **TLV imbriqués** : si les octets sont une suite de TLV, on rend la liste `{étiquette, taille}`.
- L'en-tête (`head`) passe de 12 à **32 octets**, et l'écran nomme les champs repérés (« champs repérés : challenge,
  epk, salt »). Si la charge utile est portée par une autre étiquette que la 1, elle est sondée de la même façon.

**Instrument renforcé (run 13/10 18:30) — la taille de chaque champ, pour décoder d'un seul journal.** Nommer les
champs ne suffit pas à écrire le décodeur : il faut savoir **combien d'octets** fait chacun (une clé publique X25519 =
32, un `salt` / `challenge` = 16, une signature Ed25519 = 64…). `probeStructure` ajoute donc, à côté de `payloadKeys`,
deux listes **de tailles seulement** (`fields` pour l'objet entier, `payloadFields` pour le `payload`) : pour chaque
champ, sa taille **en octets** si sa valeur est un hexadécimal, en caractères si c'est une autre chaîne, sinon son type
(`number`, `bool`, `object`…). **Jamais la valeur** — une taille n'est pas un secret, au même titre que `jsonLength`
ou `tag/size` déjà consignés. L'écran et le journal affichent désormais « champs repérés : challenge (16 o), epk (32 o),
salt (16 o) ». Avec cela, le run qui recevra le prochain journal pourra mapper chaque champ sur son rôle SPEKE (§6.8)
**sans second aller-retour** : noms + tailles + code de message suffisent à écrire l'assemblage. Testé sur la fausse
montre « New Auth » et sur une réponse d'exemple (challenge / salt 16, epk 32, signature 64, `version` en clair), avec
une vérification qu'aucune valeur ne fuit dans le journal.

## 6.8 HiChain 3 « New Auth Protocol » (SPEKE / STS) — plan de décodage

> ⚠️ **Corrigé le 13/10 20:30 (§6.9)** : le journal de 17:03 montre que la GT 6 Pro répond en **ISO classique**
> (isoSalt / token), pas en SPEKE. Ce paragraphe reste valable comme référence pour les Honor (PAKE) uniquement.

Recherche du 13/10/2026 (run 14:30 Paris) dans [G] (lecture seule, faits seulement ; la couche PAKE y est attribuée en
commentaire au code OpenHarmony `base/security/device_auth`, Apache-2.0 [OH]) et recoupée avec [OH]. **Aucun code
copié.** Ce qui suit est le **modèle structurel** de la famille « New Auth Protocol », à confirmer sur la GT 6 Pro par
le prochain journal (les champs exacts de la variante Huawei sont encore ❓).

**🩺 Fait de cadrage majeur** : dans Gadgetbridge, la couche PAKE (`supportsHiChainPake()`) est activée **uniquement
pour des Honor** (Watch 5 / 5 Pro / 6). Les coordinateurs **Huawei GT 6 (Pro) et GT 7** héritent du défaut `false` :
quand la négociation annonce HiChain ou HiChain 3, le code Huawei repart vers l'**ISO** (`GetHiChainRequest`). **Même
Gadgetbridge ne sait donc pas encore décoder la réponse de début de la GT 6 Pro** : il l'envoie au parseur ISO, d'où
le même blocage que nous. C'est un travail de frontière, pas un retard de notre côté. [G : `HuaweiCoordinator.java`,
`huaweiwatchgt6/HuaweiWatchGT6Coordinator.java`, `honorwatch6/HonorWatch6Coordinator.java`, `HuaweiSupportProvider.java`]

**Pourquoi 835 octets** : la réponse « New Auth » transporte du matériel d'identité **signé** (clé publique + signature
Ed25519) que l'ISO n'a jamais eu. Un StepOne ISO (isoSalt 16 + peerAuthId + peerUserType + token 32, en JSON
hexadécimal) pèse ~250–350 octets ; 835 est cohérent avec epk (32) + salt (16) + challenge (16), le tout en
hexadécimal, plus un bloc d'identité signé.

**Algorithme** [G `HiChainPakeUtils.java`, attribué à [OH]] :
- **PAKE = SPEKE**. Deux variantes : **EC-SPEKE sur X25519 / Curve25519** (RFC 7748, `epk` de 32 octets) ou
  **DL-SPEKE** modulaire (groupes Oakley 14 / 15, 2048 / 3072 bits). Le point de base vient d'un *hash-to-curve*
  (Elligator2 sur Curve25519) de la clé dérivée du PIN.
- Hachage SHA-256, dérivation **HKDF-SHA256**, preuves **HMAC-SHA256**, identités **Ed25519** (RFC 8032, pré-haché
  SHA-256), échange chiffré **AES-128-GCM** (IV de 12 octets en préfixe, étiquette 128 bits).
- Chaînes d'info HKDF (ASCII, [OH]) : `hichain_speke_base_info` (clé du mot de passe depuis le PIN + sel),
  `hichain_speke_sessionkey_info` (clé de session + clé de preuve `kcfKey`), `hichain_return_key`,
  `hichain_tmp_auth_enc_key` (clé temporaire de reconnexion). AAD d'échange : `hichain_exchange_request` /
  `hichain_exchange_response`.
- Preuve : `kcfData = HMAC-SHA256(kcfKey, défiSoi ‖ défiPair)`, vérifiée sur `défiPair ‖ défiSoi`.

**Messages (réponse = requête | 0x8000)** [G `GetHiChainPakeRequest.java`, `DeviceConfig.HiChain.Response`] :
- Liaison (operationCode 1) : **1** début `{challenge, epk, salt?, serviceType:"WEAR_MBB", operationCode, version}`
  → **0x8001** `{challenge, salt, epk}` ; **2** confirmation `{challenge, epk, kcfData}` → **0x8002** `{kcfData}` ;
  **3** échange `{exAuthInfo}` → **0x8003** `{exAuthInfo}` — `exAuthInfo` = GCM( `{authId, authPk}` JSON ‖ signature
  Ed25519 de 64 octets ), c'est ce bloc qui gonfle la trame.
- Reconnexion (STS, operationCode 2) : **0x11** `{challenge, epk, serviceType, peerAuthId, keyLength:32}` →
  **0x8011** `{challenge, epk, salt, nonce}` ; **0x12** `{challenge, epk, kcfData}` → **0x8012** `{kcfData}`.
- La négociation 0x33 peut renvoyer un type de paire (étiquette 2 : 1 = premier appairage, 2 = reconnexion).

**Cadre d'incertitude** : chez Honor, tout est enveloppé dans un TLV MBB (étiquette 1 = type de données, 2 = charge) et
l'appairage **commence par un échange de clés X25519 brut** avant le moindre JSON. **Notre capture est différente** :
la GT 6 Pro reçoit notre StepOne **ISO en clair** et répond 835 octets dont l'étiquette 1 n'est pas du JSON. La variante
Huawei expose peut-être ses champs (challenge/salt/epk, ou un `exAuthInfo` chiffré) **autrement** que le modèle Honor.
**Il faut voir les noms de champs réels** : c'est précisément ce que l'instrument renforcé (§6.7) rapportera au prochain
journal.

**Primitives prêtes (run 13/10 16:30)** : X25519 (multiplication scalaire sur un point **quelconque** — indispensable
au SPEKE, dont la base est dérivée du PIN — ECDH, paire de clés) et Ed25519 (signature / vérification / clé publique)
sont dans `crypto.js`, sur **@noble/curves** (MIT, audité), vérifiées sur les vecteurs RFC 7748 §5.2 / §6.1 et RFC 8032
§7.1. Choix de @noble plutôt que Web Crypto : `crypto.subtle` ne sait faire X25519 que sur la base standard (pas de
multiplication sur point dérivé), et @noble marche à l'identique quelle que soit la version de la WebView de l'A56.
HKDF-SHA256, HMAC-SHA256, AES-128-GCM existaient déjà. **Volontairement non ajouté : Elligator2 (hash-to-curve)** — la
forme exacte du *map-to-point* de la variante Huawei n'est pas documentée publiquement ; l'implémenter à l'aveugle
serait un pari. @noble expose `_map_to_curve_elligator2_curve25519` si le besoin se confirme au prochain journal.

**Prochaine étape, une fois les champs connus** (run suivant) : à partir des primitives ci-dessus et de cette spec,
assembler le StepOne SPEKE (X25519 d'abord, le plus probable vu `epk` 32 octets), les preuves `kcfData` (HMAC-SHA256),
puis l'échange d'identité Ed25519 chiffré GCM. Tests sur trames d'exemple à chaque étape, fausse montre « New Auth »
étendue. Point ouvert : le PIN → point de base SPEKE (Elligator2) et la signature « pré-hachée SHA-256 » (§6.8) restent
à confirmer sur la montre réelle.

Sources de cette section : [G] fichiers `service/devices/huawei/HiChainPakeUtils.java`,
`.../requests/GetHiChainPakeRequest.java`, `.../requests/GetHiChainRequest.java`, `.../requests/GetSecurityNegotiationRequest.java`,
`devices/huawei/HuaweiCrypto.java`, `devices/huawei/packets/DeviceConfig.java`, `devices/huawei/HuaweiCoordinator.java`,
`devices/huawei/huaweiwatchgt6/HuaweiWatchGT6Coordinator.java` (cite l'issue [I] #5428), `.../huaweiwatchgt7/…` (#6731) ;
[OH] `base/security/device_auth` (modules `PakeTask`, `KeyManagerImpl`, `BlockCipherUtils`, `crypto_hash_to_point.c`),
à vérifier directement ; [I] PR #6367 (reprise d'authentification sur transport BR). Contrôlé par un agent de recherche
qui n'a rapporté que des faits.

## 6.9 Journal réel du 13/10 17:03 (app v118) : la réponse est de l'**ISO classique** + un octet de fin

Analyse du run « idées » du 13/10 20:30 Paris, sur `journal/diagnostics/2026-10-13-1703-gt6pro.json` (app **v118** = la
version qui contient l'instrument des runs 14:30 et 18:30 ; aucun correctif de décodage n'a été livré après la v118,
donc ce journal reflète bien le code actuel de main).

**Comparaison avec le journal de 09:04 (v114)** : déroulé **identique à l'octet près** — mêmes 10 trames, mêmes
tailles (16/58, 10/11, 65/137, 10/108, **695 → 835**), mêmes paramètres du lien (`deviceSupportType` 4, authVersion 1,
`serverNonceLength` 16), même échec à l'étape « bind ». La montre est donc stable et reproductible ; seule la
**lisibilité du journal** a changé (v114 : « illisible (code ?) » ; v118 : en-tête, noms et tailles des champs).

**Ce que dit la réponse (trame 10, étiquette 1 = 805 octets)** :

| Niveau | Champs (taille) |
|---|---|
| enveloppe | `appId` (17 car. = « com.huawei.health »), `authForm` 0, `connDeviceId` (32 o), `groupAndModuleVersion` (5 car.), `groupId` (32 o), `groupName` (17 car.), `groupOp`, `groupType`, **`message` = 0x8001**, `ownerName` (vide), `peerDeviceId` (32 o), `requestId` (13 car.) |
| `payload` | **`isoSalt` (16 o)**, `operationCode`, **`peerAuthId` (64 o)**, `peerUserType`, **`token` (32 o)**, `version` (objet) |

🩺 **Conclusion 1 — ce n'est pas le « New Auth Protocol »** (hypothèse des runs 11:04 → 18:30, §6.7–6.8, **réfutée**) :
pas d'`epk`, de `salt`/`challenge` SPEKE ni de signature. C'est exactement la **réponse de début ISO** de §6.2 :
`message` 0x8001 = réponse à notre 0x0001, aléa de la montre `isoSalt` (16 o), son identité `peerAuthId`, et son jeton
`token` = HMAC-SHA256 (32 o) que `runHichain` sait déjà vérifier (`watchToken`, §6.3). La GT 6 Pro annonce « HiChain 3 »
(`deviceSupportType` 4 → mode de négociation 4, GCM) mais **parle ISO pour la liaison** — ce qui concorde avec le
constat du §6.8 : Gadgetbridge envoie la GT 6 / GT 7 vers l'ISO (`supportsHiChainPake()` faux pour elles). L'estimation
« un StepOne ISO pèse ~250–350 octets » du §6.8 était fausse : elle oubliait l'enveloppe de groupe (groupId,
peerDeviceId, connDeviceId : 3 × 64 caractères).

🩺 **Conclusion 2 — la cause exacte de l'échec : un octet en trop après le JSON.** En reconstituant un JSON avec ces
noms et ces tailles (`version` = `{"minVersion":"1.0.0","currentVersion":"2.0.16"}`, comme le nôtre), on obtient
**804 caractères** ; l'étiquette 1 en fait **805**. L'objet JSON se termine donc 1 octet avant la fin : très
probablement un **NUL terminal** (chaîne C sérialisée avec son `\0`), éventuellement un saut de ligne. Preuve
interne au journal : `findEmbeddedJson` (diagnostic, accolades équilibrées) analyse sans erreur l'objet à
l'**offset 0**, alors que `JSON.parse` sur l'étiquette entière échoue (`classification: json_unparsable`). JavaScript
refuse tout caractère après la valeur JSON ; le `org.json` d'Android, utilisé par Gadgetbridge, lit le premier objet
et **ignore la suite** — ce qui explique que le même octet ne gêne pas Gadgetbridge.

**Correctif (livré le 13/10 22:30, voir §6.10)** — `src/devices/huawei/hichain.js` :
1. Une fonction unique `decodeHichainJson(bytes)` utilisée **partout** où l'étiquette 1 est lue (`inspectHichainReply`,
   `parseHichainReply` y compris la branche `final` et le `JSON.parse` de fin) : décoder en UTF-8, **retirer les NUL et
   blancs de fin** ; si `JSON.parse` échoue encore, retomber sur l'objet à accolades équilibrées **à l'offset 0
   uniquement** (lecture tolérante façon `org.json`), et consigner dans `inspection` un indicateur `trailingBytes`
   (nombre d'octets ignorés, jamais leur valeur).
2. Tests sur trame d'exemple : JSON ISO 0x8001 de **804 caractères + `0x00`** (champs aux tailles du journal :
   isoSalt 16 o, peerAuthId 64 o, token 32 o, enveloppe de groupe) → `classification: json_ok`, `payload.isoSalt` lu,
   `trailingBytes: 1` ; variantes `\n`, `\0\0`, et un vrai non-JSON qui reste `json_unparsable`.
3. Fausse montre (`testing/fakeWatch.js`) : option « JSON + NUL terminal » sur **toutes** ses réponses 0x28 →
   le parcours `runHichain` complet (0x8001 → 0x8002 → 0x8003 → 0x8004) passe de bout en bout.
4. Relecture du libellé d'erreur : retirer « probable New Auth Protocol » quand les champs sont ceux de l'ISO
   (`isoSalt` + `token`) ; garder la piste SPEKE (§6.8) seulement si `epk`/`salt`/`challenge` apparaissent.
5. Rien d'autre ne change côté envoi : notre message de 695 octets (sans NUL) a été **accepté** par la montre (elle a
   répondu 0x8001, pas une erreur) → ne pas ajouter de NUL à nos envois.

**Prochaine embûche probable** (à rendre lisible dans le journal dès ce correctif) : la vérification du `token` de la
montre (`token_mismatch` = dérivation PIN → clé de base, §6.3, ou ordre des identifiants dans le HMAC ; `peerAuthId`
de la montre fait 64 o, le nôtre 32 o). Le journal doit dire « jeton différent » distinctement d'une erreur de format.
Les primitives X25519 / Ed25519 (c bis) restent utiles si une autre montre (Honor) parle vraiment SPEKE.

## 6.10 Livré le 13/10 22:30 : lecture tolérante + diagnostic du jeton

**Lecture** — `decodeHichainJson(octets)` est la seule porte d'entrée de l'étiquette 1 d'une réponse 0x28 (analyse
`inspectHichainReply`, décodage `parseHichainReply`, message final). Règle : décoder en UTF-8 ; l'étiquette doit
**commencer** par `{` ; on prend l'objet à accolades équilibrées (en respectant chaînes et échappements) qui part de
l'offset 0, on l'analyse en JSON strict, et tout ce qui suit est ignoré et **compté** (`trailingBytes`, jamais la
valeur). Un JSON qui ne commence pas à l'offset 0 reste « illisible » (piste d'un vrai autre format, §6.8, analysée
par le diagnostic structurel). Le texte d'un message final est rendu sans NUL / blancs de fin.

**Jeton de la montre** (`token` de la réponse 0x8001) — si la référence (§6.3) ne le reproduit pas :
1. *Clé de base de la liaison*, variantes essayées dans l'ordre : SHA-256 du PIN en hex majuscule (référence),
   en hex minuscule, SHA-256 des octets bruts du PIN, PIN brut, et — si le PIN est déjà du texte imprimable
   contenant des minuscules — SHA-256 de ce texte en majuscules. La première qui reproduit le jeton est **retenue**
   pour toute la suite de la liaison (jeton du téléphone, clé de session), et son nom est écrit dans le journal.
   Motif : le journal réel annonce un PIN de **64 octets** (pas 6 chiffres) : sa forme exacte n'est pas certaine.
2. Sinon, pour chaque clé de base, 3 autres ordres de concaténation (aléas inversés, identifiants inversés, ordre du
   jeton du téléphone) sont essayés **pour nommer** la combinaison dans l'erreur (`tokenCheck.matched`), sans
   poursuivre (le calcul en miroir côté téléphone serait une supposition).
3. `report.tokenCheck` = `{ matched, tried, variants, sizes: { idSelf, idPeer, randSelf, randPeer, seed } }` : noms et
   tailles seulement. À la liaison, un jeton différent mène à l'issue « failed » (journal à transmettre), plus à
   « PIN refusé » : la montre a bien remis un PIN et répondu 0x8001, l'écart vient plus probablement de notre calcul.

## 6.11 Recoupement complet de l'appairage (run « idées » du 14/10 08:30)

Lecture seule de [G] master `bb7a1e83a2` (13/10/2026), faits seulement, rédigés avec nos mots ; la logique ISO de [G]
n'a pas changé depuis 09/2024. Objet : vérifier, **avant** le prochain journal, les étapes qui suivent la réponse
0x8001, pour que la prochaine embûche soit lisible du premier coup.

| Point | [G] | HealthTrack | Verdict |
|---|---|---|---|
| Chiffrement du PIN (1/0x2C) | GCM si méthode de chiffrement = 1, sinon CBC + PKCS#7 ; le type d'appareil 4 **ne compte pas** ici | idem (`decryptPin`) | ✅ |
| Forme du PIN | octets opaques, longueur jamais vérifiée | idem ; 64 octets sur la GT 6 Pro | ✅ normal |
| Clé de base de la liaison | SHA-256 du texte hex **majuscule** des octets du PIN, même si ces octets sont déjà du texte | référence = 1re variante | ✅ |
| Identifiants | téléphone : 32 caractères hex majuscules, octets ASCII ; JSON `peerAuthId` = hex de ces 32 octets ; montre : `peerAuthId` décodé de l'hex | idem (§6.4) | ✅ |
| Jetons, `returnCodeMac`, clé de session, AAD (exchange / défi / result), clé des trames | §6.3 | idem | ✅ |
| Fin de liaison | réponse à étiquette 4 non nulle → authentification enchaînée aussitôt | idem | ✅ |
| Authentification | codes 0x11 → 0x13 (l'étape 3 est sautée), nouvel identifiant de requête, `pkgName` / `serviceType` / `keyLength`, `isDeviceLevel` false, clé de base = clé longue durée brute | idem | ✅ |
| Trames ensuite | GCM si méthode = 1 **ou** type 4, IV aléatoire de 16 octets | idem (`createCipher`) | ✅ |
| Après l'authentification | infos produit → heure → batterie → services pris en charge → services dynamiques, dont l'**identifiant de compte Huawei** | compte envoyé seulement s'il est saisi (plan B) | ⚠️ à surveiller |
| Modèles | aucun cas particulier GT 6 / GT 6 Pro / GT 7 ; SPEKE seulement pour Honor Watch 5 / 5 Pro / 6 (PR #6472) | ISO | ✅ |

Retours récents ([G] Codeberg) : #6731 (09/2026) une GT 7 s'appaire avec le type « GT 6 (Pro) » **et** l'identifiant de
compte Huawei ; #6978 (07/10/2026) clé gardée refusée sous HarmonyOS 7 → refaire la liaison résout (clé remplacée par
une autre app) ; PR #6367 (ouverte) refus ponctuel d'une clé valide → fermer le canal, attendre, réessayer, sans
reconnexion agressive ; #4193 (corrigé 11/2025) : sans l'indicateur « premier appairage », l'app tente
l'authentification au lieu de la liaison et n'aboutit jamais. Arrière-plan : PR #6905 (02/10/2026) relance après que
le système a tué le processus ; PR #6823 (23/09/2026) appairage « compagnon » des montres classiques déjà appairées.

**Conséquences pour le code (I63)** : aucune correction de calcul à faire à l'aveugle. Rendre distinctes dans le
journal les erreurs des étapes 2 à 4 (aujourd'hui « Code de retour de la montre invalide » mélange réponse finale
inattendue et `returnCodeMac` faux ; « La montre n'a pas remis de clé » et l'échec de déchiffrement GCM ne disent pas
quel champ manquait), consigner `errorCode` / `trailingBytes` de chaque réponse, et si la montre se tait ou coupe
juste après l'authentification, proposer l'identifiant de compte Huawei.

## 6.12 Fin d'association côté montre (run du 14/10 10:30, après les captures du propriétaire)

🩺 **Constat (captures du 14/10 ≈ 09:35, app v123)** : tout passe côté téléphone (lien, HiChain 3 GCM version 1,
négociation, authentification, échange chiffré, batterie 86 %), mais **la montre reste sur son écran d'accueil**
« Association — scannez le QR code pour télécharger l'app Santé… ajoutez cette HUAWEI WATCH », puis affiche
« Échec de l'association ». La lecture des mesures rend « 0 minute, 1 nuit → 0 mesure ». La montre ne se considère donc
pas liée : la clé est bien négociée, mais **l'app compagnon n'a pas joué la phase de configuration qui suit**.
Tant que la montre est sur cet écran, elle n'enregistre très probablement rien.

Lecture seule de [G] master `bb7a1e83a2` (13/10/2026), faits seulement, rédigés avec nos mots :

- 📖 [G] n'a **aucun message « appairage terminé »** : après l'authentification, la même file de messages part au premier
  appairage et aux reconnexions. Seuls trois messages ont un rôle d'association : **1/0x3E**, **1/0x30** et **0x1A/0x05**.
  HealthTrack n'en envoyait aucun (0x1A/0x05 seulement si un identifiant de compte était saisi).
- 📖 La montre peut aussi **demander les informations du téléphone** (1/0x10) à tout moment après l'authentification ; [G]
  y répond toujours. HealthTrack ignorait ce message (« message spontané »). Une montre qui attend cette réponse peut
  plausiblement rester sur son écran d'association.
- 📖 [G] marque l'appareil « initialisé » à la fin de cette file ; il n'en tire aucun accusé de la montre.

### File jouée par HealthTrack après l'authentification (`src/devices/huawei/association.js`)
Tout est chiffré (§6.5). Chaque message est facultatif : échec ou silence tolérés, consignés dans le journal
(`report.association.steps` : nom, envoyé / accepté / refusé / sans réponse, code 0x7F, jamais de valeur personnelle).
Capacités d'abord (§7.8, la demande 1/0x03 couvre aussi 1/0x30, 1/0x35, 1/0x3D, 1/0x3E, 0x1A/0x05–0x06, 7/0x02, 7/0x0E,
7/0x17, 7/0x24) ; un message n'est sauté que si la montre a dit « non ».

| Ordre | S/C | Rôle | Contenu (étiquettes) | Condition | Réponse |
|---|---|---|---|---|---|
| 1 | 1/0x07 | infos produit | 1 à 0x0A vides ; on ne lit que modèle (0x0A) et version logicielle (0x07) pour le journal ❓ numéros des champs | toujours | TLV |
| 2 | 0x1A/0x05 | compte étendu | 1 = identifiant de compte en ASCII, **ou un seul octet 0x00 sans compte** ; 3 = 1 si capacité étendue 172 | commandes 0x1A/5 et 0x1A/6 | non lue |
| 3 | 1/0x30 | **accords acceptés** | 0x81 { 3 × 0x82 { 3 = nom, 4 = 1 (accepté), 5 = version « 20230508-20230508-0-0 », 6 = heure en ms écrite en chiffres ASCII } } ; noms : `software_update_service_statement`, `device_information_management`, `user_license_agreement` | 1/0x30 | non lue |
| 4 | 1/0x3F | capacités du téléphone | 1 = 6 octets `FD F7 33 FA 29 37` (valeur publique annoncée par [G]) | capacité étendue 182 | non lue |
| 5 | 1/0x3E | **statut d'installation** | 1 = 1 (« appareil principal »), 2 = nom Bluetooth de la montre (UTF-8), 3 = 0 | capacité étendue 109 (inconnue = on envoie) | **aucune** : on n'attend pas |
| 6 | 1/0x3D | état de port | 1 vide | capacité 109 | non lue |
| 7 | 1/0x35 | état de connexion | 1 = 1 | 1/0x35 | non lue |
| 8 | 7/0x02 | profil (taille, poids, âge, sexe) | 1 = taille cm, 2 = poids kg, 3 = âge (1 octet chacun) ; 4 = date de naissance `année<<16 | mois<<8 | jour` (4 octets, si connue, 1er juillet par défaut faute de date exacte ❓) ; 5 = sexe 1 homme, 2 femme, 3 inconnu (3 seulement si capacité 0x57) ; 6 = pas de marche ≈ 0,42 × taille, 7 = pas de course ≈ 0,83 × taille | toujours | non lue |
| 9 | 7/0x0E | seuils de remontée | 0x81 { 3 × 2 = 5 octets : type, type de valeur, valeur (2), action } : (1, 3, 500, 2), (3, 3, 100, 2), (4, 3, 3600 ou 21600 avant 6 h, 2) | 7/0x0E | non lue |
| 10 | 1/0x32, 0x0C/0x01, 1/0x04 | fuseau, langue, format | 1/0x32 : 1 = heure Unix (4), 2 = décalage (2), 3 = nom du fuseau ; 0x0C/0x01 : 1 = « fr-FR », 2 = 0 (métrique) ; 1/0x04 : 0x81 { 2 = 3 (jour d'abord), 3 = 2 (24 h) } | toujours | non lue |
| 11 | 7/0x17, 7/0x24 | **FC et SpO₂ automatiques activées** | 1 = 1 | une seule fois par montre (`keys.configuredAt`) ; [G] ne l'envoie qu'au changement de réglage | — |

Réponse aux demandes de la montre (écoute installée dès l'authentification) :
- **1/0x10 infos du téléphone** : la montre liste des étiquettes sans valeur ; on répond une étiquette par étiquette
  demandée : 2 (fabricant) et 4 (modèle) vides, 8 = « 14 », 0x11 = version d'app sur 4 octets (1600103320 =
  16.1.3.320, valeur que [G] annonce), 0x15 vide, 0 et 0x0F omises, toute autre = un octet 0. Si le message ne porte que
  0x7F = 100000 c'est un accusé : on ne répond pas.
- 1/0x38 (contrôle de permissions) : format de réponse non consigné → seulement journalisé.

### La montre se considère-t-elle associée ?
Aucun accusé direct (1/0x3E est sans réponse). Indicateurs consignés dans `report.association` :
- `deviceStatus` lu en 1/0x16 avant la négociation (valeur brute) ; ❓ sens des valeurs au-delà de −1 / 0 / 1 inconnu ;
- liste des messages acceptés / refusés, nombre de demandes 1/0x10 reçues et servies ;
- **confirmation du propriétaire en un geste** à l'écran (« La montre affiche son cadran » / « Encore l'écran
  d'association ») : c'est l'information décisive tant qu'aucun message ne la donne ; elle part dans le journal.
- Une lecture qui ramène des mesures datées d'après la connexion prouve aussi l'association.

Hypothèse de travail ❓ : 1/0x3E (+ 1/0x30) fait quitter l'écran d'association ; si la montre affiche encore « Échec de
l'association » après cette file, la suite est d'appairer depuis cet écran (montre fraîchement réinitialisée,
HealthTrack lancé pendant que l'écran est affiché) et de lire dans le journal quelles demandes la montre a faites.

## 7. Données santé utiles (étape d)

Lecture du 13/10/2026 (run 04:30 Paris) : [G] (master, lecture seule, faits seulement, rapportés par un agent de
recherche sans code). Notations : `T{…}` = TLV imbriqué (étiquette avec le bit 0x80) ; entier = gros-boutiste ;
heures = secondes Unix UTC sur 4 octets. Tous ces messages sont **chiffrés** une fois l'authentification faite (§6.5).

### 7.1 Heure — 1/0x05 (envoyée avant la synchro)
- Étiquette 1 = heure Unix (4 octets) ; étiquette 2 = décalage horaire sur 2 octets : 1er octet = heures entières,
  **+128 si le décalage est négatif** ; 2e octet = minutes restantes. 📖 Paris en été (UTC+2) → `02 00` ; UTC−5 → `85 00` ;
  UTC+5:30 → `05 1E`.

### 7.2 Mesures minute par minute — 7/0x0A (nombre) puis 7/0x0B (une demande par bloc)
- **Nombre** : demande = `81` vide, puis **au premier niveau** 3 = début, 4 = fin (heures Unix). Début minimal accepté
  par certaines montres : 946 684 800 (1/1/2000), jamais 0. Réponse : `81 T{ 2 = nombre de blocs (2 octets) }`. Les
  blocs sont ensuite numérotés de 0 à nombre − 1 (aucune liste d'identifiants).
- **Bloc** : demande = `81 T{ 2 = numéro (2 octets) }`, dans l'ordre. Réponse : `81 T{ 2 = numéro, 3 = heure de début
  du bloc, puis une étiquette 0x84 par minute : T{ 5 = décalage en minutes (1 octet), 6 = octets de la minute } }`.
  Heure d'une minute = début + 60 × décalage.
- **Octets d'une minute** : un premier masque ; si son bit 0x80 est levé, l'octet suivant est un **second masque**.
  Viennent ensuite les valeurs des bits levés, dans l'ordre : premier masque de 0x01 à 0x40, puis second masque de
  0x01 à 0x80.

| Masque | Bit | Taille | Sens |
|---|---|---|---|
| 1 | 0x01 | 2 | inconnu (sauté) |
| 1 | 0x02 | 2 | **pas** |
| 1 | 0x04 | 2 | **calories** (kcal ❓) |
| 1 | 0x08 | 2 | **distance** (m ❓) |
| 1 | 0x10 | 2 | inconnu |
| 1 | 0x20 | 1 | inconnu (type / intensité ❓) |
| 1 | 0x40 | 1 | **fréquence cardiaque** de la minute |
| 2 | 0x01 | 1 | **SpO₂** (%) |
| 2 | 0x02 | 1 | **FC de repos** |
| 2 | 0x04–0x80 | 1 chacun | inconnus (sautés) |

- Valeur 0 (ou 0xFF pour un octet ❓) = pas de mesure : ignorée.
- ✅ Exemple de test (construit par nous) : début 1 727 040 000 ; minute 0 = `4E 00 50 00 04 00 3C 48` → 80 pas,
  4 kcal, 60 m, FC 72 ; minute 1 = `CE 03 00 64 00 05 00 4B 50 62 3A` → 100 pas, 5 kcal, 75 m, FC 80, SpO₂ 98,
  FC repos 58.

### 7.3 Sommeil (version simple) — 7/0x0C (nombre) puis 7/0x0D (blocs)
- Même demande / réponse de nombre que 7.2 (avec 0x0C), même demande de bloc (avec 0x0D).
- Réponse d'un bloc : `81 T{ 2 = numéro, une étiquette 0x83 par période : T{ 4 = type (1 octet), 5 = 6 octets :
  début (4) puis durée en minutes (2) } }`. Types : **6 = léger, 7 = profond** (pas de paradoxal ni d'éveil ici : ils
  viennent des fichiers détaillés, §7.6).

### 7.4 Totaux du jour — 7/0x03
- Demande : étiquette 1 vide. Réponse : `81 T{ 0x83 T{ 5 = pas, 6 = calories, 7 = distance (m) } … }` : additionner
  les éléments 0x83. Lire les entiers sur 1 à 4 octets.

### 7.5 Séances — service 0x17
Relecture du 13/10/2026 (run 10:30 Paris), [G] master, faits seulement rapportés par un agent de recherche.
- **0x17/0x07 liste** : demande `81 T{ 3 = début, 4 = fin }` (secondes, **dans** le conteneur, contrairement à 7/0x0A).
  Réponse `81 T{ 2 = nombre (2 octets), puis un 0x85 par séance : T{ 6 = numéro de séance (2 octets), 7 = nombre de
  blocs d'échantillons, 8 = nombre de blocs d'allure, … } }`. Le **numéro** est l'identifiant propre à la montre (pas
  une position) ; les sous-blocs sont numérotés de 0 à n − 1. Si le nombre annoncé ≠ nombre de 0x85, couper la
  période en deux et redemander (pas fait par HealthTrack pour l'instant : on prend les 0x85 reçus).
- **0x17/0x08 totaux** : demande `81 T{ 2 = numéro }`. Réponse `81 T{ … }` :

| Étiquette | Sens | Format |
|---|---|---|
| 2 | numéro | 2 octets |
| 3 | état | 1 octet |
| 4 / 5 | début / fin | secondes, 4 octets |
| 6 | calories | 4 octets, kcal ❓ |
| 7 | distance | 4 octets, m |
| 8 | pas | 4 octets |
| 0x0C | FC mini, FC maxi | 2 × 1 octet |
| 0x0E | effet d'entraînement aérobie | × 0,1 |
| 0x11 | temps de récupération | 2 octets, minutes |
| 0x12 | durée active | 4 octets, secondes |
| 0x14 | type de sport | 1 octet non signé |

- Types (0x14) : 1 course, 2 marche, 3 vélo, 4 randonnée en montagne, 5 course en salle, 6 natation en piscine, 7 vélo
  d'appartement, 8 natation en eau libre, 11 trail, 13 marche en salle, 14 randonnée, 21 corde à sauter, 128 tennis de
  table, 129 badminton, 130 tennis, 131 football, 132 basket, 133 volley, 134 elliptique, 135 rameur, 136 stepper,
  137 yoga, 138 pilates, 139 aérobic, 140 renforcement, 141 spinning, 143 HIIT, 145 CrossFit, 146 entraînement
  fonctionnel, 177 escaliers, 200 aviron, 224 padel, 255 autre. Inconnu → « autre ».
- Échantillons (0x17/0x0A, FC par seconde, vitesse…) et allures (0x17/**0x0C**) : décrits dans [G], **pas encore lus**
  par HealthTrack (étape suivante possible : FC moyenne et courbe de la séance).

### 7.6 Fichiers détaillés — service 0x2C
**Déroulé** (tous les messages sont chiffrés sauf mention) :
1. `0x2C/0x01` ouverture : demande `1 = nom` (texte), `2 = type` (1 octet), `5 = début`, `6 = fin` (secondes),
   `0x0C = dictionnaire` (4 octets, seulement pour le type 0x16). Réponse : `3 = identifiant du fichier` (1 octet),
   `4 = taille` (4 octets). Taille 0 ou 0xFFFFFFFF = rien à lire → passer à l'étape 5.
2. `0x2C/0x03` infos : demande `1 = identifiant` + étiquettes 2 à 5 vides. Réponse : `3 = taille d'un paquet poussé`,
   `4 = taille maxi d'un bloc` (4 octets), `5 = sans chiffrement` (booléen).
3. `0x2C/0x04` demande d'un bloc : `1 = identifiant`, `2 = position` (4 octets), `3 = taille` (min(reste, bloc maxi)),
   `4 = dictionnaire` (type 0x16). Envoyée **en clair** si « sans chiffrement ».
4. `0x2C/0x05` poussé par la montre (un ou plusieurs par bloc), **pas en TLV** : identifiant (1 octet), position
   (4 octets gros-boutistes), 1 octet inconnu, puis les données. S'il commence par `7C 01 01`, c'est l'enveloppe
   chiffrée habituelle (§6.5) : déchiffrer, on retrouve la même disposition. Recommencer 3 jusqu'à la taille annoncée.
5. `0x2C/0x06` fin : `1 = identifiant`, `2 = 1` (succès).
- (Une empreinte SHA-256 existe en 0x2C/0x02, inutile pour une lecture demandée par le téléphone.)
- Ancien service 0x0A (montres plus anciennes, noms séparés par « ; ») : non géré par HealthTrack.

**Types** : 0x0E `sleep_state.bin`, 0x0F `sleep_data.bin` (capteurs bruts, inutile), 0x10 `rrisqi_data.bin`
(stress), 0x16 `sequence_data` (dictionnaire).

**Sommeil détaillé = fichier `sequence_data`, type 0x16, dictionnaire 700013** (tout en gros-boutiste) :
- En-tête de fichier, 32 octets : taille des données (4), dictionnaire (4), type (2), version (2), 20 réservés.
- Puis des enregistrements (un par nuit ou sieste), chacun : en-tête de 32 octets = début (4), fin (4), version des
  données (1), type de résumé (1), longueur du résumé (2), longueur du détail (4), 16 octets inconnus ; puis le
  **résumé** (longueur annoncée), puis le **détail**.
- Résumé (type 2, version 1) : TLV ; des conteneurs contiennent des groupes `3 = numéro de champ` (4 octets),
  `4 = type de valeur` (1, 2, 4 = entier ; 3 = entier long ; 6 = réel double 8 octets ; 5 = texte), `5 = valeur`.
  Champs utiles (heures en secondes) : 700013298 coucher, 700013686 endormissement, 700013156 réveil, 700013973 lever,
  700013786 données valides, 700013245 **score de sommeil**, 700013878 **VFC moyenne** (ms ❓), 700013580 FC moyenne,
  700013436 / 700013502 FC mini / maxi, 700013635 réveils, 700013713 latence, 700013232 efficacité.
- Détail : **petit-boutiste**, suites de 8 octets : durée en secondes (4, multiple de 60), phase (1), 3 octets
  inconnus. Les phases se suivent sans trou depuis l'**heure de coucher** (si données valides), sinon depuis
  l'endormissement, arrondie à la minute. Phases : **1 léger, 2 paradoxal, 3 profond, 4 éveil, 5 sieste**.
- `sleep_state.bin` (type 0x0E) : petit-boutiste, enregistrements de 16 octets = début, fin, 8 inconnus → fenêtres
  de sommeil sans phases ; inutile si le dictionnaire répond.

**Stress** (`rrisqi_data.bin`, type 0x10, gros-boutiste) : en-tête (taille 8, masque 2, version 2), enregistrements
à partir de l'octet 48 pour la version 3 ; 66 octets chacun : début (4), fin (4), algorithme (4), **score** (1),
**niveau** (1), 4 drapeaux (1 chacun), 12 réels de 4 octets. La montre calcule elle-même le score. Ce ne sont **pas**
des intervalles RR. Pas encore lu par HealthTrack (aucun type « stress » dans l'historique pour l'instant).

**VFC hors sommeil** : pas par fichier, mais par le module « data dictionary sync » (classe 500044, champ 500044831 =
RMSSD, réel double), réservé aux montres qui annoncent la capacité 235. ❓ Imbrication exacte incertaine → plus tard.

### 7.8 Ce que la montre sait faire — service 1 (après l'authentification)
- **1/0x02 services** : demande `1 = liste des numéros de service` (octets). Réponse `2 = un octet par service
  demandé`, dans le même ordre, 1 = pris en charge. (Le service 1 est toujours pris en charge.)
- **1/0x03 commandes** : demande `81 T{ 2 = service, 3 = liste de commandes, 2 = service, 3 = …}`. Réponse
  `81 T{ 2 = service, 4 = un octet par commande demandée (1 = oui), … }` : un tableau aligné sur la demande, pas une
  liste ni un masque. Garder la demande petite (une trame).
- **1/0x37 capacités étendues** (si 1/0x37 est annoncé par 1/0x03) : demande `1` vide ; réponse `1 = octets` où la
  capacité N est le bit (N mod 8), poids faible d'abord, de l'octet ⌊N / 8⌋. Utiles : **143 sommeil par
  dictionnaire**, **235 VFC**, 107 apnée, 206 émotion.
- **1/0x31 réglages liés** : demande étiquettes 1 à 6 vides ; réponse `2 = masque` : 0x02 sommeil « nouvelle synchro »
  (service 0x2C), 0x04 RR / stress nouvelle synchro, 0x08 GPS.
- Indices : 7/0x16 présent = TruSleep ; 0x20/0x09 = stress automatique ; 0x17/0x01 = séances.
- 📖 GT 6 / GT 6 Pro (issue #5428) : traitée comme une montre Bluetooth classique Huawei sans particularité ; FC, SpO₂,
  stress, température, séances et sommeil confirmés par un testeur. ❓ La voie « dictionnaire » (143) est probable
  pour HarmonyOS 6, à confirmer par le journal.

### 7.7 Ordre suivi par HealthTrack
Heure (1/5) → capacités (1/0x02, 1/0x03, 1/0x31, 1/0x37 ; chaque échec est toléré) → sommeil simple (0x0C
puis 0x0D) → minutes (0x0A puis 0x0B) → totaux (0x03) → séances (0x17/0x07 puis 0x08 par séance) → sommeil détaillé
(0x2C, dictionnaire 700013, depuis la dernière synchro moins un jour). Une nuit détaillée **remplace** les périodes
simples (léger / profond) de la même nuit, déjà écrites ou non. Les lectures facultatives ne sont tentées que si les
capacités ne disent pas « non » (capacités illisibles = on essaie, et un échec ne bloque pas le reste). Fenêtre (depuis le 14/10 12:30) :
**première synchro depuis le 1/1/2000** (la montre rend ce qu'elle garde), ensuite depuis la **dernière synchro qui a
reçu des données** moins **6 h** de recouvrement, 30 jours au plus, jusqu'à l'heure pleine ; les doublons sont écartés
à l'écriture. Les **totaux du jour** (7/0x03) sont écrits comme « total du jour » et remplacés à chaque synchro (§7.9).

### 7.9 Messages spontanés de la montre et fenêtre de synchro (run du 14/10 12:30, journal v124)
Lecture de [G] master `75337cf73a` (14/10/2026), lecture seule, faits seulement rapportés par un agent de recherche.

| Message | Rôle | Réponse de [G] | Mesure ? |
|---|---|---|---|
| 0x37 (55)/0x01 | synchro de réglages « appareil uni » : 1 = paquet source, 2 = destination, 0x7F = code, 0x83 → 0x84 { 5 = numéro de réglage, 6 = action, 7 = données } (ex. objectifs) | aucune | non |
| 55/0x02 | événement de synchro : 1 / 2 = paquets, 3 = événement, 4 = niveau, 5 = données | aucune | non |
| 55/0x04 | dictionnaire de synchro (non décodé par [G]) | aucune | non |
| 0x0F (15)/0x04 | demande de météo (0x7F = 100010) | erreur « météo désactivée » ou écho 100000 en clair | non |
| 0x34 (52)/0x01 | message entre apps (P2P) : 1 = commande (1 ping, 2 données, 3 accusé), 2 = numéro, 3 / 4 = paquets… | accusé seulement pour les paquets connus | non |
| 8/0x08 | réveils (commande inconnue de [G]) | aucune | non |
| 0x1A (26)/0x05 | compte (réponse tardive à notre 0x1A/0x05) | aucune | non |
| 0x1F (31)/0x01 | demande d'éphémérides GPS : 0x81 { 2 = opération, 3 = heure } | ignorée sans fichier | non |
| 0x25 (37)/0x01 | appli musique ouverte sur la montre | accusé + infos du morceau | non |

- 📖 **Aucun message spontané ne porte de mesure** : [G] ne reçoit ni FC ni pas « en direct ». 7/0x1C (FC en temps réel)
  est un **réglage** (1 = booléen), pas un flux. Le seul flux est l'intervalle RR de la calibration du stress
  (0x19/0x01 début `1 = 3`, fin `1 = 4` ; données 0x19/0x05 : 0x82 → 0x83 { 4 = RR (2 octets), 5 = qualité, 0 = à jeter }).
  Stress, TruSleep, ECG : par fichiers. HealthTrack ne répond à aucun de ces messages (rien n'en dépend) et les nomme
  dans le journal (`pairing.js`, `SPONTANEOUS`).
- 📖 **Sommeil simple (7/0x0D)** : [G] ne connaît que 6 = léger, 7 = profond ; il **garde** les autres types comme
  « inconnu ». HealthTrack les écarte de l'historique mais note les types bruts dans le journal (« types 6×3, 9×1 »).
- 📖 **Totaux 7/0x03** : un conteneur 0x83 par type ou source, additionnés ; 5 = pas, 6 = calories, 7 = distance ;
  rien d'autre. 🩺 GT 6 Pro : 603 pas, 20 kcal, 529 m à 10:22 UTC.
- 📖 **Fenêtre** : [G] lit de la dernière mesure stockée jusqu'à **maintenant** ; la première fois depuis
  946 684 800 (1/1/2000). 🩺 Le défaut v124 (fenêtre 10:00 → 10:00) venait de HealthTrack (§7.7 mis à jour).
- 📖 **Tranches** : drapeau 1 / 2 / 3 + compteur (ignoré à la réception), service et commande dans la 1re seulement,
  taille d'envoi par défaut 0xF4. 🩺 Les « ? » du journal v124 étaient des morceaux RFCOMM (trames collées / coupées).

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
| (a bis) Analyse sûre des réponses 0x28 (`inspectHichainReply`) consignée dans le journal (`report.hichain`) ; étape et code précis nommés à l'écran ; déclenché par le journal réel GT 6 Pro (§6.7) | ✅ run 13/10 11:04 | `hichain.js` (`inspectHichainReply`), `pairing.js`, `testing/fakeWatch.js` (`garbleHichain`) |
| (a ter) Révéler les **champs** d'une réponse « New Auth » non-JSON (`probeStructure` : JSON intégré / TLV imbriqués) ; `head` 32 octets ; champs nommés à l'écran (§6.7) | ✅ run 13/10 14:30 | `hichain.js` (`probeStructure`, `findEmbeddedJson`), `testing/fakeWatch.js` (`newAuthHichain`) |
| (a quater) **Taille** de chaque champ (`fields`, `payloadFields` — octets / caractères / type, jamais la valeur) ; « challenge (16 o), epk (32 o)… » à l'écran et au journal, pour décoder d'un seul journal (§6.7) | ✅ run 13/10 18:30 | `hichain.js` (`describeFieldSizes`, `probeStructure`), `pairing.js` |
| (a quinquies) Lecture tolérante du JSON HiChain (NUL / octets de fin ignorés, `trailingBytes`), trame d'exemple ISO 0x8001 de 805 octets, fausse montre « JSON + NUL » (§6.9) | ☐ run 13/10 22:30 | `hichain.js`, `testing/fakeWatch.js` |
| (b) Détection et libération (boîte de désinstallation, réglages de l'app, guide de réinitialisation, plan B compte Huawei) + assistant d'appairage Android | ✅ run 13/10 00:30 | `src/devices/huawei/setup.js`, `components/WatchSetup.jsx`, `AppManagerPlugin.java`, `BtClassicPlugin.java` (`discover`, `pair`, `openBluetoothSettings`) |
| (c) Authentification HiChain (§6) : état, négociation, PIN, liaison, authentification, clé des trames, chiffrement GCM / CBC ; clés gardées en local ; constantes du PIN téléchargées sur le téléphone | ✅ run 13/10 02:30 (à valider sur la montre) | `src/devices/huawei/crypto.js`, `session.js`, `hichain.js`, `pairing.js`, `components/WatchConnect.jsx` |
| (c bis) Primitives « New Auth Protocol » (§6.8) : X25519 (multiplication scalaire sur point quelconque, ECDH), Ed25519 (signature / vérification) sur @noble/curves (MIT) ; vecteurs RFC 7748 / 8032 | ✅ run 13/10 16:30 | `src/devices/huawei/crypto.js` (`x25519ScalarMult`, `x25519SharedSecret`, `x25519Base`, `generateX25519KeyPair`, `ed25519Sign/Verify/PublicKey`, `generateEd25519KeyPair`) |
| (c ter) Fin d'association côté montre (§6.12) : accords 1/0x30, statut 1/0x3E, compte 0x1A/0x05 sans compte, profil 7/0x02, seuils 7/0x0E, fuseau / langue / format, FC et SpO₂ auto, réponses 1/0x10 ; indicateurs + confirmation du propriétaire | ✅ run 14/10 10:30 (à valider sur la montre) | `src/devices/huawei/association.js`, `pairing.js`, `components/WatchConnect.jsx` |
| (d) Synchronisation (§7.1–7.4, 7.7) : heure, sommeil simple, minutes (pas, calories, distance, FC, SpO₂, FC repos), totaux → IndexedDB | ✅ run 13/10 04:30 (à valider sur la montre) | `src/devices/huawei/sync.js`, `services/watchSync.js` |
| (d bis) Capacités (§7.8), séances (totaux, §7.5), sommeil détaillé par fichier (phases, score, VFC de la nuit, §7.6) | ✅ run 13/10 10:30 (à valider sur la montre) | `src/devices/huawei/sync.js`, `files.js`, `session.js` (messages bruts), `services/watchSync.js` |
| (d bis, suite) Stress (`rrisqi`), VFC de journée (dictionnaire 500044), échantillons de séance | ☐ | — |
| (d quater) Resynchro en arrière-plan, app fermée | ☐ | plan I49 |
