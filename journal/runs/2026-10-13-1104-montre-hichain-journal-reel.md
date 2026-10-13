# 2026-10-13 11:04 Paris (09:04 UTC) — Priorité montre : 1er journal réel GT 6 Pro + analyseur HiChain (D3 c bis / a bis)

**Type** : ⌚🏗️ (priorité absolue — exploitation du journal fourni par le propriétaire)  ·  **PR** : à ouvrir « [Auto] »

## Pourquoi
- Démarrage : main vert (40a67f6 ; v114 publiée avec APK, check du dernier commit OK), **aucune PR « [Auto] » ouverte**
  (seule #51 `cursor/*`, non touchée). Build & Release de main : dernière release v114 OK.
- **Donnée prioritaire du matin** : le propriétaire a lancé « Se connecter à la montre » sur sa **vraie Huawei Watch
  GT 6 Pro** et a renvoyé le journal exporté, expurgé. C'est la première vraie donnée sur l'appairage. Consigne du run :
  l'enregistrer, en tirer la spec et le backlog, améliorer l'analyseur et le diagnostic, prévoir des tests.

## Ce qui a été fait
- **Journal enregistré tel quel** : `journal/diagnostics/2026-10-13-0904-gt6pro.json` (+ entrée dans
  `diagnostics/README.md`, et liste des journaux reçus).
- **Diagnostic lu et consigné** (`protocoles/huawei.md` §6.7, nouveau marqueur de confiance 🩺 = confirmé par la vraie
  montre) : tableau trame par trame ; §4 complétée avec les **valeurs réelles** (protocole v2, authVersion 1,
  serverNonceLength 16, deviceSupportType 4 = **HiChain 3 / GCM**, bondState 0, encryptMethod absent, étiquettes
  13/15/16). Rôles consolidés des frames 0x01/0x16/0x33/0x2C/0x28. Faits : lien, négociation et PIN (64 octets) passent ;
  l'échec est au **décodage de la réponse 0x28 reçue (835 octets)** après l'envoi du message de début (695 octets),
  **sans code 0x7F** (d'où « code ? »). Hypothèses classées (n°1 la plus probable : HiChain 3 « New Auth Protocol »
  renvoie une réponse plus riche que l'ISO qu'on implémente — la taille le suggère). Écartés avec le seul journal :
  découpage en tranches (835 < maxLinkSize 1011), corps chiffré (0x28 en clair), erreur 0x7F (absente).
- **Code (TDD, écrit depuis la spec)** :
  - `hichain.js` : `inspectHichainReply(tlvs)` — analyse **sans secret** d'une réponse 0x28 : classification
    (`json_ok` / `json_unparsable` / `no_payload` / `result_error` / `final` / `empty` / `json_error`), `message`
    (hex), `errorCode`, `resultCode`, `type`, tailles des étiquettes, **noms** des champs JSON (`payloadKeys`, jamais
    leurs valeurs), 1ers octets si l'étiquette 1 n'est pas du JSON. `parseHichainReply` s'appuie dessus et lève des
    erreurs **précises** (l'analyse est attachée en `e.inspection`).
  - `pairing.js` : chaque échange 0x28 est analysé et consigné dans `report.hichain` (donc dans le journal exportable) ;
    l'étape « bind » / « auth » porte désormais le message précis à l'écran.
  - `testing/fakeWatch.js` : option `garbleHichain` pour rejouer une réponse 0x28 illisible (simule la GT 6 Pro).

## Vérifications
- Tests : **1090 ✅** (81 fichiers ; +5 depuis 1085 : inspecteur 3, parseur précis, bout-en-bout `garbleHichain` → `report.hichain`
  + aucune fuite de valeur). Test explicite : les valeurs sensibles (isoSalt, token, peerAuthId) **n'apparaissent pas**
  dans l'analyse, seuls les noms de champs.
- Lint : inchangé · Build ✅ · `npm run visual` : (à lancer avant merge).
- **Non vérifiable sans la vraie montre** : pourquoi la réponse 0x28 est illisible. Tout reste **derrière le mode
  diagnostic** ; rien n'est modifié sur la montre. Le prochain journal (`report.hichain`) tranchera.

## Décision de prudence (importante)
- **Je n'ai pas corrigé à l'aveugle** le format d'appairage ni le mode de déchiffrement du PIN. Les deux ont besoin du
  prochain journal : (1) la structure réelle de la réponse 0x28 ; (2) savoir si le PIN doit être déchiffré en GCM
  (type 4) plutôt qu'en CBC — c'est noté comme point ouvert dans la spec §6.7 et le backlog, mais ça ne change pas
  l'échec actuel (en aval). Ce run livre l'**instrument de mesure**, le prochain fera la correction.

## Suite proposée
1. **Demander au propriétaire** de relancer « Se connecter à la montre » puis « Enregistrer le journal » → le nouveau
   journal portera `report.hichain` pour la réponse de 835 octets.
2. Selon ce qu'il montre : réimplémenter la réponse de début HiChain 3 (format plus riche), et aligner le PIN sur GCM
   en type 4. Tests sur trames d'exemple à chaque étape.
3. (d quater) arrière-plan app fermée (I49) seulement une fois l'appairage réel débloqué.
