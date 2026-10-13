# 2026-10-13 14:30 Paris (12:30 UTC) — Priorité montre : révéler les champs de la réponse HiChain 3 + spec « New Auth Protocol »

**Type** : ⌚🏗️ (priorité absolue — montre)  ·  **PR** : #138 (fusionnée → **v116**, APK publié ; Frontend Vitest et Build APK verts sur la PR)

## Pourquoi
- Démarrage : main vert (1baa2e3 ; v115 publiée avec APK, Tests + émulateurs A56 verts), **aucune PR « [Auto] » ouverte**
  (seule #51 `cursor/*`, non touchée). Build & Release de main : dernière release **v115** OK.
- **Priorité absolue = montre.** Le blocage connu (journal réel du 13/10 09:04) : la GT 6 Pro parle **HiChain 3**
  (type 4, GCM, authVersion 1) et répond à notre message de début (695 octets) par une trame de **835 octets**
  illisible côté HealthTrack. Le run précédent (11:04) a livré l'instrument de mesure et a sagement **refusé de corriger
  à l'aveugle** : la correction a besoin de la structure réelle de cette réponse. Le propriétaire n'a **pas encore**
  renvoyé de nouveau journal (seul `diagnostics/2026-10-13-0904-gt6pro.json` présent).
- Ce run fait donc le travail montre **réalisable et vérifiable sans la montre** : comprendre en profondeur le
  « New Auth Protocol » (recherche), **renforcer l'instrument** pour que le prochain journal révèle les champs de la
  réponse, et consigner la spec. Aucune correction d'appairage à l'aveugle.

## Ce qui a été fait
- **Recherche approfondie du « New Auth Protocol » HiChain 3** (agent de recherche, [G] en lecture seule — faits
  seulement, aucun code copié ; recoupé avec [OH]). Résultats majeurs, consignés en **`protocoles/huawei.md` §6.8** :
  - 🩺 **Même Gadgetbridge ne décode pas encore la GT 6 Pro** : la couche PAKE n'y est activée que pour des **Honor** ;
    les coordinateurs **Huawei GT 6 / GT 7** retombent sur l'**ISO**. Notre blocage n'est donc pas un retard de notre
    côté mais un travail de frontière.
  - La GT 6 Pro reçoit bien notre StepOne ISO et répond au **format New Auth** (SPEKE / STS) : matériel d'identité
    **signé Ed25519** en plus → ~835 octets. Algorithmes : SPEKE sur **X25519** (ou DL-SPEKE), **HKDF-SHA256**,
    **HMAC-SHA256**, **Ed25519** (pré-haché SHA-256), **AES-128-GCM**. Codes de messages (0x8001/0x8002/0x8003 en
    liaison, 0x8011/0x8012 en reconnexion STS), champs attendus (`challenge`, `salt`, `epk`, `kcfData`, `exAuthInfo`),
    chaînes d'info HKDF et AAD — tout documenté avec nos mots et sources.
- **Point du PIN tranché** (§6.7) : la recherche confirme que le choix **GCM / CBC du PIN dépend uniquement de
  `encryptMethod` (0x0C), jamais du type 4**. La GT 6 Pro ne renvoie pas 0x0C → **CBC**, ce que `decryptPin` fait déjà.
  **Rien à changer** ; l'ancienne hypothèse « aligner le PIN sur GCM en type 4 » était fausse. Doute levé.
- **Instrument renforcé (TDD, `hichain.js`)** : le journal avait établi que l'étiquette 1 de la réponse de 835 octets
  **n'est pas du JSON** (le code v114 ne pouvait lever « illisible » qu'au `JSON.parse` de l'étiquette 1, sans code de
  résultat). `inspectHichainReply` **sonde maintenant la structure** d'une réponse non-JSON, **sans jamais rendre de
  valeur** (nouveau champ `structure`) :
  - **JSON intégré** derrière un préfixe binaire ou dans une autre étiquette → `offset`, `message` (hex) et **noms**
    des champs (`keys`, `payloadKeys`) ;
  - **TLV imbriqués** → liste `{étiquette, taille}` ;
  - en-tête (`head`) porté de 12 à **32 octets** ;
  - l'écran et le message d'erreur nomment les champs repérés (« champs repérés : challenge, epk, salt (probable
    New Auth Protocol HiChain 3) »). La charge portée par une autre étiquette que la 1 est sondée de même.
  - `pairing.js` : `report.hichain[]` embarque `structure` → présent dans le journal exporté.
- **Fausse montre étendue** (`testing/fakeWatch.js`) : option `newAuthHichain` qui rejoue une réponse New Auth
  (préfixe binaire + JSON SPEKE à valeurs factices) → test bout en bout de l'instrument.

## Vérifications
- Tests : **1093 ✅** (81 fichiers ; +3 : sonde JSON intégré + noms sans valeurs, sonde sur autre étiquette, bout en
  bout fausse montre New Auth → `report.hichain[0].structure` sans fuite de valeur). Test explicite de non-fuite
  (valeurs factices `A1B2C3`… absentes de l'analyse).
- Lint : **6 erreurs** (inchangé, baseline) · Build ✅ · `npm run visual` : 8 pages OK, aucune erreur JS ; capture
  `/connectors` relue (carte « Montre Huawei en direct » inchangée — l'évolution est derrière le test de connexion).
- **Non vérifiable sans la vraie montre** : la structure exacte de la réponse de 835 octets. Rien n'est modifié sur la
  montre ; tout reste derrière le mode diagnostic. Le prochain journal (`report.hichain[].structure`) la donnera.

## Apprentissages / décisions
- **Ne pas implémenter le New Auth à l'aveugle** : la variante Huawei (vs Honor) n'est pas documentée publiquement et
  même Gadgetbridge ne la décode pas. Un StepOne SPEKE écrit sans voir les champs réels serait très probablement faux.
  La bonne étape intermédiaire était donc l'**instrument** qui révélera ces champs, + la **spec** qui permettra d'écrire
  vite la suite une fois les noms connus. Cela respecte la prudence du run 11:04 tout en avançant réellement.
- La correction du PIN envisagée (GCM en type 4) aurait été une régression : à ne pas faire.

## Suite proposée
1. **Demander au propriétaire** : relancer « Se connecter à la montre » puis « Enregistrer le journal » et me le
   transmettre → `report.hichain[].structure` donnera les **noms des champs** de la réponse de 835 octets.
2. Avec ces noms : ajouter à `crypto.js` X25519 / HKDF / HMAC / Ed25519 / AES-128-GCM (Web Crypto + éventuel appoint),
   puis réimplémenter le StepOne SPEKE (§6.8), testé sur trames d'exemple, fausse montre New Auth complétée.
3. (d quater) arrière-plan app fermée (I49) une fois l'appairage réel débloqué.
