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
- 0x17/0x07 nombre : `81 T{ 3 = début, 4 = fin }` → `81 T{ 2 = nombre, 0x85 T{ 6 = numéro de séance, 7 = nombre de
  blocs de données, 8 = nombre d'allures, … } … }`.
- 0x17/0x08 totaux : `81 T{ 2 = numéro }` → `81 T{ 4 = début, 5 = fin, 6 = calories, 7 = distance (m), 8 = pas,
  0x12 = durée (s), 0x14 = type (1 octet), 0x0C = FC mini / maxi, … }`. Pas de FC moyenne (à calculer depuis 0x17/0x0A).

### 7.6 Fichiers détaillés (sommeil par phases, RR → VFC / stress) — service 0x2C
- 1 = ouverture (1 = nom, 2 = type, 5 = début, 6 = fin, 0x0C = dictionnaire pour le type 0x16) → 3 = identifiant,
  4 = taille ; 3 = infos (taille de bloc, 5 = « sans chiffrement » pour la commande 4) ; 4 = demande d'un bloc
  (1 = identifiant, 2 = position, 3 = taille) ; 5 = bloc **brut** poussé par la montre (identifiant 1 octet, position
  4 octets, 1 octet inconnu, données ; ou TLV chiffré s'il commence par `7C 01 01`) ; 6 = fin.
- Types : 0x0E état du sommeil, 0x0F données du sommeil, 0x10 RR, 0x16 « séquences » (dictionnaire 700013 = phases du
  sommeil, codes 1 léger, 2 paradoxal, 3 profond, 4 éveil, 5 sieste). `sleep_state` = suites de 16 octets
  **petit-boutistes** : début, fin, 8 octets inconnus.
- Ce qu'une montre sait faire se lit dans 1/0x03 (commandes prises en charge) : 7/0x16 = TruSleep, 0x20/0x09 = stress
  automatique, bit étendu 143 = sommeil par dictionnaire. ❓ À lire chez la GT 6 Pro (prochaine étape).

### 7.7 Ordre suivi par HealthTrack
Heure (1/5) → sommeil (0x0C puis 0x0D) → minutes (0x0A puis 0x0B) → totaux (0x03). Depuis la dernière synchro moins
une heure de recouvrement (7 jours la première fois) ; les doublons sont écartés à l'écriture.

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
| (c) Authentification HiChain (§6) : état, négociation, PIN, liaison, authentification, clé des trames, chiffrement GCM / CBC ; clés gardées en local ; constantes du PIN téléchargées sur le téléphone | ✅ run 13/10 02:30 (à valider sur la montre) | `src/devices/huawei/crypto.js`, `session.js`, `hichain.js`, `pairing.js`, `components/WatchConnect.jsx` |
| (d) Synchronisation (§7.1–7.4, 7.7) : heure, sommeil simple, minutes (pas, calories, distance, FC, SpO₂, FC repos), totaux → IndexedDB | ✅ run 13/10 04:30 (à valider sur la montre) | `src/devices/huawei/sync.js`, `services/watchSync.js` |
| (d bis) Fichiers détaillés (phases du sommeil, RR → VFC), séances, resynchro en arrière-plan | ☐ | — |
