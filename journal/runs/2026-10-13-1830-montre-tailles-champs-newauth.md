# 2026-10-13 18:30 Paris (16:30 UTC) — Priorité montre : taille des champs de la réponse « New Auth »

**Type** : ⌚🏗️ (priorité absolue — montre)  ·  **PR** : #142 (fusionnée → **v118**, APK publié ; Tests Vitest + émulateur A56 verts)

## Pourquoi
- Démarrage : **main vert** (f1a7dcc ; **v117** publiée, Tests Vitest + émulateur A56 verts sur le dernier commit de
  main). **Aucune PR « [Auto] » ouverte** (seule #51 `cursor/*`, non touchée, draft). Build & Release OK.
- **Priorité absolue = montre.** Blocage connu : la GT 6 Pro répond à notre message de début par une trame de **835
  octets** au format « New Auth Protocol » (HiChain 3) que l'ancien schéma ISO ne lit pas. Le vrai déblocage dépend du
  **prochain journal du propriétaire** — qui n'est **pas encore arrivé** (seul `diagnostics/2026-10-13-0904-gt6pro.json`,
  antérieur à l'analyseur de champs des runs 14:30 / 16:30).
- Constat : les runs 14:30 (noms des champs) et 16:30 (primitives X25519 / Ed25519) ont déjà préparé le terrain. Mais
  **nommer les champs ne suffit pas à écrire le décodeur** : il faut aussi savoir **combien d'octets** fait chacun (epk
  32, salt / challenge 16, signature Ed25519 64…). Sans ça, le prochain journal donnerait les noms, puis il faudrait
  **redemander** un journal pour les tailles → deux allers-retours là où un seul suffirait. C'est l'objet de ce run :
  rendre l'instrument capable de décoder **d'un seul journal**. Entièrement vérifiable sans la montre, et sans rien
  deviner (une taille n'est pas un secret, c'est de la structure, comme `jsonLength` ou `tag/size` déjà consignés).

## Ce qui a été fait
- **`probeStructure` (hichain.js) rapporte la taille de chaque champ** (TDD), à côté de `payloadKeys` :
  - nouvelle fonction `describeFieldSizes(obj)` : pour chaque champ, **octets** si la valeur est un hexadécimal,
    **caractères** si c'est une autre chaîne, sinon son **type** (`number`, `bool`, `object`…). **Jamais la valeur.**
  - `embeddedJson` porte désormais `fields` (objet entier) et `payloadFields` (le `payload`), en plus de `keys` /
    `payloadKeys`. Transmis tel quel dans le journal via `report.hichain[].structure` (aucun changement de pairing.js
    nécessaire au-delà de ce qui passait déjà `structure`).
  - le message d'erreur de `parseHichainReply` (donc le détail affiché à l'écran de connexion) devient
    « champs repérés : challenge (16 o), epk (32 o), salt (16 o) ».
- **Garde-fou anti-fuite** renforcé dans les tests : aucune valeur de champ (hex ou chaîne en clair) ne doit apparaître
  dans l'analyse ni dans le journal exporté.
- **Spec `protocoles/huawei.md`** : §6.7 complété (« Instrument renforcé, run 18:30 »), tableau §9 (lignes a ter / a
  quater ajoutées).
- **Backlog** : (a quater) ajouté et coché, « Prochaines étapes » #1 et « Fait » mis à jour.
- **Nouveautés** : entrée `2026-10-13-1830-montre-tailles-champs-newauth.json` (l'écran de connexion change de texte).

## Vérifications
- Tests : **1100 ✅** (81 fichiers ; assertions enrichies dans `hichain.test.js` — réponse « New Auth » d'exemple avec
  challenge/salt 16, epk 32, **signature 64**, champ `version` en clair → `payloadFields` exacts et anti-fuite — et
  `pairing.test.js` — détail « challenge (16 o), epk (32 o), salt (16 o) », `payloadFields`, aucune valeur hex 32 car.).
- Lint : **6 erreurs** (inchangé, baseline ; aucune dans les fichiers touchés) · Build ✅ · `npm run visual` : 8 pages
  OK, aucune erreur JS ; capture `/connectors` relue (carte « Montre Huawei en direct » intacte).
- **Rien n'est modifié sur la montre** ; aucun changement de schéma IndexedDB ; export / import inchangés ; aucune
  donnée ne sort du téléphone.
- **Non vérifiable sans la vraie montre** : les tailles réelles des champs de la GT 6 Pro (c'est justement ce que le
  prochain journal révélera) ; que le format soit bien JSON intégré (sinon la branche TLV du même instrument prend le
  relais).

## Apprentissages / décisions
- **Décoder d'un seul journal** : noms + **tailles** + code de message suffisent à mapper chaque champ sur son rôle
  SPEKE (§6.8). Ajouter les tailles maintenant évite un aller-retour au propriétaire.
- Cohérent avec la prudence des runs précédents : on **sharpen l'instrument** (structure, pas valeurs) plutôt que
  d'assembler le StepOne à l'aveugle tant que la variante Huawei n'est pas confirmée.
- Une taille est de la **structure, pas un secret** — même catégorie que `jsonLength` / `tag/size` déjà présents.

## Suite proposée
1. **Demander au propriétaire** (déjà dans le résumé hebdo) : relancer « Se connecter à la montre » → « Enregistrer le
   journal » et me le transmettre (`journal/diagnostics/`). `report.hichain[].structure` donne maintenant **noms +
   tailles** des champs.
2. Avec ces noms et tailles : **assembler le StepOne SPEKE** (c ter) à partir des primitives livrées (c bis) — StepOne,
   preuves `kcfData` (HMAC), échange d'identité Ed25519 chiffré GCM (§6.8), fausse montre « New Auth » complétée, tests
   sur trames. Point ouvert : PIN → point de base (Elligator2), signature « pré-hachée SHA-256 ».
3. (d quater) resynchro arrière-plan app fermée (I49) une fois l'appairage réel débloqué.

---
_Run autonome — garde-fous (test / build / lint / visual) respectés avant merge._
