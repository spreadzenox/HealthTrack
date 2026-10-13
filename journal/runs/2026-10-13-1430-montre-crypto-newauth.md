# 2026-10-13 16:30 Paris (14:30 UTC) — Priorité montre : primitives crypto « New Auth Protocol » (X25519 / Ed25519)

**Type** : ⌚🏗️ (priorité absolue — montre)  ·  **PR** : #NN (à compléter)

## Pourquoi
- Démarrage : **main vert** (21e2c3f ; **v116** publiée, Build APK + émulateurs A56 API 35/36 + Frontend Vitest tous
  verts). **Aucune PR « [Auto] » ouverte** (seule #51 `cursor/*`, non touchée). Build & Release de main OK.
- **Priorité absolue = montre.** Le blocage connu (journal réel GT 6 Pro du 13/10 09:04) : la montre répond à notre
  message de début par une trame de **835 octets** au format « New Auth Protocol » (HiChain 3) que l'ancien schéma ISO
  ne lit pas. Le run précédent (14:30) a livré l'instrument qui **révèlera les noms des champs** de cette réponse et la
  spec §6.8. Le propriétaire **n'a pas encore renvoyé** de nouveau journal (seul `diagnostics/2026-10-13-0904-gt6pro.json`).
- Assembler le StepOne SPEKE à l'aveugle serait un pari (la variante Huawei n'est pas documentée, même Gadgetbridge ne
  la décode pas). Mais une brique est **réalisable et entièrement vérifiable sans la montre** : les **primitives
  cryptographiques** que le SPEKE utilise, standard et testables sur vecteurs RFC. C'est l'objet de ce run : préparer la
  fondation pour que le run suivant, une fois les champs connus, écrive vite l'assemblage.

## Ce qui a été fait
- **X25519 et Ed25519 ajoutés à `crypto.js`** (TDD), sur **@noble/curves 2.4.0** (MIT, audité) :
  - `x25519ScalarMult(scalar, u)` — multiplication scalaire sur un point **quelconque**. C'est le point clé : le SPEKE
    multiplie par un point de base **dérivé du PIN**, or `crypto.subtle` (Web Crypto) ne sait faire X25519 que sur la
    base standard. Sert aussi à l'ECDH.
  - `x25519Base()`, `x25519SharedSecret(priv, peerPub)`, `generateX25519KeyPair()`.
  - `ed25519Sign`, `ed25519Verify` (renvoie `false` sans jamais jeter sur entrée invalide), `ed25519PublicKey`,
    `generateEd25519KeyPair()`.
  - HKDF-SHA256, HMAC-SHA256, AES-128-GCM : **existaient déjà** (rien à refaire).
- **Choix @noble plutôt que Web Crypto** : (1) multiplication sur point dérivé impossible avec `crypto.subtle` ;
  (2) @noble marche à l'identique quelle que soit la version de la WebView de l'A56 (X25519/Ed25519 dans Web Crypto
  dépendent d'une WebView très récente). Dépendance runtime MIT, pure-JS, nécessaire au pilote — pas un simple confort.
- **Elligator2 (hash-to-curve) volontairement NON ajouté** : la forme exacte du *map-to-point* de la variante Huawei
  n'est pas documentée ; l'implémenter maintenant serait deviner. @noble expose `_map_to_curve_elligator2_curve25519`
  si le besoin se confirme au prochain journal. Noté dans la spec §6.8.
- **Spec `protocoles/huawei.md`** : §6.8 mise à jour (« Primitives prêtes »), tableau §9 (ligne « c bis »).
- **Backlog** : (c bis) coché, (c ter) reformulé en « assembler à partir des primitives », « Prochaines étapes » #1
  réordonné (le vrai déblocage reste le journal du propriétaire).

## Vérifications
- Tests : **1100 ✅** (81 fichiers ; +8 dans `crypto.test.js` : X25519 vecteurs RFC 7748 §5.2 cas 1 & 2, base = 9,
  clé publique & ECDH RFC 7748 §6.1, `generateX25519KeyPair` symétrique ; Ed25519 vecteur déterministe RFC 8032 §7.1
  cas 2, rejet message/signature altérés sans jeter, `generateEd25519KeyPair`).
- Lint : **6 erreurs** (inchangé, baseline ; l'import @noble n'ajoute aucune erreur) · Build ✅ (bundle OK, avertissement
  de taille de chunk préexistant) · `npm run visual` : 8 pages OK, aucune erreur JS ; capture `/connectors` relue
  (carte « Montre Huawei en direct » intacte).
- **Rien n'est modifié sur la montre** ; aucun changement visible dans l'app (pas d'entrée « Nouveautés » : brique
  interne). Aucun changement de schéma IndexedDB, export/import inchangés. Aucune donnée ne sort du téléphone.
- **Non vérifiable sans la vraie montre** : que le SPEKE de la GT 6 Pro utilise bien X25519 (très probable vu `epk`
  32 octets) et quelle forme de hash-to-curve / signature. Les primitives, elles, sont prouvées sur vecteurs RFC.

## Apprentissages / décisions
- **Web Crypto est insuffisant pour le SPEKE** : pas de multiplication scalaire sur point dérivé. D'où @noble/curves.
- **Ne pas ajouter Elligator2 à l'aveugle** : cohérent avec la prudence des runs 11:04 / 14:30. On prépare la fondation
  sûre (primitives sur vecteurs RFC) sans parier sur la partie non documentée.
- Le vrai déblocage reste **le prochain journal du propriétaire** ; ce run réduit le travail du run d'après.

## Suite proposée
1. **Demander au propriétaire** (déjà dans le résumé hebdo) : relancer « Se connecter à la montre » → « Enregistrer le
   journal » et me le transmettre (`journal/diagnostics/`). `report.hichain[].structure` donnera les **noms des champs**.
2. Avec ces noms : **assembler le StepOne SPEKE** (c ter) à partir des primitives livrées — StepOne, preuves `kcfData`
   (HMAC), échange d'identité Ed25519 chiffré GCM (§6.8), fausse montre « New Auth » complétée, tests sur trames.
3. (d quater) resynchro arrière-plan app fermée (I49) une fois l'appairage réel débloqué.
